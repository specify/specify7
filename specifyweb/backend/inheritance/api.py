from specifyweb.backend.inheritance.utils import get_cat_num_inheritance_setting, get_parent_cat_num_inheritance_setting
from specifyweb.specify.models import Collectionobject, Collectionobjectgroupjoin, Component

def parent_inheritance_post_query_processing(query, tableid, field_specs, collection, user):
    if tableid == 1029 and 'catalogNumber' in [fs.fieldspec.join_path[0].name for fs in field_specs if fs.fieldspec.join_path]:
        if not get_parent_cat_num_inheritance_setting(collection, user):
            return list(query)

        # Get the catalogNumber field index
        catalog_number_field_index = [fs.fieldspec.join_path[0].name for fs in field_specs if fs.fieldspec.join_path].index('catalogNumber') + 1

        # op_num 1 is refering to the filter equal, the inheritance will only work if we have cat num equal, other operators will not function
        if field_specs[catalog_number_field_index - 1].op_num != 1:
            return list(query)

        results = list(query)

        # Collect IDs of rows needing catalog number lookup
        ids_needing_lookup = [
            result[0] for result in results
            if result[catalog_number_field_index] is None or result[catalog_number_field_index] == ''
        ]

        # Bulk prefetch: single query to get all component -> collectionobject catalog numbers
        catnum_by_component_id = {}
        if ids_needing_lookup:
            catnum_by_component_id = dict(
                Component.objects.filter(id__in=ids_needing_lookup)
                .select_related('collectionobject')
                .values_list('id', 'collectionobject__catalognumber')
            )

        updated_results = []
        for result in results:
            result = list(result)
            if result[catalog_number_field_index] is None or result[catalog_number_field_index] == '':
                component_id = result[0]
                catnum = catnum_by_component_id.get(component_id)
                if catnum:
                    result[catalog_number_field_index] = catnum
            updated_results.append(tuple(result))

        return updated_results

    return query

def cog_inheritance_post_query_processing(query, tableid, field_specs, collection, user):
    if tableid == 1 and 'catalogNumber' in [fs.fieldspec.join_path[0].name for fs in field_specs if fs.fieldspec.join_path]:
        if not get_cat_num_inheritance_setting(collection, user):
            # query = query.filter(collectionobjectgroupjoin_1.isprimary == 1)
            return list(query)

        # Get the catalogNumber field index
        catalog_number_field_index = [fs.fieldspec.join_path[0].name for fs in field_specs if fs.fieldspec.join_path].index('catalogNumber') + 1

        # op_num 1 is refering to the filter equal, the inheritance will only work if we have cat num equal, other operators will not function
        if field_specs[catalog_number_field_index - 1].op_num != 1:
            return list(query)

        results = list(query)

        # Collect IDs of rows needing COG inheritance lookup
        ids_needing_lookup = [
            result[0] for result in results
            if result[catalog_number_field_index] is None or result[catalog_number_field_index] == ''
        ]

        # Bulk prefetch step 1: get parentcog_id for each childco_id
        cog_by_child = {}
        if ids_needing_lookup:
            cog_by_child = dict(
                Collectionobjectgroupjoin.objects.filter(childco_id__in=ids_needing_lookup)
                .values_list('childco_id', 'parentcog_id')
            )

        # Bulk prefetch step 2: get primary member's catalog number for each COG
        catnum_by_cog = {}
        cog_ids = set(cog_by_child.values())
        if cog_ids:
            catnum_by_cog = dict(
                Collectionobjectgroupjoin.objects.filter(
                    parentcog_id__in=cog_ids, isprimary=True
                )
                .select_related('childco')
                .values_list('parentcog_id', 'childco__catalognumber')
            )

        updated_results = []
        for result in results:
            result = list(result)
            if result[catalog_number_field_index] is None or result[catalog_number_field_index] == '':
                child_id = result[0]
                cog_id = cog_by_child.get(child_id)
                if cog_id is not None:
                    catnum = catnum_by_cog.get(cog_id)
                    if catnum:
                        result[catalog_number_field_index] = catnum
            updated_results.append(tuple(result))

        return updated_results

    return query
