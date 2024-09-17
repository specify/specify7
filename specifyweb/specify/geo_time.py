from itertools import chain
from typing import List, Set
from django.db.models import Q, F
from sqlalchemy import func, literal,  or_, and_, exists
from sqlalchemy.sql import or_, and_
from sqlalchemy.orm import aliased

from specifyweb.specify.models import AbsoluteAge, RelativeAge, Geologictimeperiod, Collectionobject
from specifyweb.stored_queries import models as sq_models

# TODO: Integrate into the query builder

# Paths from CollectionObject to AbsoluteAge or GeologicTimePeriod:
# - collectionobject->paleocontext->chronostrat
# - collectionobject->collectionevent->paleocontext->chronostrat
# - collectionobject->collectionevent->loc->paleocontext->chronostrat
# - collectionobject->relativeage->chronostrat
# - collectionobject->absoluteage

def assert_valid_time_range(start_time: float, end_time: float):
    assert start_time <= end_time, "Start time must be less than or equal to end time."

def search_co_ids_in_time_range(start_time: float, end_time: float, require_full_overlap: bool = False) -> Set[int]:
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
    chrono_start_filter = Q(startperiod__gte=start_time - F('startuncertainty'))
    chrono_end_filter = Q(startperiod__lte=end_time + F('enduncertainty'))

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

    # return (
    #     AbsoluteAge.objects.filter(absolute_overlap_filter).select_related('collectionobject')
    #     # .union(RelativeAge.objects.filter(relative_overlap_filter).select_related('collectionobject'))
    #     .union(Geologictimeperiod.objects.filter(chrono_overlap_filter)
    #         .select_related('relativeages__collectionobject')) # TODO: Add other paths to CollectionObject
    #     .distinct('id')
    #     .values_list('id', flat=True)
    # )

    absolute_ids = set(
        AbsoluteAge.objects.filter(absolute_overlap_filter)
        .select_related("collectionobject")
        .values_list("collectionobject_id", flat=True)
    )
    chrono_ids = set(
        Geologictimeperiod.objects.filter(chrono_overlap_filter)
        .select_related("relativeages__collectionobject")
        .values_list("relativeages__collectionobject_id", flat=True)
    )

    return absolute_ids.union(chrono_ids)

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
    chrono_start_filter = Q(startperiod__gte=start_time - F('startuncertainty'))
    chrono_end_filter = Q(startperiod__lte=end_time + F('enduncertainty'))

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

def subquery_co_in_time_range(
    qb_query,
    start_time: float,
    end_time: float,
    session=None,
    require_full_overlap: bool = False,
):
    # create initial sqlalchmey subquery 'SELECT collectionobject_id FROM collectionobject'
    subquery = qb_query.session.query(sq_models.CollectionObject.id).subquery()

def query_co_in_time_range_1(
    qb_query,
    start_time: float,
    end_time: float,
    session=None,
    require_full_overlap: bool = False,
):
    """
    Edit the incoming Query Builder SQL Alchemy query to search for collections that overlap with the given time range.

    # :param session: The SQL Alchemy session.
    :param qb_query: The Query Builder's sqlalchemy query to filter.
    :param start_time: The start time of the range.
    :param end_time: The end time of the range.
    :param session: The SQL Alchemy session.
    :param require_full_overlap: If True, only collections that fully overlap with the range are returned, otheerwise partial overlap is used.
    :return: A list of collection object IDs.
    """

    assert_valid_time_range(start_time, end_time)

    # Assert that the base table of the query is CollectionObject
    assert sq_models.CollectionObject in [entity.entity_zero for entity in qb_query._entities], \
        "The base table of the query must be CollectionObject."

    # Define filters
    absolute_start_filter = AbsoluteAge.absoluteage >= (start_time - AbsoluteAge.ageuncertainty)
    absolute_end_filter = AbsoluteAge.absoluteage <= (end_time + AbsoluteAge.ageuncertainty)
    chrono_start_filter = Geologictimeperiod.startperiod >= (start_time - Geologictimeperiod.startuncertainty)
    chrono_end_filter = Geologictimeperiod.startperiod <= (end_time + Geologictimeperiod.enduncertainty)

    if require_full_overlap:
        absolute_overlap_filter = and_(absolute_start_filter, absolute_end_filter)
        chrono_overlap_filter = and_(chrono_start_filter, chrono_end_filter)
    else:
        absolute_overlap_filter = or_(absolute_start_filter, absolute_end_filter)
        chrono_overlap_filter = or_(chrono_start_filter, chrono_end_filter)

    # Aliases for joins
    relative_age_alias = aliased(RelativeAge)
    geo_time_period_alias = aliased(sq_models.Geologictimeperiod)
    collecting_event_alias = aliased(sq_models.CollectingEvent)
    paleocontext_alias = aliased(sq_models.PaleoContext)

    # Combine all filters into a single query
    # TODO: Fix and make more efficient
    if session is None:
        session = sq_models.session_context()
    with session as qb_session:
        combined_filter = or_(
            sq_models.CollectionObject.absoluteages.any(absolute_overlap_filter),
            sq_models.CollectionObject.relativeages.any(relative_age_alias.agename.in_(
                qb_session.query(geo_time_period_alias.id).filter(chrono_overlap_filter)
            )),
            sq_models.CollectionObject.collectingevent.has(
                collecting_event_alias.paleocontext.has(
                    or_(
                        paleocontext_alias.chronosstrat.in_(
                            qb_session.query(geo_time_period_alias.id).filter(chrono_overlap_filter)
                        ),
                        paleocontext_alias.chronosstratend.in_(
                            qb_session.query(geo_time_period_alias.id).filter(chrono_overlap_filter)
                        )
                    )
                )
            ),
            sq_models.CollectionObject.collectingevent.has(
                collecting_event_alias.locality.has(
                    paleocontext_alias.chronosstrat.in_(
                        qb_session.query(geo_time_period_alias.id).filter(chrono_overlap_filter)
                    )
                )
            ),
            sq_models.CollectionObject.collectingevent.has(
                collecting_event_alias.locality.has(
                    paleocontext_alias.chronosstratend.in_(
                        qb_session.query(geo_time_period_alias.id).filter(chrono_overlap_filter)
                    )
                )
            )
        )

    # Execute query
    # return qb_session.query(sq_models.CollectionObject).filter(combined_filter).distinct().all()
    # return qb_query.filter(combined_filter).distinct().all()

    # Add age filter statement to the query
    # return qb_query.filter(combined_filter).distinct()
    return qb_query.filter(combined_filter)
    # age_subquery = session.query
    # return age_subquery.filter(combined_filter).distinct()

def query_co_in_time_range_2(
    qb_query,
    start_time: float,
    end_time: float,
    session=None,
    require_full_overlap: bool = False,
):
    """
    Edit the incoming Query Builder SQL Alchemy query to search for collections that overlap with the given time range.

    # :param session: The SQL Alchemy session.
    :param qb_query: The Query Builder's sqlalchemy query to filter.
    :param start_time: The start time of the range.
    :param end_time: The end time of the range.
    :param session: The SQL Alchemy session.
    :param require_full_overlap: If True, only collections that fully overlap with the range are returned, otheerwise partial overlap is used.
    :return: A list of collection object IDs.
    """

    start_time = float(start_time)
    end_time = float(end_time)

    assert_valid_time_range(start_time, end_time)

    # Assert that the base table of the query is CollectionObject
    # assert sq_models.CollectionObject in [entity.entity_zero for entity in qb_query._entities], \
    #     "The base table of the query must be CollectionObject."
    # base_model = qb_query.column_descriptions[0]['entity']
    # assert base_model == sq_models.CollectionObject, "The base table of the query must be CollectionObject."

    # Define filters
    absolute_start_filter = AbsoluteAge.absoluteage >= (literal(start_time) - AbsoluteAge.ageuncertainty)
    absolute_end_filter = AbsoluteAge.absoluteage <= (literal(end_time) + AbsoluteAge.ageuncertainty)
    chrono_start_filter = Geologictimeperiod.startperiod >= (literal(start_time) - Geologictimeperiod.startuncertainty)
    chrono_end_filter = Geologictimeperiod.startperiod <= (literal(end_time) + Geologictimeperiod.enduncertainty)

    if require_full_overlap:
        absolute_overlap_filter = and_(absolute_start_filter, absolute_end_filter)
        chrono_overlap_filter = and_(chrono_start_filter, chrono_end_filter)
    else:
        absolute_overlap_filter = or_(absolute_start_filter, absolute_end_filter)
        chrono_overlap_filter = or_(chrono_start_filter, chrono_end_filter)

    # Aliases for joins
    relative_age_alias = aliased(sq_models.RelativeAge)
    geo_time_period_alias = aliased(sq_models.GeologicTimePeriod)
    collecting_event_alias = aliased(sq_models.CollectingEvent)
    paleocontext_alias = aliased(sq_models.PaleoContext)

    # Combine all filters into a single query
    # TODO: Fix and make more efficient
    if session is None:
        session = sq_models.session_context()
    with session as qb_session:
        # combined_filter = or_(
        #     # sq_models.CollectionObject.absoluteages.any(absolute_overlap_filter), # 'CollectionObject' has no attribute 'absoluteages'
        #     # sq_models.CollectionObject.relativeages.any(relative_age_alias.agename.in_( 'CollectionObject' has no attribute 'relativeages'
        #     #     qb_session.query(geo_time_period_alias.id).filter(chrono_overlap_filter)
        #     # )),
        #     sq_models.CollectionObject.collectingevent.has( # Need to do sq_models.CollecintEvent.collectionObjects
        #         collecting_event_alias.paleocontext.has(
        #             or_(
        #                 paleocontext_alias.chronosstrat.in_(
        #                     qb_session.query(geo_time_period_alias.id).filter(chrono_overlap_filter)
        #                 ),
        #                 paleocontext_alias.chronosstratend.in_(
        #                     qb_session.query(geo_time_period_alias.id).filter(chrono_overlap_filter)
        #                 )
        #             )
        #         )
        #     ),
        #     sq_models.CollectionObject.collectingevent.has( # Need to do sq_models.CollecintEvent.collectionObjects
        #         collecting_event_alias.locality.has(
        #             paleocontext_alias.chronosstrat.in_(
        #                 qb_session.query(geo_time_period_alias.id).filter(chrono_overlap_filter)
        #             )
        #         )
        #     ),
        #     sq_models.CollectionObject.collectingevent.has( # Need to do sq_models.CollecintEvent.collectionObjects
        #         collecting_event_alias.locality.has(
        #             paleocontext_alias.chronosstratend.in_(
        #                 qb_session.query(geo_time_period_alias.id).filter(chrono_overlap_filter)
        #             )
        #         )
        #     )
        # )
        # combined_filter = or_(
        #     sq_models.CollectingEvent.collectionObjects.any(
        #         collecting_event_alias.paleoContext.has(
        #             or_(
        #                 paleocontext_alias.ChronosStratID.in_(
        #                     qb_session.query(geo_time_period_alias.geologicTimePeriodId).filter(chrono_overlap_filter)
        #                 ),
        #                 paleocontext_alias.ChronosStratEndID.in_(
        #                     qb_session.query(geo_time_period_alias.geologicTimePeriodId).filter(chrono_overlap_filter)
        #                 )
        #             )
        #         )
        #     ),
        #     sq_models.CollectingEvent.collectionObjects.any(
        #         collecting_event_alias.locality.has(
        #             paleocontext_alias.ChronosStratID.in_(
        #                 qb_session.query(geo_time_period_alias.geologicTimePeriodId).filter(chrono_overlap_filter)
        #             )
        #         )
        #     ),
        #     sq_models.CollectingEvent.collectionObjects.any(
        #         collecting_event_alias.locality.has(
        #             paleocontext_alias.ChronosStratEndID.in_(
        #                 qb_session.query(geo_time_period_alias.geologicTimePeriodId).filter(chrono_overlap_filter)
        #             )
        #         )
        #     )
        # )
        
        # Extract foreign key values from the subquery
        foreign_key_subquery = qb_session.query(geo_time_period_alias.geologicTimePeriodId).filter(chrono_overlap_filter).subquery()

        # Use the foreign key values in the in_ method
        combined_filter = or_(
            sq_models.CollectingEvent.collectionObjects.any(
                collecting_event_alias.paleoContext.has(
                    or_(
                        paleocontext_alias.ChronosStratID.in_(foreign_key_subquery),
                        paleocontext_alias.ChronosStratEndID.in_(foreign_key_subquery)
                    )
                )
            ),
            sq_models.CollectingEvent.collectionObjects.any(
                collecting_event_alias.locality.has(
                    paleocontext_alias.ChronosStratID.in_(foreign_key_subquery)
                )
            ),
            sq_models.CollectingEvent.collectionObjects.any(
                collecting_event_alias.locality.has(
                    paleocontext_alias.ChronosStratEndID.in_(foreign_key_subquery)
                )
            )
        )

# Execute query
# return qb_session.query(sq_models.CollectionObject).filter(combined_filter).distinct().all()
# return qb_query.filter(combined_filter).distinct().all()

    # Execute query
    # return qb_session.query(sq_models.CollectionObject).filter(combined_filter).distinct().all()
    # return qb_query.filter(combined_filter).distinct().all()

    # Add age filter statement to the query
    # return qb_query.filter(combined_filter).distinct()
    return qb_query.filter(combined_filter)
    # age_subquery = session.query
    # return age_subquery.filter(combined_filter).distinct()

def query_co_in_time_range_3(query, start_time, end_time, session=None, require_full_overlap=False):
    """
    Modify the given SQLAlchemy query to include filters that only select collection objects
    overlapping with the given time range.

    :param query: The existing SQLAlchemy query on CollectionObject.
    :param start_time: The start time of the range.
    :param end_time: The end time of the range.
    :param require_full_overlap: If True, only collections that fully overlap with the range are returned;
                                 otherwise, partial overlap is used.
    :return: A new query with the additional filters applied.
    """

    start_time = float(start_time)
    end_time = float(end_time)

    # Build the absolute age filters
    absolute_start_filter = sq_models.AbsoluteAge.absoluteage >= (literal(start_time) - sq_models.AbsoluteAge.ageuncertainty)
    absolute_end_filter = sq_models.AbsoluteAge.absoluteage <= (literal(end_time) + sq_models.AbsoluteAge.ageuncertainty)

    if require_full_overlap:
        absolute_overlap_filter = and_(absolute_start_filter, absolute_end_filter)
    else:
        absolute_overlap_filter = or_(absolute_start_filter, absolute_end_filter)

    # Build the geologic time period filters
    chrono_start_filter = sq_models.GeologicTimePeriod.startPeriod >= (
        literal(start_time) - sq_models.GeologicTimePeriod.startUncertainty
    )
    chrono_end_filter = sq_models.GeologicTimePeriod.startPeriod <= (
        literal(end_time) + sq_models.GeologicTimePeriod.endUncertainty
    )

    if require_full_overlap:
        chrono_overlap_filter = and_(chrono_start_filter, chrono_end_filter)
    else:
        chrono_overlap_filter = or_(chrono_start_filter, chrono_end_filter)

    # Build the EXISTS clauses for absolute ages
    absolute_exists = exists().where(
        and_(
            sq_models.AbsoluteAge.CollectionObjectID == sq_models.CollectionObject.collectionObjectId,
            absolute_overlap_filter
        )
    )

    # Build the EXISTS clauses for geologic time periods via relative ages
    chrono_exists = exists().where(
        and_(
            sq_models.RelativeAge.CollectionObjectID == sq_models.CollectionObject.collectionObjectId,
            sq_models.RelativeAge.AgeNameID == sq_models.GeologicTimePeriod.geologicTimePeriodId,
            chrono_overlap_filter
        )
    )

    # Modify the original query by adding the filters
    query = query.filter(or_(absolute_exists, chrono_exists))

    return query


def query_co_in_time_range(query, start_time, end_time, session=None, require_full_overlap=False):
    start_time = float(start_time)
    end_time = float(end_time)

    # Build the absolute age filters
    absolute_start_filter = sq_models.AbsoluteAge.absoluteage >= (
        literal(start_time) - sq_models.AbsoluteAge.ageuncertainty
    )
    absolute_end_filter = sq_models.AbsoluteAge.absoluteage <= (
        literal(end_time) + sq_models.AbsoluteAge.ageuncertainty
    )

    if require_full_overlap:
        absolute_overlap_filter = and_(absolute_start_filter, absolute_end_filter)
    else:
        absolute_overlap_filter = or_(absolute_start_filter, absolute_end_filter)

    # Build the geologic time period filters
    chrono_start_filter = sq_models.GeologicTimePeriod.startPeriod >= (
        literal(start_time) - sq_models.GeologicTimePeriod.startUncertainty
    )
    chrono_end_filter = sq_models.GeologicTimePeriod.startPeriod <= (
        literal(end_time) + sq_models.GeologicTimePeriod.endUncertainty
    )

    if require_full_overlap:
        chrono_overlap_filter = and_(chrono_start_filter, chrono_end_filter)
    else:
        chrono_overlap_filter = or_(chrono_start_filter, chrono_end_filter)

    # Join with AbsoluteAge and apply filter
    absolute_query = query.join(
        sq_models.AbsoluteAge,
        sq_models.AbsoluteAge.CollectionObjectID
        == sq_models.CollectionObject.collectionObjectId,
    )
    absolute_query = absolute_query.filter(absolute_overlap_filter)

    # Join with RelativeAge and GeologicTimePeriod and apply filter
    chrono_query = query.join(
        sq_models.RelativeAge,
        sq_models.RelativeAge.CollectionObjectID == sq_models.CollectionObject.collectionObjectId,
    )
    chrono_query = chrono_query.join(
        sq_models.GeologicTimePeriod,
        sq_models.RelativeAge.AgeNameID == sq_models.GeologicTimePeriod.geologicTimePeriodId,
    )
    chrono_query = chrono_query.filter(chrono_overlap_filter)

    # Combine the two queries using UNION to avoid duplicates
    combined_query = absolute_query.union(chrono_query)

    return combined_query

def query_co_in_time_margin(qb_query, time: float, uncertanty: float, session=None, require_full_overlap: bool = False):
    start_time = time - uncertanty
    end_time = time + uncertanty
    return query_co_in_time_range(session, start_time, end_time, require_full_overlap)

def query_co_in_time_period(qb_query, time_period_name: str, session=None, require_full_overlap: bool = False):
    """
    Create SQL Alchemy query to search for collections that overlap with the given time period.
    
    :param session: The SQL Alchemy session.
    :param qb_query: The Query Builder's sqlalchemy query to filter.
    :param time_period_name: The name of the time period.
    :param session: The SQL Alchemy session.
    :param require_full_overlap: If True, only collections that fully overlap with the range are returned, otheerwise partial overlap is used.
    :return: A list of collection object IDs.
    """
    
    time_period = session.query(sq_models.Geologictimeperiod).filter_by(name=time_period_name).first()
    return query_co_in_time_range(session, time_period.start_time, time_period.end_time, require_full_overlap)
