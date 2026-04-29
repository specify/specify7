from specifyweb.backend.inheritance.utils import get_cat_num_inheritance_setting, get_parent_cat_num_inheritance_setting
from specifyweb.specify.models import Collectionobjectgroupjoin, Component

INHERITANCE_BATCH_SIZE = 2000

def _catalog_number_field_index(field_specs):
    return _field_names(field_specs).index('catalogNumber') + 1

def _field_names(field_specs):
    return [
        fs.fieldspec.join_path[0].name
        for fs in field_specs
        if fs.fieldspec.join_path
    ]

def _should_inherit_catalog_number(result, catalog_number_field_index):
    return (
        result[catalog_number_field_index] is None
        or result[catalog_number_field_index] == ''
    )

def _batched(iterable, batch_size):
    batch = []
    for item in iterable:
        batch.append(item)
        if len(batch) == batch_size:
            yield batch
            batch = []

    if batch:
        yield batch


def _query_iterator(query, batch_size):
    return query.yield_per(batch_size) if hasattr(query, 'yield_per') else iter(query)

def _passthrough_results(query, batch_size):
    return query if batch_size is not None else list(query)

def _parent_inheritance_results(query, catalog_number_field_index, batch_size):
    for results in _batched(_query_iterator(query, batch_size), batch_size):
        ids_needing_lookup = [
            result[0] for result in results
            if _should_inherit_catalog_number(result, catalog_number_field_index)
        ]

        catnum_by_component_id = {}
        if ids_needing_lookup:
            catnum_by_component_id = dict(
                Component.objects.filter(id__in=ids_needing_lookup)
                .values_list('id', 'collectionobject__catalognumber')
            )

        for result in results:
            result = list(result)
            if _should_inherit_catalog_number(result, catalog_number_field_index):
                component_id = result[0]
                if component_id in catnum_by_component_id:
                    result[catalog_number_field_index] = catnum_by_component_id[
                        component_id
                    ]
            yield tuple(result)

def _cog_inheritance_results(query, catalog_number_field_index, batch_size):
    for results in _batched(_query_iterator(query, batch_size), batch_size):
        ids_needing_lookup = [
            result[0] for result in results
            if _should_inherit_catalog_number(result, catalog_number_field_index)
        ]

        cog_by_child = {}
        if ids_needing_lookup:
            for childco_id, parentcog_id in (
                Collectionobjectgroupjoin.objects
                .filter(childco_id__in=ids_needing_lookup)
                .order_by('childco_id', 'id')
                .values_list('childco_id', 'parentcog_id')
            ):
                cog_by_child.setdefault(childco_id, parentcog_id)

        catnum_by_cog = {}
        cog_ids = set(cog_by_child.values())
        if cog_ids:
            for parentcog_id, catalog_number in (
                Collectionobjectgroupjoin.objects
                .filter(parentcog_id__in=cog_ids, isprimary=True)
                .order_by('parentcog_id', 'id')
                .values_list('parentcog_id', 'childco__catalognumber')
            ):
                catnum_by_cog.setdefault(parentcog_id, catalog_number)

        for result in results:
            result = list(result)
            if _should_inherit_catalog_number(result, catalog_number_field_index):
                child_id = result[0]
                cog_id = cog_by_child.get(child_id)
                if cog_id in catnum_by_cog:
                    result[catalog_number_field_index] = catnum_by_cog[cog_id]
            yield tuple(result)

def parent_inheritance_post_query_processing(
    query, tableid, field_specs, collection, user, batch_size=None
):
    if tableid == 1029 and 'catalogNumber' in _field_names(field_specs):
        if not get_parent_cat_num_inheritance_setting(collection, user):
            return _passthrough_results(query, batch_size)

        # Get the catalogNumber field index
        catalog_number_field_index = _catalog_number_field_index(field_specs)

        # op_num 1 is refering to the filter equal, the inheritance will only work if we have cat num equal, other operators will not function
        if field_specs[catalog_number_field_index - 1].op_num != 1:
            return _passthrough_results(query, batch_size)

        results = _parent_inheritance_results(
            query, catalog_number_field_index, batch_size or INHERITANCE_BATCH_SIZE
        )

        return results if batch_size is not None else list(results)

    return query

def cog_inheritance_post_query_processing(
    query, tableid, field_specs, collection, user, batch_size=None
):
    if tableid == 1 and 'catalogNumber' in _field_names(field_specs):
        if not get_cat_num_inheritance_setting(collection, user):
            # query = query.filter(collectionobjectgroupjoin_1.isprimary == 1)
            return _passthrough_results(query, batch_size)

        # Get the catalogNumber field index
        catalog_number_field_index = _catalog_number_field_index(field_specs)

        # op_num 1 is refering to the filter equal, the inheritance will only work if we have cat num equal, other operators will not function
        if field_specs[catalog_number_field_index - 1].op_num != 1:
            return _passthrough_results(query, batch_size)

        results = _cog_inheritance_results(
            query, catalog_number_field_index, batch_size or INHERITANCE_BATCH_SIZE
        )

        return results if batch_size is not None else list(results)

    return query
