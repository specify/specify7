from typing import List, Set
from django.db.models import Q, F
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
    absolute_start_filter = Q(absoluteage__absoluteage__gte=start_time - F("ageuncertainty"))
    absolute_end_filter = Q(absoluteage__absoluteage__lte=end_time + F("ageuncertainty"))
    chrono_start_filter = Q(
        relativeage__geologictimeperiod__startperiod__gte=start_time - F("relativeage__geologictimeperiod__startuncertainty")
    )
    chrono_end_filter = Q(
        relativeage__geologictimeperiod__endperiod__lte=end_time + F("relativeage__geologictimeperiod__enduncertainty")
    )

    if require_full_overlap:
        absolute_overlap_filter = absolute_start_filter & absolute_end_filter
        chrono_overlap_filter = chrono_start_filter & chrono_end_filter
    else:
        absolute_overlap_filter = absolute_start_filter | absolute_end_filter
        chrono_overlap_filter = chrono_start_filter | chrono_end_filter

    # Fetch the IDs
    absolute_co_ids = set(
        Absoluteage.objects.filter(absolute_overlap_filter).values_list(
            "collectionobject_id", flat=True
        )
    )

    relative_age_co_ids = set(
        Relativeage.objects.filter(chrono_overlap_filter).values_list(
            "collectionobject_id", flat=True
        )
    )

    paleocontext_filter = Q(
        paleocontext__chronosstrat__startperiod__gte=start_time
        - F("paleocontext__chronosstrat__startuncertainty")
    ) | Q(
        paleocontext__chronosstrat__endperiod__lte=end_time
        + F("paleocontext__chronosstrat__enduncertainty")
    )

    collectingevent_filter = Q(
        collectingevent__paleocontext__chronosstrat__startperiod__gte=start_time
        - F("collectingevent__paleocontext__chronosstrat__startuncertainty")
    ) | Q(
        collectingevent__paleocontext__chronosstrat__endperiod__lte=end_time
        + F("collectingevent__paleocontext__chronosstrat__enduncertainty")
    )

    locality_filter = Q(
        collectingevent__locality__paleocontext__chronosstrat__startperiod__gte=start_time
        - F("collectingevent__locality__paleocontext__chronosstrat__startuncertainty")
    ) | Q(
        collectingevent__locality__paleocontext__chronosstrat__endperiod__lte=end_time
        + F("collectingevent__locality__paleocontext__chronosstrat__enduncertainty")
    )

    if require_full_overlap:
        paleocontext_filter = paleocontext_filter & collectingevent_filter & locality_filter
    else:
        paleocontext_filter = paleocontext_filter | collectingevent_filter | locality_filter

    paleocontext_co_ids = set(
        Collectionobject.objects.filter(paleocontext_filter).values_list("id", flat=True)
    )

    return absolute_co_ids.union(relative_age_co_ids, paleocontext_co_ids)


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
