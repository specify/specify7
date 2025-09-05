from specifyweb.backend.inheritance.utils import get_cat_num_inheritance_setting, get_parent_cat_num_inheritance_setting
from specifyweb.specify.models import Collectionobject, Collectionobjectgroupjoin

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
        updated_results = []

        # Map results, replacing null catalog numbers with the parent catalog number
        for result in results:
            result = list(result)
            if result[catalog_number_field_index] is None or result[catalog_number_field_index] == '':
                component_id = result[0]  # Assuming the first column is the child's ID
                component_obj = Component.objects.filter(id=component_id).first()
                if component_obj and component_obj.collectionobject:
                    result[catalog_number_field_index] = component_obj.collectionobject.catalognumber
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
        updated_results = []

        # Map results, replacing null catalog numbers with the collection object group primary collection catalog number
        for result in results:
            result = list(result)
            if result[catalog_number_field_index] is None or result[catalog_number_field_index] == '':
                cojo = Collectionobjectgroupjoin.objects.filter(childco_id=result[0]).first()
                if cojo:
                    primary_cojo = Collectionobjectgroupjoin.objects.filter(
                        parentcog=cojo.parentcog, isprimary=True).first()
                    if primary_cojo:
                        result[catalog_number_field_index] = primary_cojo.childco.catalognumber
            updated_results.append(tuple(result))

        return updated_results

    return query