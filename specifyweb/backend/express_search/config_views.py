import json
import logging
import os
import xml.etree.ElementTree as ET

from django.http import HttpResponse, HttpResponseBadRequest
from django.utils.decorators import method_decorator
from django.conf import settings

from specifyweb.middleware.general import require_http_methods
from specifyweb.specify.views import login_maybe_required
from specifyweb.specify.models import datamodel, Spappresourcedata, Spappresourcedir, Spappresource
from specifyweb.backend.context.app_resource import get_app_resource, get_app_resource_dirs_for_level, get_usertype
from specifyweb.backend.permissions.permissions import has_table_permission
from specifyweb.specify.api.serializers import toJson

logger = logging.getLogger(__name__)

def parse_config_xml(xml_element):
    """Convert ExpressSearchConfig ElementTree to dict"""
    if xml_element is None:
        return {"tables": [], "relatedQueries": []}

    tables = []
    for st in xml_element.findall('tables/searchtable'):
        search_fields = []
        for sf in st.findall('searchFields/searchfield'):
            # Handle both sortDirection (SP7) and isSortable/isAscending (SP6/Desktop)
            sort_dir = "None"
            if sf.find('sortDirection') is not None:
                sort_dir = sf.find('sortDirection').text
            else:
                is_sortable = (sf.findtext('isSortable') or 'false').lower() == 'true'
                if is_sortable:
                    is_asc = (sf.findtext('isAscending') or 'true').lower() == 'true'
                    sort_dir = "Ascending" if is_asc else "Descending"

            search_fields.append({
                "fieldName": sf.findtext('fieldName'),
                "order": int(sf.findtext('order') or 0),
                "sortDirection": sort_dir
            })
        display_fields = []
        for df in st.findall('displayFields/displayfield'):
            display_fields.append({
                "fieldName": df.findtext('fieldName')
            })
            
        tables.append({
            "tableName": st.findtext('tableName'),
            "displayOrder": int(st.findtext('displayOrder') or 0),
            "searchFields": sorted(search_fields, key=lambda x: x["order"]),
            "displayFields": sorted(display_fields, key=lambda x: x["fieldName"] or "")
        })

    related_queries = []
    for rq in xml_element.findall('relatedQueries/relatedquery'):
        related_queries.append({
            "id": rq.findtext('id'),
            "displayOrder": int(rq.findtext('displayOrder') or 0),
            "isActive": (rq.findtext('isActive') or rq.attrib.get('isactive') or 'false').lower() == 'true',
            "isSystem": (rq.findtext('isSystem') or rq.attrib.get('issystem') or 'false').lower() == 'true'
        })
    
    return {
        "tables": sorted(tables, key=lambda x: x["displayOrder"]),
        "relatedQueries": sorted(related_queries, key=lambda x: x["displayOrder"])
    }

def get_express_search_config_str(collection, user):
    res = get_app_resource(collection, user, 'ExpressSearchConfig')
    if res:
        logger.info(f"Loaded ExpressSearchConfig from {res[2] if res[2] else 'Filesystem'}")
        resource = res[0]
        if isinstance(resource, bytes):
            return resource.decode('utf-8', errors='replace')
        return resource
    
    # Try manual fallback if get_app_resource missed it (sometimes registry entries are tricky)
    try:
        common_path = os.path.join(settings.SPECIFY_CONFIG_DIR, 'common', 'expresssearchconfig.xml')
        if os.path.exists(common_path):
            logger.info("Falling back to manual load of common/expresssearchconfig.xml")
            with open(common_path, 'r') as f:
                return f.read()
    except Exception as e:
        logger.error(f"Failed manual fallback: {e}")

    logger.warning("No ExpressSearchConfig found, returning empty shell")
    return '<?xml version="1.0" encoding="UTF-8"?><search><tables></tables><relatedQueries></relatedQueries></search>'

@require_http_methods(['GET', 'PUT'])
@login_maybe_required
def config_api(request):
    collection = request.specify_collection
    user = request.specify_user
    
    if request.method == 'GET':
        xml_str = get_express_search_config_str(collection, user)
        try:
            # Normalise to str and strip any BOM that may have been written by
            # an earlier bug (encoding='utf-8' produced a BOM-prefixed bytes value).
            if isinstance(xml_str, bytes):
                xml_str = xml_str.decode('utf-8', errors='replace')
            xml_str_clean = xml_str.lstrip('\ufeff').strip()
            xml_element = ET.fromstring(xml_str_clean)
        except ET.ParseError as e:
            logger.error(f"Error parsing ExpressSearchConfig XML: {e}")
            # Instead of deleting, we fall back to the filesystem default in-memory
            # for this request, but leave the DB record intact.
            xml_str = get_express_search_config_str(collection, user)
            try:
                xml_element = ET.fromstring(xml_str.lstrip('\ufeff').strip())
            except ET.ParseError:
                xml_element = ET.fromstring('<search><tables></tables><relatedQueries></relatedQueries></search>')
        config = parse_config_xml(xml_element)
        
        # Reconciliation
        from specifyweb.backend.express_search import related_searches
        
        reconciled_tables = []
        for tbl in config.get("tables", []):
            table_name = tbl.get("tableName")
            if not table_name: continue
            try:
                table_def = datamodel.get_table(table_name)
                # Check permissions (exclude if no read access)
                if collection and user:
                    if not has_table_permission(collection.id, user.id, table_name, "read"):
                        logger.debug(f"User {user.name} lacks read permission for {table_name}")
                        continue
                if getattr(table_def, 'isHidden', False):
                    continue
            except Exception:
                # Table not in datamodel or other error, ignore
                continue
            
            # Prune hidden or non-existent fields
            valid_search = []
            for sf in tbl.get("searchFields", []):
                try:
                    fdef = table_def.get_field(sf["fieldName"])
                    if not getattr(fdef, 'isHidden', False):
                        valid_search.append(sf)
                except Exception:
                    pass
                    
            valid_disp = []
            for df in tbl.get("displayFields", []):
                try:
                    fdef = table_def.get_field(df["fieldName"])
                    if not getattr(fdef, 'isHidden', False):
                        valid_disp.append(df)
                except Exception:
                    pass
                    
            if valid_search:
                tbl["searchFields"] = valid_search
                tbl["displayFields"] = valid_disp
                reconciled_tables.append(tbl)
        
        config["tables"] = reconciled_tables
        
        # Build derived related queries options
        all_related = []
        in_use_table_ids = set()
        for tbl in config["tables"]:
            try:
                tdef = datamodel.get_table(tbl["tableName"])
                in_use_table_ids.add(tdef.tableId)
            except KeyError:
                pass
                
        # Derive queries based on these base table IDs
        for name in related_searches.__all__:
            rdef = getattr(related_searches, name)
            if hasattr(rdef, 'root') and getattr(rdef, 'root').tableId in in_use_table_ids:
                # Keep it in options
                pass
            if hasattr(rdef, 'id'):
                all_related.append({
                    "id": str(rdef.id),
                    "name": name,
                    "description": getattr(rdef, 'description', getattr(rdef, 'title', name)),
                    "baseTableId": getattr(rdef, 'root').tableId if hasattr(rdef, 'root') else None
                })
        
        payload = {
            "config": config,
            "related_queries_definitions": all_related,
            "schema_metadata": _get_schema_metadata(collection, user)
        }
        
        return HttpResponse(toJson(payload), content_type='application/json')
        
    elif request.method == 'PUT':
        if not request.body:
            return HttpResponse(json.dumps({"success": False, "error": "Empty body"}), status=400, content_type='application/json')
            
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return HttpResponse(json.dumps({"success": False, "error": "Invalid JSON"}), status=400, content_type='application/json')
            
        tables = data.get("tables", [])
        related_queries = data.get("relatedQueries", [])
        
        # PRUNE AND RESORT
        pruned_tables = []
        for tbl in tables:
            search_fields = [sf for sf in tbl.get("searchFields", []) if sf.get("inUse")]
            if not search_fields:
                continue
                
            display_fields = [df for df in tbl.get("displayFields", []) if df.get("inUse")]
            
            # Resort fields
            for i, sf in enumerate(sorted(search_fields, key=lambda x: x.get("order", 0))):
                sf["order"] = i
                
            pruned_tables.append({
                "tableName": tbl.get("tableName"),
                "displayOrder": tbl.get("displayOrder", 0),
                "searchFields": search_fields,
                "displayFields": display_fields
            })
            
        # Serialize to XML
        root = ET.Element('search')
        tables_elem = ET.SubElement(root, 'tables')
        for tbl in pruned_tables:
            if not tbl.get("tableName"): continue
            st = ET.SubElement(tables_elem, 'searchtable')
            ET.SubElement(st, 'tableName').text = tbl["tableName"]
            ET.SubElement(st, 'displayOrder').text = str(tbl["displayOrder"])
            
            sfs_elem = ET.SubElement(st, 'searchFields')
            for sf in tbl["searchFields"]:
                f_elem = ET.SubElement(sfs_elem, 'searchfield')
                ET.SubElement(f_elem, 'fieldName').text = sf["fieldName"]
                ET.SubElement(f_elem, 'order').text = str(sf["order"])
                ET.SubElement(f_elem, 'sortDirection').text = sf.get("sortDirection", "None")
                
            dfs_elem = ET.SubElement(st, 'displayFields')
            for df in tbl["displayFields"]:
                f_elem = ET.SubElement(dfs_elem, 'displayfield')
                ET.SubElement(f_elem, 'fieldName').text = df["fieldName"]
                
        rqs_elem = ET.SubElement(root, 'relatedQueries')
        for rq in related_queries:
            if not rq.get("id"): continue
            elem = ET.SubElement(rqs_elem, 'relatedquery', isactive=str(rq.get("isActive", False)).lower(), issystem="true")
            ET.SubElement(elem, 'id').text = str(rq["id"])
            ET.SubElement(elem, 'displayOrder').text = str(rq.get("displayOrder", 0))
            
        xml_str = ET.tostring(root, encoding='unicode')
        _save_express_search_config(collection, user, xml_str)
        
        return HttpResponse(json.dumps({"success": True}), content_type='application/json')

def _save_express_search_config(collection, user, xml_str):
    # Find existing user-level resource or create one
    dirs = get_app_resource_dirs_for_level(collection, user, 'Personal')
    target_dir = dirs.first() if dirs.exists() else None
    
    if target_dir is None:
        target_dir = Spappresourcedir.objects.create(
            ispersonal=True,
            collection=collection,
            discipline=collection.discipline if collection else None,
            usertype=get_usertype(user),
            specifyuser=user
        )
        
    try:
        app_res_data = Spappresourcedata.objects.get(
            spappresource__name='ExpressSearchConfig',
            spappresource__spappresourcedir=target_dir
        )
        app_res_data.data = xml_str
        app_res_data.save()
    except Spappresourcedata.DoesNotExist:
        app_res = Spappresource.objects.create(
            name='ExpressSearchConfig',
            mimetype='text/xml',
            description='Express Search Config',
            spappresourcedir=target_dir,
            level=0,
            specifyuser=user,
        )
        Spappresourcedata.objects.create(
            spappresource=app_res,
            data=xml_str
        )

def _get_schema_metadata(collection, user):
    tables = []
    for t in datamodel.tables:
        classname = t.classname
        try:
            if getattr(t, 'isHidden', False): continue
            if getattr(t, 'system', False): continue
            if not has_table_permission(collection.id, user.id, t.name, "read"): continue
            
            # check if it has indexed fields
            indexed_fields = [f.name for f in getattr(t, 'all_fields', []) if getattr(f, 'indexed', False) and not getattr(f, 'isHidden', False)]
            if not indexed_fields: continue
            
            fields = []
            for f in getattr(t, 'all_fields', []):
                if getattr(f, 'isHidden', False): continue
                fields.append({
                    "name": f.name,
                    "title": getattr(f, 'title', f.name.capitalize()),
                    "isIndexed": getattr(f, 'indexed', False)
                })
            
            tables.append({
                "name": t.name,
                "title": getattr(t, 'title', t.name.capitalize()),
                "fields": fields
            })
        except Exception as e:
            logger.warning(f"Error reading schema metadata for {classname}: {e}")
            
    return tables
