from itertools import chain
from typing import List
from django.db.models import Q, F
from numpy import absolute
from sqlalchemy.sql import or_, and_

from specifyweb.specify.models import AbsoluteAge, RelativeAge, Geologictimeperiod, Collectionobject
from specifyweb.stored_queries import models as sq_models

# TODO: Integrate into the query builder

# Paths from CollectionObject to AbsoluteAge or GeologicTimePeriod:
# - CollectionObject

def assert_valid_time_range(start_time: float, end_time: float):
    assert start_time <= end_time, "Start time must be less than or equal to end time."

def search_co_ids_in_time_range(start_time: float, end_time: float, require_full_overlap: bool = False) -> List[int]:
    """
    Search for collections that overlap with the given time range.

    :param start_time: The start time of the range.
    :param end_time: The end time of the range.
    :param require_full_overlap: If True, only collections that fully overlap with the range are returned, otheerwise partial overlap is used.
    :return: A list of collection object IDs.
    """

    assert_valid_time_range(start_time, end_time)

    absolute_start_filter = Q(absoluteage__gte=start_time - F('ageuncertainty'))
    absolute_end_filter = Q(absoluteage__lte=end_time + F('ageuncertainty'))
    # relative_start_filter = Q(startperiod__gte=start_time)
    # relative_end_filter = Q(endperiod__lte=end_time)
    chrono_start_filter = Q(startperiod__gte=start_time - F('uncertainty'))
    chrono_end_filter = Q(startperiod__lte=end_time + F('uncertainty'))

    absolute_overlap_filter = absolute_start_filter | absolute_end_filter
    # relative_overlap_filter = start_filter | end_filter
    chrono_overlap_filter = chrono_start_filter | chrono_end_filter
    if require_full_overlap:
        absolute_overlap_filter = absolute_start_filter & absolute_end_filter
        # relative_overlap_filter = relative_start_filter & relative_end_filter
        chrono_overlap_filter = chrono_start_filter & chrono_end_filter

    # return = list(set(chain(
    #     AbsoluteAge.objects.filter(overlap_filter).values_list('collectionobject_id', flat=True),
    #     RelativeAge.objects.filter(overlap_filter).values_list('collectionobject_id', flat=True),
    #     Geologictimeperiod.objects.filter(chrono_overlap_filter)
    #         .values_list('relativeages__collectionobject_id', flat=True)
    # )))
    return (
        AbsoluteAge.objects.filter(absolute_overlap_filter).select_related('collectionobject')
        # .union(RelativeAge.objects.filter(relative_overlap_filter).select_related('collectionobject'))
        .union(Geologictimeperiod.objects.filter(chrono_overlap_filter)
            .select_related('relativeages__collectionobject')) # TODO: Add other paths to CollectionObject
        .distinct('id')
        .values_list('id', flat=True)
    )

def search_co_in_time_range(start_time: float, end_time: float, require_full_overlap: bool = False):
    """
    Search for collections that overlap with the given time range.

    :param start_time: The start time of the range.
    :param end_time: The end time of the range.
    :param require_full_overlap: If True, only collections that fully overlap with the range are returned, otherwise partial overlap is used.
    :return: A list of collection objects.
    """

    assert_valid_time_range(start_time, end_time)

    absolute_start_filter = Q(absoluteage__gte=start_time - F('ageuncertainty'))
    absolute_end_filter = Q(absoluteage__lte=end_time + F('ageuncertainty'))
    chrono_start_filter = Q(startperiod__gte=start_time - F('uncertainty'))
    chrono_end_filter = Q(startperiod__lte=end_time + F('uncertainty'))

    absolute_overlap_filter = absolute_start_filter | absolute_end_filter
    chrono_overlap_filter = chrono_start_filter | chrono_end_filter
    if require_full_overlap:
        absolute_overlap_filter = absolute_start_filter & absolute_end_filter
        chrono_overlap_filter = chrono_start_filter & chrono_end_filter

    # Combine all filters into a single query
    # TODO: Fix and make more efficient
    combined_filter = (
        Q(absoluteages__in=AbsoluteAge.objects.filter(absolute_overlap_filter)) |
        Q(relativeages__agename__in=Geologictimeperiod.objects.filter(chrono_overlap_filter)) |
        Q(collectingevent__paleocontext__chronosstrat__in=Geologictimeperiod.objects.filter(chrono_overlap_filter)) |
        # Q(collectingevent__paleocontext__chronosstratend__in=Geologictimeperiod.objects.filter(chrono_overlap_filter)) |  # TODO: Fix
        Q(collectingevent__locality__paleocontext__chronosstrat__in=Geologictimeperiod.objects.filter(chrono_overlap_filter))
        # Q(collectingevent__locality__paleocontext__chronosstratend__in=Geologictimeperiod.objects.filter(chrono_overlap_filter)) # TODO: Fix
    )

    return Collectionobject.objects.filter(combined_filter).distinct()

def search_co_ids_in_time_margin(time: float, uncertanty: float, require_full_overlap: bool = False) -> List[int]:
    start_time = time - uncertanty
    end_time = time + uncertanty
    return search_co_ids_in_time_range(start_time, end_time, require_full_overlap)

def search_co_ids_in_time_period(time_period_name: str, require_full_overlap: bool = False) -> List[int]:
    """
    Search for collections that overlap with the given time period.

    :param time_period_name: The name of the time period.
    :param require_full_overlap: If True, only collections that fully overlap with the range are returned, otheerwise partial overlap is used.
    :return: A list of collection object IDs.
    """

    time_period = Geologictimeperiod.objects.filter(name=time_period_name).first()
    return search_co_ids_in_time_range(time_period.start_time, time_period.end_time)

def query_co_in_time_range(session, start_time: float, end_time: float, require_full_overlap: bool = False):
    """
    Create SQL Alchemy query to search for collections that overlap with the given time range.

    :param query: The sqlalchemy query to filter.
    :param start_time: The start time of the range.
    :param end_time: The end time of the range.
    :param require_full_overlap: If True, only collections that fully overlap with the range are returned, otheerwise partial overlap is used.
    :return: A list of collection object IDs.
    """

    assert_valid_time_range(start_time, end_time)
    
    # Define the filters
    start_filter = sq_models.Collectionobject.startperiod >= start_time
    end_filter = sq_models.Collectionobject.endperiod <= end_time
    chrono_start_filter = sq_models.Collectionobject.startperiod >= (start_time + sq_models.Collectionobject.uncertainty)
    chrono_end_filter = sq_models.Collectionobject.startperiod <= (end_time - sq_models.Collectionobject.uncertainty)

    overlap_filter = or_(start_filter, end_filter)
    chrono_overlap_filter = or_(chrono_start_filter, chrono_end_filter)
    if require_full_overlap:
        overlap_filter = and_(start_filter, end_filter)
        chrono_overlap_filter = and_(chrono_start_filter, chrono_end_filter)

    # Subqueries for related models
    absolute_age_subquery = session.query(sq_models.AbsoluteAge.collectionobject_id).filter(overlap_filter).subquery()
    relative_age_subquery = session.query(sq_models.RelativeAge.collectionobject_id).filter(overlap_filter).subquery()
    geologic_time_period_subquery = session.query(sq_models.RelativeAge.collectionobject_id).join(
        sq_models.Geologictimeperiod, sq_models.RelativeAge.agename == sq_models.Geologictimeperiod.name
    ).filter(chrono_overlap_filter).subquery()

    # Combine all filters into a single query
    combined_filter = or_(
        sq_models.Collectionobject.id.in_(absolute_age_subquery),
        sq_models.Collectionobject.id.in_(relative_age_subquery),
        sq_models.Collectionobject.id.in_(geologic_time_period_subquery)
    )

    # Query the collection objects
    query = session.query(sq_models.Collectionobject).filter(combined_filter).distinct()
    return query
    # result = session.query(sq_models.Collectionobject.id).filter(combined_filter).distinct().all()
    # return [row[0] for row in result]

def query_co_in_time_margin(session, time: float, uncertanty: float, require_full_overlap: bool = False):
    start_time = time - uncertanty
    end_time = time + uncertanty
    return query_co_in_time_range(session, start_time, end_time, require_full_overlap)

def query_co_in_time_period(session, time_period_name: str, require_full_overlap: bool = False):
    """
    Create SQL Alchemy query to search for collections that overlap with the given time period.
    
    :param session: The SQL Alchemy session.
    :param time_period_name: The name of the time period.
    :param require_full_overlap: If True, only collections that fully overlap with the range are returned, otheerwise partial overlap is used.
    :return: A list of collection object IDs.
    """
    
    time_period = session.query(sq_models.Geologictimeperiod).filter_by(name=time_period_name).first()
    return query_co_in_time_range(session, time_period.start_time, time_period.end_time, require_full_overlap)
