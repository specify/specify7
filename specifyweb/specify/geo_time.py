from typing import List, Set
from django.db.models import Case, FloatField, F, Q, Value, When
from django.db.models.functions import Coalesce, Greatest, Least, Cast
from sqlalchemy import func, literal, or_, and_, exists
from sqlalchemy.orm import aliased

from specifyweb.specify.models import (
    Absoluteage,
    Relativeage,
    Geologictimeperiod,
    Collectionobject,
    Paleocontext,
    Collectingevent,
    Locality,
)
from specifyweb.stored_queries import models as sq_models

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
) -> Set[int]:
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
) -> Set[int]:
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
) -> Set[int]:
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
    absolute_start_filter = sq_models.Absoluteage.absoluteAge >= (
        start_time - sq_models.Absoluteage.ageUncertainty
    )
    absolute_end_filter = sq_models.Absoluteage.absoluteAge <= (
        end_time + sq_models.Absoluteage.ageUncertainty
    )

    # Build the geologic time period filters
    chrono_start_filter = sq_models.GeologicTimePeriod.startPeriod >= (
        start_time - sq_models.GeologicTimePeriod.startUncertainty
    )
    chrono_end_filter = sq_models.GeologicTimePeriod.endPeriod <= (
        end_time + sq_models.GeologicTimePeriod.endUncertainty
    )

    if require_full_overlap:
        absolute_overlap_filter = and_(absolute_start_filter, absolute_end_filter)
        chrono_overlap_filter = and_(chrono_start_filter, chrono_end_filter)
    else:
        absolute_overlap_filter = or_(absolute_start_filter, absolute_end_filter)
        chrono_overlap_filter = or_(chrono_start_filter, chrono_end_filter)

    # AbsoluteAge query
    absolute_query = query.join(
        sq_models.Absoluteage,
        sq_models.CollectionObject.collectionObjectId == sq_models.Absoluteage.collectionObjectId,
    ).filter(absolute_overlap_filter)

    # RelativeAge query
    chrono_query = query.join(
        sq_models.RelativeAge,
        sq_models.CollectionObject.collectionObjectId == sq_models.RelativeAge.collectionObjectId,
    ).join(
        sq_models.GeologicTimePeriod,
        sq_models.RelativeAge.ageNameId == sq_models.GeologicTimePeriod.geologicTimePeriodId,
    ).filter(chrono_overlap_filter)

    # PaleoContext via CollectionObject
    paleocontext_query1 = query.join(
        sq_models.PaleoContext,
        sq_models.CollectionObject.paleoContextId == sq_models.PaleoContext.paleoContextId,
        isouter=True,
    ).join(
        sq_models.GeologicTimePeriod,
        sq_models.PaleoContext.chronosStratId == sq_models.GeologicTimePeriod.geologicTimePeriodId,
        isouter=True,
    ).filter(chrono_overlap_filter)

    # PaleoContext via CollectingEvent
    paleocontext_query2 = query.join(
        sq_models.CollectingEvent,
        sq_models.CollectionObject.collectingEventId == sq_models.CollectingEvent.collectingEventId,
        isouter=True,
    ).join(
        sq_models.PaleoContext,
        sq_models.CollectingEvent.paleoContextId == sq_models.PaleoContext.paleoContextId,
        isouter=True,
    ).join(
        sq_models.GeologicTimePeriod,
        sq_models.PaleoContext.chronosStratId == sq_models.GeologicTimePeriod.geologicTimePeriodId,
        isouter=True,
    ).filter(chrono_overlap_filter)

    # PaleoContext via CollectingEvent's Locality
    paleocontext_query3 = query.join(
        sq_models.CollectingEvent,
        sq_models.CollectionObject.collectingEventId == sq_models.CollectingEvent.collectingEventId,
        isouter=True,
    ).join(
        sq_models.Locality,
        sq_models.CollectingEvent.localityId == sq_models.Locality.localityId,
        isouter=True,
    ).join(
        sq_models.PaleoContext,
        sq_models.Locality.paleoContextId == sq_models.PaleoContext.paleoContextId,
        isouter=True,
    ).join(
        sq_models.GeologicTimePeriod,
        sq_models.PaleoContext.chronosStratId == sq_models.GeologicTimePeriod.geologicTimePeriodId,
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

def query_co_in_time_period(
    query, time_period_name: str, require_full_overlap: bool = False
):
    """
    Modify the given SQLAlchemy query to include filters that select collection objects
    overlapping with the given geologic time period.

    :param query: The existing SQLAlchemy query on CollectionObject.
    :param time_period_name: The name of the time period.
    :param require_full_overlap: If True, only collections that fully overlap with the range are returned.
    :return: A new query with the additional filters applied.
    """
    time_period = (
        sq_models.GeologicTimePeriod.query.filter_by(name=time_period_name).first()
    )
    if not time_period:
        return query.filter(False)  # Returns an empty query

    start_time = time_period.startPeriod
    end_time = time_period.endPeriod
    return query_co_in_time_range_with_joins(query, start_time, end_time, require_full_overlap)

def query_co_in_time_range(query, start_time, end_time, require_full_overlap=False, session=None):
    """
    Filter the given SQLAlchemy query of CollectionObject to include only those that overlap with the given time range.

    :param query: An SQLAlchemy query on CollectionObject.
    :param start_time: The start time of the range.
    :param end_time: The end time of the range.
    :param require_full_overlap: If True, only collections that fully overlap with the range are returned, otherwise partial overlap is used.
    :param session: The SQLAlchemy session.
    :return: A filtered SQLAlchemy query.
    """

    # Validate time range
    if start_time > end_time:
        raise ValueError("start_time must be less than or equal to end_time")

    # Build filters for Absoluteage
    absolute_start_filter = Absoluteage.absoluteage >= (start_time + Absoluteage.ageuncertainty)
    absolute_end_filter = Absoluteage.absoluteage <= (end_time - Absoluteage.ageuncertainty)

    if require_full_overlap:
        absolute_overlap_filter = and_(absolute_start_filter, absolute_end_filter)
    else:
        absolute_overlap_filter = or_(absolute_start_filter, absolute_end_filter)

    # Query Absoluteage to get collectionobject_ids
    absolute_co_ids_subquery = (
        session.query(Absoluteage.collectionobject_id)
        .filter(absolute_overlap_filter)
    ).subquery()

    # Build filters for Geologictimeperiod
    chrono_start_filter = Geologictimeperiod.startperiod >= (start_time + Geologictimeperiod.startuncertainty)
    chrono_end_filter = Geologictimeperiod.endperiod <= (end_time - Geologictimeperiod.enduncertainty)

    if require_full_overlap:
        chrono_overlap_filter = and_(chrono_start_filter, chrono_end_filter)
    else:
        chrono_overlap_filter = or_(chrono_start_filter, chrono_end_filter)

    # Get collectionobject_ids via Agename
    # Assuming Agename has a relationship to CollectionObject
    relative_agename_co_ids_subquery = (
        session.query(sq_models.Agename.collectionobject_id)
        .join(Geologictimeperiod, sq_models.Agename.geologictimeperiod_id == Geologictimeperiod.id)
        .filter(chrono_overlap_filter)
    ).subquery()

    # Get collectionobject_ids via Agenameend
    relative_agenameend_co_ids_subquery = (
        session.query(sq_models.Agenameend.collectionobject_id)
        .join(Geologictimeperiod, sq_models.Agenameend.geologictimeperiod_id == Geologictimeperiod.id)
        .filter(chrono_overlap_filter)
    ).subquery()

    # Union of the two
    relative_age_co_ids_subquery = (
        session.query(relative_agename_co_ids_subquery.c.collectionobject_id)
        .union(
            session.query(relative_agenameend_co_ids_subquery.c.collectionobject_id)
        )
    ).subquery()

    # Build filters for Paleocontext
    paleocontext_start_filter = or_(
        Paleocontext.startperiod >= (start_time + Paleocontext.startuncertainty),
        sq_models.Paleocontextend.startperiod >= (start_time + sq_models.Paleocontextend.startuncertainty)
    )

    paleocontext_end_filter = or_(
        Paleocontext.endperiod <= (end_time - Paleocontext.enduncertainty),
        sq_models.Paleocontextend.endperiod <= (end_time - sq_models.Paleocontextend.enduncertainty)
    )

    if require_full_overlap:
        paleocontext_overlap_filter = and_(paleocontext_start_filter, paleocontext_end_filter)
    else:
        paleocontext_overlap_filter = or_(paleocontext_start_filter, paleocontext_end_filter)

    # Get matching Paleocontext IDs
    matching_paleocontext_ids_subquery = (
        session.query(Paleocontext.id)
        .filter(paleocontext_overlap_filter)
    ).subquery()

    # Get collectionobject IDs where Paleocontext matches
    paleocontext_co_ids_subquery = (
        session.query(sq_models.CollectionObject.id)
        .outerjoin(sq_models.CollectionObject.paleocontext)
        .outerjoin(sq_models.CollectionObject.collectingevent)
        .outerjoin(sq_models.Collectingevent.paleocontext)
        .outerjoin(sq_models.Collectingevent.locality)
        .outerjoin(sq_models.Locality.paleocontext)
        .filter(
            or_(
                sq_models.CollectionObject.paleocontext_id.in_(matching_paleocontext_ids_subquery),
                sq_models.Collectingevent.paleocontext_id.in_(matching_paleocontext_ids_subquery),
                sq_models.Locality.paleocontext_id.in_(matching_paleocontext_ids_subquery)
            )
        )
    ).subquery()

    # Union all collectionobject IDs
    total_co_ids_subquery = (
        session.query(absolute_co_ids_subquery.c.collectionobject_id)
        .union(
            session.query(relative_age_co_ids_subquery.c.collectionobject_id),
            session.query(paleocontext_co_ids_subquery.c.id)
        )
    ).subquery()

    # Filter the original query
    filtered_query = query.filter(sq_models.CollectionObject.id.in_(
        session.query(total_co_ids_subquery.c.collectionobject_id)
    ))

    return filtered_query
