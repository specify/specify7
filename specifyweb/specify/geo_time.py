import logging
import os
from typing import List, Set
from django.db import connection
from django.db.models import Case, FloatField, F, Q, Value, When
from django.db.models.functions import Coalesce, Greatest, Least, Cast
from sqlalchemy import select, union_all, func, cast, DECIMAL, case, or_, and_, String, join
from sqlalchemy.orm import aliased
from decimal import Decimal

from specifyweb.specify.models import (
    Absoluteage,
    Relativeage,
    Geologictimeperiod,
    Collectionobject,
    Paleocontext,
)
from specifyweb.specify.utils import log_sqlalchemy_query
from specifyweb.stored_queries.models import (
    AbsoluteAge,
    RelativeAge,
    GeologicTimePeriod,
    CollectionObject,
    PaleoContext,
    CollectingEvent,
    Locality,
)

logger = logging.getLogger(__name__)

GEO_TIME_QUERY_IMPLEMENTATION = os.getenv('GEO_TIME_QUERY_IMPLEMENTATION', 'sqlalchemy') # 'django' or 'sqlalchemy'
GEO_TIME_QUERY_SQL_TYPE = os.getenv('GEO_TIME_QUERY_SQL_TYPE', 'meta') # 'modify' or 'raw', or 'filter', or 'meta'

# Table paths from CollectionObject to Absoluteage or GeologicTimePeriod:
# - collectionobject->absoluteage
# - collectionobject->relativeage->chronostrat
# - collectionobject->paleocontext->chronostrat
# - collectionobject->collectionevent->paleocontext->chronostrat
# - collectionobject->collectionevent->locality->paleocontext->chronostrat

# Field Paths from CollectionObject to Absoluteage or GeologicTimePeriod:
# - collectionobject__absoluteage__absoluteage
# - collectionobject__relativeage__agename__startperiod
# - collectionobject__relativeage__agename__endperiod
# - collectionobject__relativeage__agenameend__startperiod
# - collectionobject__relativeage__agenameend__endperiod
# - collectionobject__paleocontext__chronosstrat__startperiod
# - collectionobject__paleocontext__chronosstrat__endperiod
# - collectionobject__paleocontext__chronosstratend__startperiod
# - collectionobject__paleocontext__chronosstratend__endperiod
# - collectionobject__collectingevent__paleocontext__chronosstrat__startperiod
# - collectionobject__collectingevent__paleocontext__chronosstrat__endperiod
# - collectionobject__collectingevent__paleocontext__chronosstratend__startperiod
# - collectionobject__collectingevent__paleocontext__chronosstratend__endperiod
# - collectionobject__collectingevent__locality__paleocontext__chronosstrat__startperiod
# - collectionobject__collectingevent__locality__paleocontext__chronosstrat__endperiod
# - collectionobject__collectingevent__locality__paleocontext__chronosstratend__startperiod
# - collectionobject__collectingevent__locality__paleocontext__chronosstratend__endperiod

def assert_valid_time_range(start_time: float, end_time: float):
    """
    Asserts that the start_time is greater than or equal to the end_time.
    In geologic time, this means that start_time is older than end_time.
    """
    assert start_time >= end_time, "Start time must be greater than or equal to end time."

def search_co_ids_in_time_range(
    start_time: float, end_time: float, require_full_overlap: bool = False
) -> set[int]:
    """
    Search for collection object IDs that overlap with the given time range.

    :param start_time: The start time (older time) of the range.
    :param end_time: The end time (younger time) of the range.
    :param require_full_overlap: If True, only collections that fully overlap with the range are returned;
           otherwise, partial overlap is used.
    :return: A set of collection object IDs.
    """

    assert_valid_time_range(start_time, end_time)

    def get_uncertainty_value(uncertainty_field_name):
        return Coalesce(
            Cast(F(uncertainty_field_name), FloatField()),
            Value(0.0),
            output_field=FloatField()
        )

    def get_annotated_ages(model, start_field, end_field, require_full_overlap):
        uncertainty_value = get_uncertainty_value('ageuncertainty')
        if require_full_overlap:
            return model.objects.annotate(
                co_start_time_low=Cast(F(start_field), FloatField()) - uncertainty_value,
                co_end_time_high=Cast(F(end_field), FloatField()) + uncertainty_value
            )
        else:
            return model.objects.annotate(
                co_start_time_high=Cast(F(start_field), FloatField()) + uncertainty_value,
                co_end_time_low=Cast(F(end_field), FloatField()) - uncertainty_value
            )

    def get_overlap_filter(require_full_overlap, start_time, end_time):
        if require_full_overlap:
            return Q(co_start_time_low__lte=start_time, co_end_time_high__gte=end_time)
        else:
            return Q(co_end_time_low__lte=start_time, co_start_time_high__gte=end_time)

    def get_valid_chronostrat_filter(field_name):
        """
        Generate a filter to exclude records with invalid Chronostrat records, where startperiod < endperiod.
        
        :param field_name: The base name of the field to filter on.
        :return: A Q object representing the filter.
        """
        start_field = f'{field_name}__startperiod'
        end_field = f'{field_name}__endperiod'
        end_start_field = f'{field_name}end__startperiod'
        end_end_field = f'{field_name}end__endperiod'
        
        start_period_isnull = f'{field_name}__startperiod__isnull'
        end_period_isnull = f'{field_name}__endperiod__isnull'
        end_isnull_field = f'{field_name}end__isnull'
        end_start_period_isnull = f'{field_name}end__startperiod__isnull'
        end_end_period_isnull = f'{field_name}end__endperiod__isnull'
        
        return Q(**{start_period_isnull: False}) \
            & Q(**{end_period_isnull: False}) \
            & Q(**{f'{start_field}__gte': F(end_field)}) \
            & (
                (Q(**{end_isnull_field: True}) | Q(**{f'{end_start_field}__gte': F(end_end_field)})) | 
                (Q(**{end_start_period_isnull: False}) & Q(**{end_end_period_isnull: False}))
            )

    valid_relative_age_chronostrat_filter = get_valid_chronostrat_filter('agename')
    valid_paleocontext_chronostrat_filter = get_valid_chronostrat_filter('chronosstrat')

    # Adjusted absolute ages
    absolute_ages = get_annotated_ages(Absoluteage, 'absoluteage', 'absoluteage', require_full_overlap)
    absolute_overlap_filter = get_overlap_filter(require_full_overlap, start_time, end_time)
    absolute_co_ids = set(
        absolute_ages.filter(absolute_overlap_filter)
        .values_list("collectionobject_id", flat=True)
    )

    # Adjusted relative ages
    if require_full_overlap:
        relative_ages = Relativeage.objects.filter(
            valid_relative_age_chronostrat_filter
        ).annotate(
            co_start_time_low=Cast(F("agename__startperiod"), FloatField())
            - get_uncertainty_value("agename__startuncertainty")
            - get_uncertainty_value("ageuncertainty"),
            co_end_time_high=Cast(F("agename__endperiod"), FloatField())
            + get_uncertainty_value("agename__enduncertainty")
            + get_uncertainty_value("ageuncertainty")
        ).annotate(
            co_start_time_end_low=Cast(F("agenameend__startperiod"), FloatField())
            - get_uncertainty_value("agenameend__startuncertainty")
            - get_uncertainty_value("ageuncertainty"),
            co_end_time_end_high=Cast(F("agenameend__endperiod"), FloatField())
            + get_uncertainty_value("agenameend__enduncertainty")
            + get_uncertainty_value("ageuncertainty")
        ).annotate(
            co_start_time_low=Case(
                When(agenameend__isnull=False,
                    then=Greatest(F('co_start_time_low'), F('co_start_time_end_low'))),
                default=F('co_start_time_low'),
                output_field=FloatField()
            ),
            co_end_time_high=Case(
                When(agenameend__isnull=False,
                    then=Least(F('co_end_time_high'), F('co_end_time_end_high'))),
                default=F('co_end_time_high'),
                output_field=FloatField()
            )
        )
    else:
        relative_ages = Relativeage.objects.filter(
            valid_relative_age_chronostrat_filter
        ).annotate(
            co_start_time_high=Cast(F("agename__startperiod"), FloatField())
            + get_uncertainty_value("agename__startuncertainty")
            + get_uncertainty_value("ageuncertainty"),
            co_end_time_low=Cast(F("agename__endperiod"), FloatField())
            - get_uncertainty_value("agename__enduncertainty")
            - get_uncertainty_value("ageuncertainty")
        ).annotate(
            co_start_time_end_high=Cast(F("agenameend__startperiod"), FloatField())
            + get_uncertainty_value("agenameend__startuncertainty")
            + get_uncertainty_value("ageuncertainty"),
            co_end_time_end_low=Cast(F("agenameend__endperiod"), FloatField())
            - get_uncertainty_value("agenameend__enduncertainty")
            - get_uncertainty_value("ageuncertainty"),
        ).annotate(
            co_start_time_high=Case(
                When(agenameend__isnull=False,
                    then=Greatest(F('co_start_time_high'), F('co_start_time_end_high'))),
                default=F('co_start_time_high'),
                output_field=FloatField()
            ),
            co_end_time_low=Case(
                When(agenameend__isnull=False,
                    then=Least(F('co_end_time_low'), F('co_end_time_end_low'))),
                default=F('co_end_time_low'),
                output_field=FloatField()
            ),
        )

    relative_overlap_filter = get_overlap_filter(require_full_overlap, start_time, end_time)
    relative_age_co_ids = set(
        relative_ages.filter(relative_overlap_filter)
        .values_list("collectionobject_id", flat=True)
    )

    if require_full_overlap:
        paleocontexts = Paleocontext.objects.filter(
            valid_paleocontext_chronostrat_filter
        ).annotate(
            co_start_time_low=Cast(F("chronosstrat__startperiod"), FloatField())
            - get_uncertainty_value("chronosstrat__startuncertainty"),
            co_end_time_high=Cast(F("chronosstrat__endperiod"), FloatField())
            + get_uncertainty_value("chronosstrat__enduncertainty")
        ).annotate(
            co_start_time_end_low=Cast(F("chronosstratend__startperiod"), FloatField())
            - get_uncertainty_value("chronosstratend__startuncertainty"),
            co_end_time_end_high=Cast(F("chronosstratend__endperiod"), FloatField())
            + get_uncertainty_value("chronosstratend__enduncertainty")
        ).annotate(
            co_start_time_low=Case(
                When(chronosstratend__isnull=False,
                    then=Greatest(F('co_start_time_low'), F('co_start_time_end_low'))),
                default=F('co_start_time_low'),
                output_field=FloatField()
            ),
            co_end_time_high=Case(
                When(chronosstratend__isnull=False,
                    then=Least(F('co_end_time_high'), F('co_end_time_end_high'))),
                default=F('co_end_time_high'),
                output_field=FloatField()
            )
        )
    else:
        paleocontexts = Paleocontext.objects.filter(
            valid_paleocontext_chronostrat_filter
        ).annotate(
            co_start_time_high=Cast(F("chronosstrat__startperiod"), FloatField())
            + get_uncertainty_value("chronosstrat__startuncertainty"),
            co_end_time_low=Cast(F("chronosstrat__endperiod"), FloatField())
            - get_uncertainty_value("chronosstrat__enduncertainty")
        ).annotate(
            co_start_time_end_high=Cast(F("chronosstratend__startperiod"), FloatField())
            + get_uncertainty_value("chronosstratend__startuncertainty"),
            co_end_time_end_low=Cast(F("chronosstratend__endperiod"), FloatField())
            - get_uncertainty_value("chronosstratend__enduncertainty")
        ).annotate(
            co_start_time_high=Case(
                When(chronosstratend__isnull=False,
                    then=Greatest(F('co_start_time_high'), F('co_start_time_end_high'))),
                default=F('co_start_time_high'),
                output_field=FloatField()
            ),
            co_end_time_low=Case(
                When(chronosstratend__isnull=False,
                    then=Least(F('co_end_time_low'), F('co_end_time_end_low'))),
                default=F('co_end_time_low'),
                output_field=FloatField()
            )
        )

    # Overlap conditions
    if require_full_overlap:
        paleocontext_overlap_filter = Q(
            co_start_time_low__lte=start_time,
            co_end_time_high__gte=end_time
        )
    else:
        paleocontext_overlap_filter = Q(
            co_end_time_low__lte=start_time,
            co_start_time_high__gte=end_time
        )

    paleocontext_ids = paleocontexts.filter(paleocontext_overlap_filter).values_list('id', flat=True)

    # Fetch the Collection Object IDs from paleocontexts
    paleocontext_co_ids = set(
        Collectionobject.objects.filter(
            Q(paleocontext__in=paleocontext_ids) |
            Q(collectingevent__paleocontext__in=paleocontext_ids) |
            Q(collectingevent__locality__paleocontext__in=paleocontext_ids)
        ).values_list("id", flat=True)
    )

    # Return the union of the three collection object id sets
    co_ids = absolute_co_ids.union(relative_age_co_ids, paleocontext_co_ids)
    co_ids.discard(None)
    return co_ids

def search_co_ids_in_time_margin(
    time: float, uncertainty: float, require_full_overlap: bool = False
) -> set[int]:
    """
    Search for collection object IDs within a time margin.

    :param time: The central time.
    :param uncertainty: The uncertainty around the central time.
    :param require_full_overlap: If True, only collections that fully overlap with the range are returned.
    :return: A set of collection object IDs.
    """
    start_time = time + uncertainty
    end_time = time - uncertainty
    return search_co_ids_in_time_range(start_time, end_time, require_full_overlap)

def search_co_ids_in_time_period(
    time_period_name: str, require_full_overlap: bool = False
) -> set[int]:
    """
    Search for collection object IDs that overlap with the given geologic time period.

    :param time_period_name: The name of the time period.
    :param require_full_overlap: If True, only collections that fully overlap with the range are returned.
    :return: A set of collection object IDs.
    """
    time_period = Geologictimeperiod.objects.filter(name=time_period_name).first()
    if not time_period:
        return set()
    start_time = time_period.startperiod
    end_time = time_period.endperiod
    if start_time is None:
        start_time = 13800
    if end_time is None:
        end_time = 0
    return search_co_ids_in_time_range(start_time, end_time, require_full_overlap)

def query_co_in_time_range_with_joins(
    query,
    start_time,
    end_time,
    require_full_overlap=False,
):
    """
    Modify the given SQLAlchemy query to include filters that only select collection objects
    overlapping with the given time range, using joins.

    :param query: The existing SQLAlchemy query on CollectionObject.
    :param start_time: The start time (older time) of the range.
    :param end_time: The end time (younger time) of the range.
    :param require_full_overlap: If True, only collections that fully overlap with the range are returned.
    :return: A new query with the additional filters applied.
    """
    start_time = float(start_time)
    end_time = float(end_time)

    # Build the absolute age filters
    absolute_start_filter = Absoluteage.absoluteAge >= (
        start_time - Absoluteage.ageUncertainty
    )
    absolute_end_filter = Absoluteage.absoluteAge <= (
        end_time + Absoluteage.ageUncertainty
    )

    # Build the geologic time period filters
    chrono_start_filter = GeologicTimePeriod.startPeriod >= (
        start_time - GeologicTimePeriod.startUncertainty
    )
    chrono_end_filter = GeologicTimePeriod.endPeriod <= (
        end_time + GeologicTimePeriod.endUncertainty
    )

    if require_full_overlap:
        absolute_overlap_filter = and_(absolute_start_filter, absolute_end_filter)
        chrono_overlap_filter = and_(chrono_start_filter, chrono_end_filter)
    else:
        absolute_overlap_filter = or_(absolute_start_filter, absolute_end_filter)
        chrono_overlap_filter = or_(chrono_start_filter, chrono_end_filter)

    # AbsoluteAge query
    absolute_query = query.join(
        Absoluteage,
        CollectionObject.collectionObjectId == Absoluteage.collectionObjectId,
    ).filter(absolute_overlap_filter)

    # RelativeAge query
    chrono_query = query.join(
        RelativeAge,
        CollectionObject.collectionObjectId == RelativeAge.collectionObjectId,
    ).join(
        GeologicTimePeriod,
        RelativeAge.ageNameId == GeologicTimePeriod.geologicTimePeriodId,
    ).filter(chrono_overlap_filter)

    # PaleoContext via CollectionObject
    paleocontext_query1 = query.join(
        PaleoContext,
        CollectionObject.paleoContextId == PaleoContext.paleoContextId,
        isouter=True,
    ).join(
        GeologicTimePeriod,
        PaleoContext.chronosStratId == GeologicTimePeriod.geologicTimePeriodId,
        isouter=True,
    ).filter(chrono_overlap_filter)

    # PaleoContext via CollectingEvent
    paleocontext_query2 = query.join(
        CollectingEvent,
        CollectionObject.collectingEventId == CollectingEvent.collectingEventId,
        isouter=True,
    ).join(
        PaleoContext,
        CollectingEvent.paleoContextId == PaleoContext.paleoContextId,
        isouter=True,
    ).join(
        GeologicTimePeriod,
        PaleoContext.chronosStratId == GeologicTimePeriod.geologicTimePeriodId,
        isouter=True,
    ).filter(chrono_overlap_filter)

    # PaleoContext via CollectingEvent's Locality
    paleocontext_query3 = query.join(
        CollectingEvent,
        CollectionObject.collectingEventId == CollectingEvent.collectingEventId,
        isouter=True,
    ).join(
        Locality,
        CollectingEvent.localityId == Locality.localityId,
        isouter=True,
    ).join(
        PaleoContext,
        Locality.paleoContextId == PaleoContext.paleoContextId,
        isouter=True,
    ).join(
        GeologicTimePeriod,
        PaleoContext.chronosStratId == GeologicTimePeriod.geologicTimePeriodId,
        isouter=True,
    ).filter(chrono_overlap_filter)

    # Combine the queries using UNION to avoid duplicates
    combined_query = absolute_query.union(chrono_query, paleocontext_query1, paleocontext_query2, paleocontext_query3)

    return combined_query.distinct()

def query_co_in_time_margin(
    query, time: float, uncertainty: float, require_full_overlap: bool = False
):
    """
    Modify the given SQLAlchemy query to include filters that select collection objects
    within a time margin.

    :param query: The existing SQLAlchemy query on CollectionObject.
    :param time: The central time.
    :param uncertainty: The uncertainty around the central time.
    :param require_full_overlap: If True, only collections that fully overlap with the range are returned.
    :return: A new query with the additional filters applied.
    """
    start_time = time + uncertainty
    end_time = time - uncertainty
    return query_co_in_time_range_with_joins(query, start_time, end_time, require_full_overlap)

def query_co_in_time_period(query, time_period_name: str, require_full_overlap: bool = False):
    """
    Modify the given SQLAlchemy query to include filters that select collection objects
    overlapping with the given geologic time period.

    :param query: The existing SQLAlchemy query on CollectionObject.
    :param time_period_name: The name of the time period.
    :param require_full_overlap: If True, only collections that fully overlap with the range are returned.
    :return: A new query with the additional filters applied.
    """
    time_period = (
        GeologicTimePeriod.query.filter_by(name=time_period_name).first()
    )
    if not time_period:
        return query.filter(False)  # Returns an empty query

    start_time = time_period.startPeriod
    end_time = time_period.endPeriod
    return query_co_in_time_range_with_joins(query, start_time, end_time, require_full_overlap)

def modify_query_add_age_range(query, start_time: float, end_time: float, require_full_overlap: bool = False):
    """
    Given an existing SQLAlchemy query whose base entity is CollectionObject,
    this function adds an inner join to an aggregated subquery that computes,
    for each collection object (by its CollectionObjectID), the minimum end period and
    maximum start period (aggregated from three sources: AbsoluteAge, RelativeAge, and PaleoContext).
    """

    # Helper functions to build SQL expressions for the relative and paleo subqueries
    def build_relative_expr(is_start, a, aend, r):
        """
        Build the start (if is_start is True) or end expression for the RelativeAge subquery.
        When require_full_overlap is True, the expression uses uncertainty adjustments in one direction,
        and when False, in the opposite direction.
        """
        if require_full_overlap:
            if is_start:
                base_expr = (
                    cast(a.startPeriod, DECIMAL(10, 6))
                    - func.coalesce(a.startUncertainty, 0)
                    - func.coalesce(r.ageUncertainty, 0)
                )
                alt_expr = (
                    cast(aend.startPeriod, DECIMAL(10, 6))
                    - func.coalesce(aend.startUncertainty, 0)
                    - func.coalesce(r.ageUncertainty, 0)
                )
                expr_func = func.greatest
            else:
                base_expr = (
                    cast(a.endPeriod, DECIMAL(10, 6))
                    + func.coalesce(a.endUncertainty, 0)
                    + func.coalesce(r.ageUncertainty, 0)
                )
                alt_expr = (
                    cast(aend.endPeriod, DECIMAL(10, 6))
                    + func.coalesce(aend.endUncertainty, 0)
                    + func.coalesce(r.ageUncertainty, 0)
                )
                expr_func = func.least
        else:
            if is_start:
                base_expr = (
                    cast(a.startPeriod, DECIMAL(10, 6))
                    + func.coalesce(a.startUncertainty, 0)
                    + func.coalesce(r.ageUncertainty, 0)
                )
                alt_expr = (
                    cast(aend.startPeriod, DECIMAL(10, 6))
                    + func.coalesce(aend.startUncertainty, 0)
                    + func.coalesce(r.ageUncertainty, 0)
                )
                expr_func = func.greatest
            else:
                base_expr = (
                    cast(a.endPeriod, DECIMAL(10, 6))
                    - func.coalesce(a.endUncertainty, 0)
                    - func.coalesce(r.ageUncertainty, 0)
                )
                alt_expr = (
                    cast(aend.endPeriod, DECIMAL(10, 6))
                    - func.coalesce(aend.endUncertainty, 0)
                    - func.coalesce(r.ageUncertainty, 0)
                )
                expr_func = func.least
        return case(
            [(r.AgeNameEndID != None, expr_func(base_expr, alt_expr))],
            else_=base_expr
        )

    def build_paleo_expr(is_start, cs, csend, p):
        """
        Build the start (if is_start is True) or end expression for the PaleoContext subquery.
        The uncertainty adjustment and use of greatest/least depend on require_full_overlap.
        """
        if require_full_overlap:
            if is_start:
                base_expr = cast(cs.startPeriod, DECIMAL(10, 6)) - func.coalesce(cs.startUncertainty, 0)
                alt_expr = cast(csend.startPeriod, DECIMAL(10, 6)) - func.coalesce(csend.startUncertainty, 0)
                expr_func = func.greatest
            else:
                base_expr = cast(cs.endPeriod, DECIMAL(10, 6)) + func.coalesce(cs.endUncertainty, 0)
                alt_expr = cast(csend.endPeriod, DECIMAL(10, 6)) + func.coalesce(csend.endUncertainty, 0)
                expr_func = func.least
        else:
            if is_start:
                base_expr = cast(cs.startPeriod, DECIMAL(10, 6)) + func.coalesce(cs.startUncertainty, 0)
                alt_expr = cast(csend.startPeriod, DECIMAL(10, 6)) + func.coalesce(csend.startUncertainty, 0)
                expr_func = func.least
            else:
                base_expr = cast(cs.endPeriod, DECIMAL(10, 6)) - func.coalesce(cs.endUncertainty, 0)
                alt_expr = cast(csend.endPeriod, DECIMAL(10, 6)) - func.coalesce(csend.endUncertainty, 0)
                expr_func = func.greatest
        return case([(p.ChronosStratEndID != None, expr_func(base_expr, alt_expr))], else_=base_expr)

    # Build the AbsoluteAge subquery
    abs_sel = select([
        AbsoluteAge.CollectionObjectID.label("coid"),
        (
            cast(AbsoluteAge.absoluteAge, DECIMAL(10, 6))
            - func.coalesce(AbsoluteAge.ageUncertainty, 0)
        ).label("startperiod"),
        (
            cast(AbsoluteAge.absoluteAge, DECIMAL(10, 6))
            + func.coalesce(AbsoluteAge.ageUncertainty, 0)
        ).label("endperiod")
    ]).where(
        and_(
            (cast(AbsoluteAge.absoluteAge, DECIMAL(10, 6)) - func.coalesce(AbsoluteAge.ageUncertainty, 0)) <= start_time,
            (cast(AbsoluteAge.absoluteAge, DECIMAL(10, 6)) + func.coalesce(AbsoluteAge.ageUncertainty, 0)) >= end_time
        )
    )

    # Build the RelativeAge subquery
    ra = aliased(RelativeAge, name="ra")
    csa = aliased(GeologicTimePeriod, name="csa")
    csaend = aliased(GeologicTimePeriod, name="csaend")

    rel_start_expr = build_relative_expr(is_start=True, a=csa, aend=csaend, r=ra)
    rel_end_expr = build_relative_expr(is_start=False, a=csa, aend=csaend, r=ra)

    rel_join = join(
        ra, csa, ra.AgeNameID == csa.geologicTimePeriodId
    ).outerjoin(
        csaend, ra.AgeNameEndID == csaend.geologicTimePeriodId
    )
    rel_sel = select([
        ra.CollectionObjectID.label("coid"),
        rel_start_expr.label("startperiod"),
        rel_end_expr.label("endperiod")
    ]).select_from(rel_join).where(
        and_(
            csa.startPeriod != None,
            csa.endPeriod != None,
            csa.startPeriod >= csa.endPeriod,
            or_(
                ra.AgeNameEndID == None,
                and_(
                    csaend.startPeriod != None,
                    csaend.endPeriod != None,
                    csaend.startPeriod >= csaend.endPeriod
                )
            ),
            rel_start_expr <= start_time,
            rel_end_expr >= end_time
        )
    )

    # Build the PaleoContext subquery
    co = aliased(CollectionObject, name="co")
    ce = aliased(CollectingEvent, name="ce")
    loc = aliased(Locality, name="loc")
    pc = aliased(PaleoContext, name="pc")
    cs = aliased(GeologicTimePeriod, name="cs")
    csend = aliased(GeologicTimePeriod, name="csend")

    paleo_start_expr = build_paleo_expr(is_start=True, cs=cs, csend=csend, p=pc)
    paleo_end_expr = build_paleo_expr(is_start=False, cs=cs, csend=csend, p=pc)

    join_structure = join(
        co, ce, co.CollectingEventID == ce.collectingEventId, isouter=True
    )
    join_structure = join(
        join_structure, loc, ce.LocalityID == loc.localityId, isouter=True
    )
    join_structure = join(
        join_structure,
        pc,
        or_(
            co.PaleoContextID == pc.paleoContextId,
            ce.PaleoContextID == pc.paleoContextId,
            loc.PaleoContextID == pc.paleoContextId
        ),
        isouter=True
    )
    join_structure = join(
        join_structure, cs, pc.ChronosStratID == cs.geologicTimePeriodId, isouter=True
    )
    join_structure = join(
        join_structure, csend, pc.ChronosStratEndID == csend.geologicTimePeriodId, isouter=True
    )

    paleo_sel = select([
        co.collectionObjectId.label("coid"),
        paleo_start_expr.label("startperiod"),
        paleo_end_expr.label("endperiod")
    ]).select_from(join_structure).where(
        and_(
            pc.paleoContextId != None,
            cs.startPeriod != None,
            cs.endPeriod != None,
            cs.startPeriod >= cs.endPeriod,
            or_(
                pc.ChronosStratEndID == None,
                and_(
                    csend.startPeriod != None,
                    csend.endPeriod != None,
                    csend.startPeriod >= csend.endPeriod
                )
            ),
            paleo_start_expr <= start_time,
            paleo_end_expr >= end_time
        )
    ).distinct()

    # Union the three subqueries and aggregate
    union_subq = union_all(abs_sel, rel_sel, paleo_sel).alias("unioned")
    agg_subq = select([
        union_subq.c.coid,
        func.min(union_subq.c.endperiod).label("min_end_period"),
        func.max(union_subq.c.startperiod).label("max_start_period")
    ]).group_by(union_subq.c.coid).alias("agg_subq")

    # Build the formatted "age" column expression.
    age_expr = func.concat_ws(
        " - ",
        func.ifnull(func.regexp_replace(cast(agg_subq.c.max_start_period, String), "\\.(0+)$", ""), ""),
        func.ifnull(func.regexp_replace(cast(agg_subq.c.min_end_period, String), "\\.(0+)$", ""), "")
    ).label("age")

    # Modify the incoming query by joining the aggregated subquery
    base_entity = query.column_descriptions[0]["entity"]  # The base entity is CollectionObject
    new_query = query.join(agg_subq, base_entity.collectionObjectId == agg_subq.c.coid)
    new_query = new_query.add_columns(age_expr)
    return new_query

def geo_time_query(start_time: float, end_time: float, require_full_overlap: bool = False, query = None):
    """
    Search for collection object IDs that overlap with the given time range.
    Based on settings, choose the appropriate implementation.

    :param start_time: The start time (older time) of the range.
    :param end_time: The end time (younger time) of the range.
    :param require_full_overlap: If True, only collections that fully overlap with the range are returned.
    :param query: The existing SQLAlchemy query on CollectionObject.
    :return: A new query with the additional filters applied.
    """
    if GEO_TIME_QUERY_IMPLEMENTATION == 'django':
        return search_co_ids_in_time_range(start_time, end_time, require_full_overlap)
    elif GEO_TIME_QUERY_IMPLEMENTATION == 'sqlalchemy':
        if GEO_TIME_QUERY_SQL_TYPE == 'modify':
            return modify_query_add_age_range(query, start_time, end_time, require_full_overlap)
        elif GEO_TIME_QUERY_SQL_TYPE == 'meta':
            return modify_query_add_meta_age_range(query, start_time, end_time, require_full_overlap)
        elif GEO_TIME_QUERY_SQL_TYPE == 'filter':
            return query_co_in_time_range_with_joins(query, start_time, end_time, require_full_overlap)

def geo_time_period_query(time_period_name: str, require_full_overlap: bool = False, query = None):
    """
    Query for collection object IDs that overlap with the given geologic time period

    :param time_period_name: The name of the time period.
    :param require_full_overlap: If True, only collections that fully overlap with the range are returned.
    :param query: The existing SQLAlchemy query on CollectionObject.
    :return: A new query with the additional filters applied.
    """
    time_period = Geologictimeperiod.objects.filter(name=time_period_name).first()
    if not time_period:
        return set()
    start_time = time_period.startperiod
    end_time = time_period.endperiod
    # start_time += Decimal(time_period.startuncertainty) if time_period.startuncertainty else Decimal('0.1')
    # end_time += Decimal(time_period.enduncertainty) if time_period.enduncertainty else Decimal('0.1')
    if start_time is None:
        start_time = 13800 # max start time, 13800 is the age of the Universe
    if end_time is None:
        end_time = 0

    return geo_time_query(start_time, end_time, require_full_overlap, query)

def modify_query_add_meta_age_range(query, start_time, end_time, require_full_overlap=False):
    """
    Given an existing SQLAlchemy query (whose base is CollectionObject),
    add an inner join to an aggregated subquery that calculates, per CollectionObject,
    the maximum start period and minimum end period (with their uncertainties)
    from nine different age sources, and then applies an age range filter.
    """
    aa = aliased(AbsoluteAge, name="aa")
    ra = aliased(RelativeAge, name="ra")
    co = aliased(CollectionObject, name="co")
    ce = aliased(CollectingEvent, name="ce")
    loc = aliased(Locality, name="loc")
    pc = aliased(PaleoContext, name="pc")
    gtp_ra = aliased(GeologicTimePeriod, name="gtp_ra_agename")
    gtp_ra_end = aliased(GeologicTimePeriod, name="gtp_ra_agenameend")
    gtp_pc = aliased(GeologicTimePeriod, name="gtp_pc_chronostrat")
    gtp_pc_end = aliased(GeologicTimePeriod, name="gtp_pc_chronostratend")
    gtp_ce = aliased(GeologicTimePeriod, name="gtp_ce_pc_chronostrat")
    gtp_ce_end = aliased(GeologicTimePeriod, name="gtp_ce_pc_chronostratend")
    gtp_ce_loc = aliased(GeologicTimePeriod, name="gtp_ce_loc_pc_chronostrat")
    gtp_ce_loc_end = aliased(GeologicTimePeriod, name="gtp_ce_loc_pc_chronostratend")
    
    # Build the nine source subqueries (AllAgeData)
    # 1. Absolute Age
    co_aa_join = join(co, aa, aa.CollectionObjectID == co.collectionObjectId)
    abs_query = select([
         co.collectionObjectId.label("CollectionObjectID"),
         aa.absoluteAge.label("StartPeriod"),
         aa.absoluteAge.label("EndPeriod"),
         aa.ageUncertainty.label("StartUncertainty"),
         aa.ageUncertainty.label("EndUncertainty")
    ]).select_from(co_aa_join)
    
    # 2. Relative Age – AgeName
    co_ra_join = join(co, ra, ra.CollectionObjectID == co.collectionObjectId)
    co_ra_gtp_ra_join = join(co_ra_join, gtp_ra, ra.AgeNameID == gtp_ra.geologicTimePeriodId)
    rel_query = select([
         co.collectionObjectId.label("CollectionObjectID"),
         gtp_ra.startPeriod.label("StartPeriod"),
         gtp_ra.endPeriod.label("EndPeriod"),
         gtp_ra.startUncertainty.label("StartUncertainty"),
         gtp_ra.endUncertainty.label("EndUncertainty")
    ]).select_from(co_ra_gtp_ra_join)
    
    # 3. Relative Age – AgeNameEnd
    co_ra_join = join(co, ra, ra.CollectionObjectID == co.collectionObjectId)
    co_ra_gtp_ra_end_join = join(co_ra_join, gtp_ra_end, ra.AgeNameEndID == gtp_ra_end.geologicTimePeriodId)
    rel_end_query = select([
         co.collectionObjectId.label("CollectionObjectID"),
         gtp_ra_end.startPeriod.label("StartPeriod"),
         gtp_ra_end.endPeriod.label("EndPeriod"),
         gtp_ra_end.startUncertainty.label("StartUncertainty"),
         gtp_ra_end.endUncertainty.label("EndUncertainty")
    ]).select_from(co_ra_gtp_ra_end_join)
    
    # 4. PaleoContext – Chronostrat
    co_pc_join = join(co, pc, co.PaleoContextID == pc.paleoContextId)
    co_pc_gtp_pc_join = join(co_pc_join, gtp_pc, pc.ChronosStratID == gtp_pc.geologicTimePeriodId)
    pc_query = select([
         co.collectionObjectId.label("CollectionObjectID"),
         gtp_pc.startPeriod.label("StartPeriod"),
         gtp_pc.endPeriod.label("EndPeriod"),
         gtp_pc.startUncertainty.label("StartUncertainty"),
         gtp_pc.endUncertainty.label("EndUncertainty")
    ]).select_from(co_pc_gtp_pc_join)
    
    # 5. PaleoContext – ChronostratEnd
    co_pc_join = join(co, pc, co.PaleoContextID == pc.paleoContextId)
    co_pc_gtp_pc_end_join = join(co_pc_join, gtp_pc_end, pc.ChronosStratEndID == gtp_pc_end.geologicTimePeriodId)
    pc_end_query = select([
         co.collectionObjectId.label("CollectionObjectID"),
         gtp_pc_end.startPeriod.label("StartPeriod"),
         gtp_pc_end.endPeriod.label("EndPeriod"),
         gtp_pc_end.startUncertainty.label("StartUncertainty"),
         gtp_pc_end.endUncertainty.label("EndUncertainty")
    ]).select_from(co_pc_gtp_pc_end_join)
    
    # 6. CollectingEvent – PaleoContext Chronostrat
    co_ce_join = join(co, ce, co.CollectingEventID == ce.collectingEventId)
    co_ce_pc_join = join(co_ce_join, pc, ce.PaleoContextID == pc.paleoContextId)
    co_ce_pc_gtp_ce_join = join(co_ce_pc_join, gtp_ce, pc.ChronosStratID == gtp_ce.geologicTimePeriodId)
    ce_pc_query = select([
         co.collectionObjectId.label("CollectionObjectID"),
         gtp_ce.startPeriod.label("StartPeriod"),
         gtp_ce.endPeriod.label("EndPeriod"),
         gtp_ce.startUncertainty.label("StartUncertainty"),
         gtp_ce.endUncertainty.label("EndUncertainty")
    ]).select_from(co_ce_pc_gtp_ce_join)
    
    # 7. CollectingEvent – PaleoContext ChronostratEnd
    co_ce_join = join(co, ce, co.CollectingEventID == ce.collectingEventId)
    co_ce_pc_join = join(co_ce_join, pc, ce.PaleoContextID == pc.paleoContextId)
    co_ce_pc_gtp_ce_end_join = join(co_ce_pc_join, gtp_ce_end, pc.ChronosStratEndID == gtp_ce_end.geologicTimePeriodId)
    ce_pc_end_query = select([
         co.collectionObjectId.label("CollectionObjectID"),
         gtp_ce_end.startPeriod.label("StartPeriod"),
         gtp_ce_end.endPeriod.label("EndPeriod"),
         gtp_ce_end.startUncertainty.label("StartUncertainty"),
         gtp_ce_end.endUncertainty.label("EndUncertainty")
    ]).select_from(co_ce_pc_gtp_ce_end_join)
    
    # 8. CollectingEvent Locality – PaleoContext Chronostrat
    co_ce_join = join(co, ce, co.CollectingEventID == ce.collectingEventId)
    co_ce_loc_join = join(co_ce_join, loc, ce.LocalityID == loc.localityId)
    co_ce_loc_pc_join = join(co_ce_loc_join, pc, loc.PaleoContextID == pc.paleoContextId)
    co_ce_loc_gtp_ce_loc_join = join(co_ce_loc_pc_join,
                                     gtp_ce_loc,
                                     pc.ChronosStratID == gtp_ce_loc.geologicTimePeriodId)
    ce_loc_query = select([
         co.collectionObjectId.label("CollectionObjectID"),
         gtp_ce_loc.startPeriod.label("StartPeriod"),
         gtp_ce_loc.endPeriod.label("EndPeriod"),
         gtp_ce_loc.startUncertainty.label("StartUncertainty"),
         gtp_ce_loc.endUncertainty.label("EndUncertainty")
    ]).select_from(co_ce_loc_gtp_ce_loc_join)
    
    # 9. CollectingEvent Locality – PaleoContext ChronostratEnd
    co_ce_join = join(co, ce, co.CollectingEventID == ce.collectingEventId)
    co_ce_loc_join = join(co_ce_join, loc, ce.LocalityID == loc.localityId)
    co_ce_loc_pc_join = join(co_ce_loc_join, pc, loc.PaleoContextID == pc.paleoContextId)
    co_ce_loc_gtp_ce_loc_end_join = join(co_ce_loc_pc_join,
                                         gtp_ce_loc_end,
                                         pc.ChronosStratEndID == gtp_ce_loc_end.geologicTimePeriodId)
    ce_loc_end_query = select([
         co.collectionObjectId.label("CollectionObjectID"),
         gtp_ce_loc_end.startPeriod.label("StartPeriod"),
         gtp_ce_loc_end.endPeriod.label("EndPeriod"),
         gtp_ce_loc_end.startUncertainty.label("StartUncertainty"),
         gtp_ce_loc_end.endUncertainty.label("EndUncertainty")
    ]).select_from(co_ce_loc_gtp_ce_loc_end_join)
    
    # Union all nine subqueries into the AllAgeData CTE.
    all_age_data = union_all(
         abs_query, rel_query, rel_end_query, pc_query, pc_end_query,
         ce_pc_query, ce_pc_end_query, ce_loc_query, ce_loc_end_query
    ).alias("AllAgeData")
    
    # Create the RankedAges CTE using window functions.
    ranked_ages = select([
         all_age_data.c.CollectionObjectID,
         all_age_data.c.StartPeriod,
         all_age_data.c.EndPeriod,
         all_age_data.c.StartUncertainty,
         all_age_data.c.EndUncertainty,
         func.max(all_age_data.c.StartPeriod).over(
             partition_by=all_age_data.c.CollectionObjectID
         ).label("MaxStartPeriod"),
         func.min(all_age_data.c.EndPeriod).over(
             partition_by=all_age_data.c.CollectionObjectID
         ).label("MinEndPeriod")
    ]).alias("RankedAges")
    
    # Final aggregation: pick the uncertainties for the extreme values.
    start_uncertainty_case = func.coalesce(
        func.max(
            case([(ranked_ages.c.StartPeriod == ranked_ages.c.MaxStartPeriod,
                ranked_ages.c.StartUncertainty)])
        ), 0
    )
    end_uncertainty_case = func.coalesce(
        func.max(
            case([(ranked_ages.c.EndPeriod == ranked_ages.c.MinEndPeriod,
                ranked_ages.c.EndUncertainty)])
        ), 0
    )
    
    # Build the filter condition based on require_full_overlap.
    if require_full_overlap:
        filter_condition = and_(
            ranked_ages.c.MaxStartPeriod - start_uncertainty_case <= start_time,
            ranked_ages.c.MinEndPeriod + end_uncertainty_case >= end_time
        )
        # filter_condition = or_(
        #     and_(
        #         ranked_ages.c.MaxStartPeriod - start_uncertainty_case <= start_time,
        #         ranked_ages.c.MinEndPeriod + end_uncertainty_case >= end_time
        #     ),
        #     and_(
        #         ranked_ages.c.MaxStartPeriod + start_uncertainty_case >= start_time,
        #         ranked_ages.c.MinEndPeriod - end_uncertainty_case <= end_time
        #     )
        # )
    else:
        filter_condition = or_(
            and_(
                ranked_ages.c.MaxStartPeriod - start_uncertainty_case <= start_time,
                ranked_ages.c.MaxStartPeriod + start_uncertainty_case >= end_time
            ),
            and_(
                ranked_ages.c.MinEndPeriod - end_uncertainty_case <= start_time,
                ranked_ages.c.MinEndPeriod + end_uncertainty_case >= end_time
            ),
            and_(
                ranked_ages.c.MaxStartPeriod + start_uncertainty_case >= start_time,
                ranked_ages.c.MinEndPeriod - end_uncertainty_case <= end_time
            )
        )
    
    final_age_subq = select([
        ranked_ages.c.CollectionObjectID,
        ranked_ages.c.MaxStartPeriod,
        ranked_ages.c.MinEndPeriod,
        start_uncertainty_case.label("StartUncertaintyForMaxStartPeriod"),
        end_uncertainty_case.label("EndUncertaintyForMinEndPeriod")
    ]).group_by(
        ranked_ages.c.CollectionObjectID,
        ranked_ages.c.MaxStartPeriod,
        ranked_ages.c.MinEndPeriod
    ).having(
        and_(
            ranked_ages.c.MaxStartPeriod != None,
            ranked_ages.c.MinEndPeriod != None,
            filter_condition
        )
    ).alias("co_age_filter")
    
    # Join the aggregated subquery onto the incoming CollectionObject query.
    new_query = query.join(final_age_subq, CollectionObject.collectionObjectId == final_age_subq.c.CollectionObjectID)
    
    # Add a formatted age expression column (for example, concatenating max and min).
    age_expr = func.concat_ws(
        " - ",
        func.regexp_replace(
            func.regexp_replace(cast(final_age_subq.c.MaxStartPeriod, String),
                r'(\.[0-9]*[1-9])0+$', r'\1'),
            r'\.0+$', ''
        ),
        func.regexp_replace(
            func.regexp_replace(cast(final_age_subq.c.MinEndPeriod, String),
                r'(\.[0-9]*[1-9])0+$', r'\1'),
            r'\.0+$', ''
        )
    ).label("age")
    new_query = new_query.add_columns(age_expr)
    
    log_sqlalchemy_query(new_query)
    return new_query
