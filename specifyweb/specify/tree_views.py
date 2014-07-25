from django.views.decorators.http import require_GET
from django.http import HttpResponse
from django.db import connection

from .views import login_required
from .api import get_object_or_404, obj_to_data, toJson

@login_required
@require_GET
def taxon_tree_view(request, parentid):
    colmemid = request.specify_collection.id
    cursor = connection.cursor()
    cursor.execute("""
    SELECT t1.taxonid, t1.name, t1.fullname, t1.nodenumber, t1.highestchildnodenumber,
    (
        SELECT COUNT(t.taxonid) FROM taxon t WHERE t.parentid = t1.taxonid
    ) as children,
    (
        SELECT COUNT(DISTINCT det.collectionobjectid)
        FROM determination det, taxon t
        WHERE det.taxonid = t.taxonid
        AND t.nodenumber BETWEEN t1.nodenumber AND t1.highestchildnodenumber
        AND det.collectionmemberid = %s AND det.iscurrent
    ) AS allcos,
    (
        SELECT COUNT(DISTINCT det.collectionobjectid)
        FROM determination det
        WHERE det.taxonid = t1.taxonid
        AND det.collectionmemberid = %s AND det.iscurrent
    ) AS directcos
    FROM taxon t1
    WHERE t1.parentid = %s
    ORDER BY t1.name
    """, [colmemid, colmemid, parentid])

    return HttpResponse(toJson(cursor.fetchall()), content_type='application/json')

@login_required
@require_GET
def geography_tree_view(request, parentid):
    colmemid = request.specify_collection.id
    cursor = connection.cursor()
    cursor.execute("""
    SELECT g1.geographyid, g1.name, g1.fullname, g1.nodenumber, g1.highestchildnodenumber,
    (
        SELECT COUNT(g.geographyid) FROM geography g WHERE g.parentid = g1.geographyid
    ) as children,
    (
        SELECT COUNT(DISTINCT co.collectionobjectid)
        FROM collectionobject co, collectingevent ce, locality l, geography g
        WHERE co.collectingeventid = ce.collectingeventid
        AND ce.localityid = l.localityid
        AND l.geographyid = g.geographyid
        AND g.nodenumber BETWEEN g1.nodenumber AND g1.highestchildnodenumber
        AND co.collectionmemberid = %s
    ) AS allcos,
    (
        SELECT COUNT(DISTINCT co.collectionobjectid)
        FROM collectionobject co, collectingevent ce, locality l
        WHERE co.collectingeventid = ce.collectingeventid
        AND ce.localityid = l.localityid
        AND l.geographyid = g1.geographyid
        AND co.collectionmemberid = %s
    ) AS directcos
    FROM geography g1
    WHERE g1.parentid = %s
    ORDER BY g1.name
    """, [colmemid, colmemid, parentid])

    return HttpResponse(toJson(cursor.fetchall()), content_type='application/json')

@login_required
@require_GET
def path(request, model, id):
    id = int(id)
    tree_node = get_object_or_404(model, id=id)

    data = {node.definitionitem.name: obj_to_data(node)
            for node in get_tree_path(tree_node)}

    data['resource_uri'] = '/api/specify_tree/%s/%d/path/' % (model, id)

    return HttpResponse(toJson(data), content_type='application/json')

def get_tree_path(tree_node):
    while tree_node is not None:
        yield tree_node
        tree_node = tree_node.parent
