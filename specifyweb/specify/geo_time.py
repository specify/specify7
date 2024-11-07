from typing import List, Set
from django.db.models import Q, F, Value
from django.db.models.functions import Coalesce, Greatest
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

# Paths from CollectionObject to Absoluteage or GeologicTimePeriod:
# - collectionobject->paleocontext->chronostrat
# - collectionobject->collectionevent->paleocontext->chronostrat
# - collectionobject->collectionevent->locality->paleocontext->chronostrat
# - collectionobject->relativeage->chronostrat
# - collectionobject->absoluteage

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
    :param require_full_overlap: If True, only collections that fully overlap with the range are returned; otherwise, partial overlap is used.
    :return: A set of collection object IDs.
    """

    assert_valid_time_range(start_time, end_time)

    # Define the filters
    absolute_start_filter = Q(absoluteage__lte=start_time + Coalesce(F("ageuncertainty"), Value(0)))
    absolute_end_filter = Q(absoluteage__gte=end_time - Coalesce(F("ageuncertainty"), Value(0)))
    chrono_start_filter = Q(startperiod__lte=start_time + Coalesce(F("startuncertainty"), Value(0)))
    chrono_end_filter = Q(endperiod__gte=end_time - Coalesce(F("enduncertainty"), Value(0)))
    relative_start_filter = Q(
        agename__startperiod__lte=start_time 
        + Greatest(Coalesce(F("agename__startuncertainty"), Value(0)),
                   Coalesce(F("ageuncertainty"), Value(0))))
    relative_start_end_filter = Q(
        agename__endperiod__gte=end_time 
        - Greatest(Coalesce(F("agename__enduncertainty"), Value(0)),
                   Coalesce(F("ageuncertainty"), Value(0))))
    relative_end_end_filter = Q(
        agenameend__endperiod__gte=end_time 
        - Greatest(Coalesce(F("agename__enduncertainty"), Value(0)),
                   Coalesce(F("ageuncertainty"), Value(0))))
    paleocontext_start_filter = Q(
        chronosstrat__startperiod__lte=start_time
        + Coalesce(F("chronosstrat__startuncertainty"), Value(0))
    ) | Q(
        chronosstratend__startperiod__lte=start_time
        + Coalesce(F("chronosstratend__startuncertainty"), Value(0))
    )
    paleocontext_end_filter = Q(
        chronosstrat__endperiod__gte=end_time
        - Coalesce(F("chronosstrat__enduncertainty"), Value(0))
    ) | Q(
        chronosstratend__endperiod__gte=end_time
        - Coalesce(F("chronosstratend__enduncertainty"), Value(0))
    )

    # Combine the filters
    absolute_overlap_filter = absolute_start_filter | absolute_end_filter
    chrono_overlap_filter = chrono_start_filter | chrono_end_filter
    relative_overlap_filter = relative_start_filter | relative_start_end_filter
    relative_overlap_filter_with_age_end = relative_start_filter | relative_end_end_filter
    paleocontext_overlap_filter = paleocontext_start_filter | paleocontext_end_filter
    if require_full_overlap:
        absolute_overlap_filter = absolute_start_filter & absolute_end_filter
        chrono_overlap_filter = chrono_start_filter & chrono_end_filter
        relative_overlap_filter = relative_start_filter & relative_start_end_filter
        relative_overlap_filter_with_age_end = relative_start_filter & relative_end_end_filter
        paleocontext_overlap_filter = paleocontext_start_filter & paleocontext_end_filter

    # Fetch the Collection Object IDs from absolute ages
    absolute_co_ids = set(
        Absoluteage.objects.filter(absolute_overlap_filter)
        .values_list("collectionobject_id", flat=True)
    )

    # Fetch the Collection Object IDs from relative ages
    relative_age_co_ids = set(
        Relativeage.objects.filter(
            (Q(agenameend__isnull=True) & relative_overlap_filter) |
            (Q(agenameend__isnull=False) & relative_overlap_filter_with_age_end)
        ).values_list("collectionobject_id", flat=True)
    )

    # Fetch the Collection Object IDs from paleocontexts
    paleocontext_co_ids = set(
        Collectionobject.objects.filter(
            Q(paleocontext__in=Paleocontext.objects.filter(paleocontext_overlap_filter)) |
            Q(collectingevent__paleocontext__in=Paleocontext.objects.filter(paleocontext_overlap_filter)) |
            Q(collectingevent__locality__paleocontext__in=Paleocontext.objects.filter(paleocontext_overlap_filter))
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
