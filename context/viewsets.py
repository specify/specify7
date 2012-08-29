import os
from xml.etree import ElementTree

from django.http import HttpResponse, Http404
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_GET

from specify.models import Spappresourcedata, Specifyuser

import app_resource as AR

def get_viewset_from_file(path, filename):
    return ElementTree.parse(os.path.join(path, filename)).getroot()

def get_viewset(collection, user, level):
    dirs = AR.get_app_resource_dirs_for_level(collection, user, level)
    objs = Spappresourcedata.objects.filter(spviewsetobj__spappresourcedir__in=dirs)
    return [ElementTree.XML(o.data) for o in objs]

def load_viewset(collection, user, level):
    path = AR.get_path_for_level(collection, user, level)
    if not path: return []
    registry = AR.load_registry(path, 'viewset_registry.xml')
    return [get_viewset_from_file(path, f.attrib['file'])
            for f in registry.findall('file')]

@require_GET
@login_required
def viewsets(request, level):
    try:
        level = AR.DIR_LEVELS[int(level)]
    except IndexError:
        raise Http404()

    user = Specifyuser.objects.get(name=request.user.username)
    collection = request.specify_collection

    from_db = get_viewset(collection, user, level)
    from_fs = load_viewset(collection, user, level)

    viewsets = from_db or from_fs

    result = ElementTree.Element('viewsets')
    for viewset in viewsets: result.append(viewset)
    return HttpResponse(ElementTree.tostring(result), content_type="text/xml")
