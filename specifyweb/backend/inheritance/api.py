from typing import Callable, Iterable

from specifyweb.backend.inheritance.utils import get_cat_num_inheritance_setting, get_parent_cat_num_inheritance_setting
from specifyweb.specify.models import Collectionobjectgroupjoin, Component
from specifyweb.backend.stored_queries.queryfield import QueryField


def do_nothing[T](items: T) -> T:
    return items


def parent_inheritance_query_processor(tableid: int, query_fields: list[QueryField], collection, user) -> Callable[[list], list]:
    first_field_names = [qf.fieldspec.join_path[0].name for qf in query_fields if qf.fieldspec.join_path]
    if tableid != 1029 or 'catalogNumber' not in first_field_names:
        return do_nothing

    if not get_parent_cat_num_inheritance_setting(collection, user):
        return do_nothing

    # Get the catalogNumber field index
    catalog_number_field_index = first_field_names.index('catalogNumber') + 1

    # op_num 1 is refering to the filter equal, the inheritance will only work if we have cat num equal, other operators will not function
    if query_fields[catalog_number_field_index - 1].op_num != 1:
        return do_nothing

    def _processor(row: list):
        modified_row = list(row)
        if modified_row[catalog_number_field_index] is None or modified_row[catalog_number_field_index] == '':
            component_id = row[0]
            # REFACTOR:(perf) This is relatively pretty slow, we make a
            # database query for every item in the iterable we're processing
            component_obj = Component.objects.filter(
                id=component_id).select_related("collectionobject").first()
            if component_obj and component_obj.collectionobject:
                modified_row[catalog_number_field_index] = component_obj.collectionobject.catalognumber

        return modified_row

    return _processor


def cog_inheritance_query_processor(tableid: int, query_fields: list[QueryField], collection, user) -> Callable[[list], list]:
    first_field_names = [
        qf.fieldspec.join_path[0].name.lower()
        for qf in query_fields
        if qf.fieldspec.join_path
    ]
    if tableid != 1 or 'catalognumber' not in first_field_names:
        return do_nothing

    if not get_cat_num_inheritance_setting(collection, user):
        return do_nothing

    # Get the catalogNumber field index
    catalog_number_field_index = first_field_names.index('catalognumber') + 1

    # op_num 1 is refering to the filter equal, the inheritance will only work if we have cat num equal, other operators will not function
    if query_fields[catalog_number_field_index - 1].op_num != 1:
        return do_nothing

    # For a given result, replace null catalog numbers with the collection
    # object group primary collection catalog number
    def _processor(row: list):
        modified_row = list(row)
        if modified_row[catalog_number_field_index] is None or modified_row[catalog_number_field_index] == '':
            child_co_id = modified_row[0]
            # REFACTOR:(perf) We should be able to combine the queries for cojo
            # and primary cojo to make one explict database query rather than
            # two.
            # Like parent_inheritance_query_processor, this is slow and
            # makes multiple queries for each item that needs processed
            cojo = Collectionobjectgroupjoin.objects.filter(
                childco_id=child_co_id).select_related("parentcog").first()
            if cojo:
                primary_cojo = Collectionobjectgroupjoin.objects.filter(
                    parentcog=cojo.parentcog, isprimary=True).select_related("childco").first()
                if primary_cojo:
                    modified_row[catalog_number_field_index] = primary_cojo.childco.catalognumber
        return modified_row

    return _processor


def DefaultQueryProcessors(tableid: int, query_fields: Iterable[QueryField], collection, user) -> list[Callable[[list], list]]:
    visible_query_fields = list(filter(lambda qfield: qfield.display, query_fields))
    return [
        parent_inheritance_query_processor(
            tableid=tableid,
            query_fields=visible_query_fields,
            collection=collection,
            user=user
        ),
        cog_inheritance_query_processor(
            tableid=tableid,
            query_fields=visible_query_fields,
            collection=collection,
            user=user
        )
    ]
