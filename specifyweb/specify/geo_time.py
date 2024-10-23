from itertools import chain
from typing import List, Set
from django.db.models import Q, F
from sqlalchemy import func, literal,  or_, and_, exists
from sqlalchemy.sql import or_, and_
from sqlalchemy.orm import aliased

from specifyweb.specify.models import AbsoluteAge, RelativeAge, Geologictimeperiod, Collectionobject, Paleocontext
from specifyweb.stored_queries import models as sq_models

# TODO: Cleanup this file by deciding on the implementation to keep and removing the rest.

# Paths from CollectionObject to AbsoluteAge or GeologicTimePeriod:
# - collectionobject->paleocontext->chronostrat
# - collectionobject->collectionevent->paleocontext->chronostrat
# - collectionobject->collectionevent->locality->paleocontext->chronostrat
# - collectionobject->relativeage->chronostrat
# - collectionobject->absoluteage

def assert_valid_time_range(start_time: float, end_time: float):
    assert start_time >= end_time, "Start time must be greater than or equal to end time."

# TODO: Remove once an implementation which implemention to keep
def search_co_ids_in_time_range_original(start_time: float, end_time: float, require_full_overlap: bool = False) -> Set[int]:
    """
    Search for collections that overlap with the given time range.
    This is a simple implementation that uses the Django ORM, not very efficient.

    :param start_time: The start time of the range.
    :param end_time: The end time of the range.
    :param require_full_overlap: If True, only collections that fully overlap with the range are returned, otheerwise partial overlap is used.
    :return: A list of collection object IDs.
    """

    assert_valid_time_range(start_time, end_time)

    absolute_start_filter = Q(absoluteage__gte=start_time + F('ageuncertainty'))
    absolute_end_filter = Q(absoluteage__lte=end_time - F('ageuncertainty'))
    chrono_start_filter = Q(startperiod__gte=start_time + F('startuncertainty'))
    chrono_end_filter = Q(startperiod__lte=end_time - F('enduncertainty'))
    paleocontext_start_filter = Q(chronosstrat__startperiod__gte=start_time + F('chronosstrat__startuncertainty')) | \
        Q(chronosstratend__startperiod__gte=start_time + F('chronosstratend__startuncertainty'))
    palercontext_end_filter = Q(chronosstrat__endperiod__lte=end_time - F('chronosstrat__enduncertainty')) | \
        Q(chronosstratend__endperiod__lte=end_time - F('chronosstratend__enduncertainty'))

    absolute_overlap_filter = absolute_start_filter | absolute_end_filter
    chrono_overlap_filter = chrono_start_filter | chrono_end_filter
    paleocontext_overlap_filter = paleocontext_start_filter | palercontext_end_filter
    if require_full_overlap:
        absolute_overlap_filter = absolute_start_filter & absolute_end_filter
        chrono_overlap_filter = chrono_start_filter & chrono_end_filter
        paleocontext_overlap_filter = paleocontext_start_filter & palercontext_end_filter

    absolute_co_ids = set(
        AbsoluteAge.objects.filter(absolute_overlap_filter)
        .select_related("collectionobject")
        .values_list("collectionobject_id", flat=True)
    )
    relative_age_co_ids = set(
        Geologictimeperiod.objects.filter(chrono_overlap_filter)
        .select_related("relativeages__collectionobject")
        .values_list("relativeages__collectionobject_id", flat=True)
    )
    # paleocontext_co_ids = set(
    #     Collectionobject.objects.filter(
    #         paleocontext__chronosstrat__in=Geologictimeperiod.objects.filter(chrono_overlap_filter)
    #     ).values_list("id", flat=True)
    # )
    # collectingevent_co_ids = set(
    #     Collectionobject.objects.filter(
    #         collectingevent__paleocontext__chronosstrat__in=Geologictimeperiod.objects.filter(chrono_overlap_filter)
    #     ).values_list("id", flat=True)
    # )
    # locality_co_ids = set(
    #     Collectionobject.objects.filter(
    #         collectingevent__locality__paleocontext__chronosstrat__in=Geologictimeperiod.objects.filter(
    #             chrono_overlap_filter
    #         )
    #     ).values_list("id", flat=True)
    # )
    paleocontext_co_ids = set(
        Collectionobject.objects.filter(
            paleocontext__in=Paleocontext.objects.filter(paleocontext_overlap_filter)
        ).values_list("id", flat=True)
    )
    collectingevent_co_ids = set(
        Collectionobject.objects.filter(
            collectingevent__paleocontext__in=Paleocontext.objects.filter(paleocontext_overlap_filter)
        ).values_list("id", flat=True)
    )
    locality_co_ids = set(
        Collectionobject.objects.filter(
            collectingevent__locality__paleocontext__in=Paleocontext.objects.filter(paleocontext_overlap_filter)
        ).values_list("id", flat=True)
    )

    return absolute_co_ids.union(relative_age_co_ids, paleocontext_co_ids, collectingevent_co_ids, locality_co_ids)

# TODO: Remove once an implementation which implemention to keep
def search_co_ids_in_time_range(start_time: float, end_time: float, require_full_overlap: bool = False) -> Set[int]:
    """
    Search for collections that overlap with the given time range.

    :param start_time: The start time of the range.
    :param end_time: The end time of the range.
    :param require_full_overlap: If True, only collections that fully overlap with the range are returned, otherwise partial overlap is used.
    :return: A set of collection object IDs.
    """

    assert_valid_time_range(start_time, end_time)

    # Define the filters
    absolute_start_filter = Q(absoluteage__gte=start_time + F('ageuncertainty'))
    absolute_end_filter = Q(absoluteage__lte=end_time - F('ageuncertainty'))
    chrono_start_filter = Q(startperiod__gte=start_time + F('startuncertainty'))
    chrono_end_filter = Q(startperiod__lte=end_time - F('enduncertainty'))
    paleocontext_start_filter = Q(chronosstrat__startperiod__gte=start_time + F('chronosstrat__startuncertainty')) | \
        Q(chronosstratend__startperiod__gte=start_time + F('chronosstratend__startuncertainty'))
    paleocontext_end_filter = Q(chronosstrat__endperiod__lte=end_time - F('chronosstrat__enduncertainty')) | \
        Q(chronosstratend__endperiod__lte=end_time - F('chronosstratend__enduncertainty'))

    # Combine the filters
    absolute_overlap_filter = absolute_start_filter | absolute_end_filter
    chrono_overlap_filter = chrono_start_filter | chrono_end_filter
    paleocontext_overlap_filter = paleocontext_start_filter | paleocontext_end_filter
    if require_full_overlap:
        absolute_overlap_filter = absolute_start_filter & absolute_end_filter
        chrono_overlap_filter = chrono_start_filter & chrono_end_filter
        paleocontext_overlap_filter = paleocontext_start_filter & paleocontext_end_filter

    # Fetch the IDs
    absolute_co_ids = set(
        AbsoluteAge.objects.filter(absolute_overlap_filter)
        .values_list("collectionobject_id", flat=True)
    )
    relative_age_co_ids = set(
        Geologictimeperiod.objects.filter(chrono_overlap_filter)
        .values_list("relativeages__collectionobject_id", flat=True)
    )
    paleocontext_co_ids = set(
        Collectionobject.objects.filter(
            Q(paleocontext__in=Paleocontext.objects.filter(paleocontext_overlap_filter)) |
            Q(collectingevent__paleocontext__in=Paleocontext.objects.filter(paleocontext_overlap_filter)) |
            Q(collectingevent__locality__paleocontext__in=Paleocontext.objects.filter(paleocontext_overlap_filter))
        ).values_list("id", flat=True)
    )

    return absolute_co_ids.union(relative_age_co_ids, paleocontext_co_ids)

# TODO: Remove once an implementation which implemention to keep
def search_co_in_time_range(start_time: float, end_time: float, require_full_overlap: bool = False):
    """
    Search for collections that overlap with the given time range.

    :param start_time: The start time of the range.
    :param end_time: The end time of the range.
    :param require_full_overlap: If True, only collections that fully overlap with the range are returned, otherwise partial overlap is used.
    :return: A list of collection objects.
    """

    assert_valid_time_range(start_time, end_time)

    absolute_start_filter = Q(absoluteage__gte=start_time + F('ageuncertainty'))
    absolute_end_filter = Q(absoluteage__lte=end_time - F('ageuncertainty'))
    chrono_start_filter = Q(startperiod__gte=start_time + F('startuncertainty'))
    chrono_end_filter = Q(startperiod__lte=end_time - F('enduncertainty'))

    absolute_overlap_filter = absolute_start_filter | absolute_end_filter
    chrono_overlap_filter = chrono_start_filter | chrono_end_filter
    if require_full_overlap:
        absolute_overlap_filter = absolute_start_filter & absolute_end_filter
        chrono_overlap_filter = chrono_start_filter & chrono_end_filter

    # Combine all filters into a single query
    # TODO: Fix and make more efficient
    # combined_filter = (
    #     Q(absoluteages__in=AbsoluteAge.objects.filter(absolute_overlap_filter)) |
    #     Q(relativeages__agename__in=Geologictimeperiod.objects.filter(chrono_overlap_filter)) |
    #     Q(collectingevent__paleocontext__chronosstrat__in=Geologictimeperiod.objects.filter(chrono_overlap_filter)) |
    #     # Q(collectingevent__paleocontext__chronosstratend__in=Geologictimeperiod.objects.filter(chrono_overlap_filter)) |  # TODO: Fix
    #     Q(collectingevent__locality__paleocontext__chronosstrat__in=Geologictimeperiod.objects.filter(chrono_overlap_filter))
    #     # Q(collectingevent__locality__paleocontext__chronosstratend__in=Geologictimeperiod.objects.filter(chrono_overlap_filter)) # TODO: Fix
    # )
    # return Collectionobject.objects.filter(combined_filter).distinct()

    return set(Collectionobject.objects.filter(
        Q(absoluteages__in=AbsoluteAge.objects.filter(absolute_overlap_filter)) |
        Q(relativeages__geologictimeperiod__in=Geologictimeperiod.objects.filter(chrono_overlap_filter)) |
        Q(paleocontext__chronosstrat__in=Geologictimeperiod.objects.filter(chrono_overlap_filter)) |
        Q(collectingevent__paleocontext__chronosstrat__in=Geologictimeperiod.objects.filter(chrono_overlap_filter)) |
        Q(collectingevent__locality__paleocontext__chronosstrat__in=Geologictimeperiod.objects.filter(chrono_overlap_filter))
    ).values_list("id", flat=True))

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
    return search_co_ids_in_time_range(time_period.startperiod, time_period.endperiod, require_full_overlap)
    # return search_co_in_time_range(time_period.startperiod, time_period.endperiod, require_full_overlap)

def subquery_co_in_time_range(
    qb_query,
    start_time: float,
    end_time: float,
    session=None,
    require_full_overlap: bool = False,
):
    # create initial sqlalchmey subquery 'SELECT collectionobject_id FROM collectionobject'
    subquery = qb_query.session.query(sq_models.CollectionObject.id).subquery()

# TODO: Remove once an implementation which implemention to keep
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
    absolute_start_filter = sq_models.AbsoluteAge.absoluteAge >= (start_time + sq_models.AbsoluteAge.ageUncertainty)
    absolute_end_filter = sq_models.AbsoluteAge.absoluteAge <= (end_time - sq_models.AbsoluteAge.ageUncertainty)
    chrono_start_filter = sq_models.Geologictimeperiod.startPeriod >= (start_time + sq_models.Geologictimeperiod.startUncertainty)
    chrono_end_filter = sq_models.Geologictimeperiod.startPeriod <= (end_time - sq_models.Geologictimeperiod.endUncertainty)
    paleocontext_start_filter = sq_models.PaleoContext.chronosstrat.startPeriod >= (start_time + sq_models.PaleoContext.chronosstrat.startUncertainty) or \
        sq_models.PaleoContext.chronosstratend.startPeriod >= (start_time + sq_models.PaleoContext.chronosstratend.startUncertainty)
    paleocontext_end_filter = sq_models.PaleoContext.chronosstrat.endPeriod <= (end_time - sq_models.PaleoContext.chronosstrat.endUncertainty) or \
        sq_models.PaleoContext.chronosstratend.endPeriod <= (end_time - sq_models.PaleoContext.chronosstratend.endUncertainty)

    if require_full_overlap:
        absolute_overlap_filter = and_(absolute_start_filter, absolute_end_filter)
        chrono_overlap_filter = and_(chrono_start_filter, chrono_end_filter)
        paleocontext_overlap_filter = and_(paleocontext_start_filter, paleocontext_end_filter)
    else:
        absolute_overlap_filter = or_(absolute_start_filter, absolute_end_filter)
        chrono_overlap_filter = or_(chrono_start_filter, chrono_end_filter)
        paleocontext_overlap_filter = or_(paleocontext_start_filter, paleocontext_end_filter)

    # Aliases for joins
    relative_age_alias = aliased(sq_models.RelativeAge)
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

# TODO: Remove once an implementation which implemention to keep
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
    absolute_start_filter = sq_models.AbsoluteAge.absoluteAge >= (
        literal(start_time) + sq_models.AbsoluteAge.ageUncertainty
    )
    absolute_end_filter = sq_models.AbsoluteAge.absoluteAge <= (
        literal(end_time) - sq_models.AbsoluteAge.ageUncertainty
    )
    chrono_start_filter = sq_models.Geologictimeperiod.startPeriod >= (
        literal(start_time) + sq_models.Geologictimeperiod.startUncertainty
    )
    chrono_end_filter = sq_models.Geologictimeperiod.startPeriod <= (
        literal(end_time) - sq_models.Geologictimeperiod.endUncertainty
    )

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
        foreign_key_subquery = (
            qb_session.query(geo_time_period_alias.geologicTimePeriodId)
            .filter(chrono_overlap_filter)
            .subquery()
        )

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

# TODO: Remove once an implementation which implemention to keep
def query_co_in_time_range(query, start_time, end_time, session=None, require_full_overlap=False):
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
    absolute_start_filter = sq_models.AbsoluteAge.absoluteAge >= (literal(start_time) + sq_models.AbsoluteAge.ageUncertainty)
    absolute_end_filter = sq_models.AbsoluteAge.absoluteAge <= (literal(end_time) - sq_models.AbsoluteAge.ageUncertainty)

    if require_full_overlap:
        absolute_overlap_filter = and_(absolute_start_filter, absolute_end_filter)
    else:
        absolute_overlap_filter = or_(absolute_start_filter, absolute_end_filter)

    # Build the geologic time period filters
    chrono_start_filter = sq_models.GeologicTimePeriod.startPeriod >= (
        literal(start_time) + sq_models.GeologicTimePeriod.startUncertainty
    )
    chrono_end_filter = sq_models.GeologicTimePeriod.startPeriod <= (
        literal(end_time) - sq_models.GeologicTimePeriod.endUncertainty
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


# TODO: Remove once an implementation which implemention to keep
def query_co_in_time_range_with_joins_old(query, start_time, end_time, session=None, require_full_overlap=False):
    start_time = float(start_time)
    end_time = float(end_time)

    # Build the absolute age filters
    absolute_start_filter = sq_models.AbsoluteAge.absoluteAge >= (
        literal(start_time) + sq_models.AbsoluteAge.ageUncertainty
    )
    absolute_end_filter = sq_models.AbsoluteAge.absoluteAge <= (
        literal(end_time) - sq_models.AbsoluteAge.ageUncertainty
    )

    # Build the geologic time period filters
    chrono_start_filter = sq_models.GeologicTimePeriod.startPeriod >= (
        literal(start_time) + sq_models.GeologicTimePeriod.startUncertainty
    )
    chrono_end_filter = sq_models.GeologicTimePeriod.startPeriod <= (
        literal(end_time) - sq_models.GeologicTimePeriod.endUncertainty
    )
    
    # Build the paleocontext filters
    paleocontext_start_filter = sq_models.PaleoContext.chronosstrat.startPeriod >= (
        literal(start_time) + sq_models.PaleoContext.chronosstrat.startUncertainty
    ) | sq_models.PaleoContext.chronosstratend.startPeriod >= (
        literal(start_time) + sq_models.PaleoContext.chronosstratend.startUncertainty
    )
    paleocontext_end_filter = sq_models.PaleoContext.chronosstrat.endPeriod <= (
        literal(end_time) - sq_models.PaleoContext.chronosstrat.endUncertainty
    ) | sq_models.PaleoContext.chronosstratend.endPeriod <= (
        literal(end_time) - sq_models.PaleoContext.chronosstratend.endUncertainty
    )

    if require_full_overlap:
        absolute_overlap_filter = and_(absolute_start_filter, absolute_end_filter)
        chrono_overlap_filter = and_(chrono_start_filter, chrono_end_filter)
        paleocontext_overlap_filter = and_(paleocontext_start_filter, paleocontext_end_filter)
    else:
        absolute_overlap_filter = or_(absolute_start_filter, absolute_end_filter)
        chrono_overlap_filter = or_(chrono_start_filter, chrono_end_filter)
        paleocontext_overlap_filter = or_(paleocontext_start_filter, paleocontext_end_filter)

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

from sqlalchemy import and_, or_, literal
from sqlalchemy.orm import aliased

def query_co_in_time_range_with_joins(query, start_time, end_time, session=None, require_full_overlap=False):
    start_time = float(start_time)
    end_time = float(end_time)

    # Build the absolute age filters
    absolute_start_filter = sq_models.AbsoluteAge.absoluteAge >= (
        literal(start_time) + sq_models.AbsoluteAge.ageUncertainty
    )
    absolute_end_filter = sq_models.AbsoluteAge.absoluteAge <= (
        literal(end_time) - sq_models.AbsoluteAge.ageUncertainty
    )

    # Build the geologic time period filters
    chrono_start_filter = sq_models.GeologicTimePeriod.startPeriod >= (
        literal(start_time) + sq_models.GeologicTimePeriod.startUncertainty
    )
    chrono_end_filter = sq_models.GeologicTimePeriod.startPeriod <= (
        literal(end_time) - sq_models.GeologicTimePeriod.endUncertainty
    )
    
    # Aliases for joining PaleoContext with GeologicTimePeriod
    start_period = aliased(sq_models.GeologicTimePeriod)
    end_period = aliased(sq_models.GeologicTimePeriod)

    # Build the paleocontext filters
    paleocontext_start_filter = start_period.startPeriod >= (
        literal(start_time) + start_period.startUncertainty
    ) | end_period.startPeriod >= (
        literal(start_time) + end_period.startUncertainty
    )
    paleocontext_end_filter = start_period.endPeriod <= (
        literal(end_time) - start_period.endUncertainty
    ) | end_period.endPeriod <= (
        literal(end_time) - end_period.endUncertainty
    )

    if require_full_overlap:
        absolute_overlap_filter = and_(absolute_start_filter, absolute_end_filter)
        chrono_overlap_filter = and_(chrono_start_filter, chrono_end_filter)
        paleocontext_overlap_filter = and_(paleocontext_start_filter, paleocontext_end_filter)
    else:
        absolute_overlap_filter = or_(absolute_start_filter, absolute_end_filter)
        chrono_overlap_filter = or_(chrono_start_filter, chrono_end_filter)
        paleocontext_overlap_filter = or_(paleocontext_start_filter, paleocontext_end_filter)

    # Join with AbsoluteAge and apply filter
    absolute_query = query.join(
        sq_models.AbsoluteAge,
        sq_models.AbsoluteAge.CollectionObjectID == sq_models.CollectionObject.collectionObjectId,
    ).filter(absolute_overlap_filter)

    # Join with RelativeAge and GeologicTimePeriod and apply filter
    chrono_query = query.join(
        sq_models.RelativeAge,
        sq_models.RelativeAge.CollectionObjectID == sq_models.CollectionObject.collectionObjectId,
    ).join(
        sq_models.GeologicTimePeriod,
        sq_models.RelativeAge.AgeNameID == sq_models.GeologicTimePeriod.geologicTimePeriodId,
    ).filter(chrono_overlap_filter)

    # Join with PaleoContext and GeologicTimePeriod and apply filter
    paleocontext_query = query.join(
        sq_models.PaleoContext,
        sq_models.PaleoContext.CollectionObjectID == sq_models.CollectionObject.collectionObjectId,
    ).join(
        start_period,
        sq_models.PaleoContext.chronosStrat.startPeriodID == start_period.geologicTimePeriodId,
    ).join(
        end_period,
        sq_models.PaleoContext.chronosStrat.endPeriodID == end_period.geologicTimePeriodId,
    ).filter(paleocontext_overlap_filter)

    # Combine the queries using UNION to avoid duplicates
    combined_query = absolute_query.union(chrono_query, paleocontext_query)

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
    
    # time_period = session.query(sq_models.GeologicTimePeriod).filter_by(name=time_period_name).first()
    time_period = Geologictimeperiod.objects.filter(name=time_period_name).first()
    return query_co_in_time_range(session, time_period.startperiod, time_period.endperiod, require_full_overlap)
    # return query_co_in_time_range_with_joins(session, time_period.start_time, time_period.end_time, require_full_overlap)
