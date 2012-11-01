"""
Provides a view that returns the appropriate viewset for a given context
hierarchy level. Depends on the user and logged in collectien of the request.
"""
import os
from xml.etree import ElementTree

from django.http import HttpResponse, Http404
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_GET
from django.utils import simplejson

from specify.models import Spappresourcedata, Specifyuser, Collection

import app_resource as AR

@require_GET
@login_required
def viewsets(request, level):
    """Returns an XML HTTP response containing the viewsets for a given level.
    Level should be an integer representing the level of the hierarchy desired.
    The user level is represented by 0. Backstop is represented by 5.
    """
    try:
        # Change the level number into the level name.
        level = AR.DIR_LEVELS[int(level)]
    except IndexError:
        raise Http404()

    # Get the user and logged in collection from the request's session.
    user = request.specify_user
    collection = request.specify_collection

    # Try to get viewsets from the database.
    viewsets = list(get_viewsets_from_db(collection, user, level))

    if len(viewsets) < 1:
        # Try to get viewsets from the filesystem.
        viewsets = load_viewsets(collection, user, level)

    # Combine all the retrieved viewsets into a single XML document.
    result = ElementTree.Element('viewsets')
    for viewset in viewsets: result.append(viewset)
    return HttpResponse(ElementTree.tostring(result), content_type="text/xml")

@require_GET
@login_required
def view(request):
    if 'collectionid' in request.GET:
        collection = Collection.objects.get(id=request.GET['collectionid'])
    else:
        collection = request.specify_collection

    data = get_view(
        collection,
        request.specify_user,
        request.GET['view'],
        request.GET.get('type', "form"),
        request.GET.get('mode', "edit"))

    return HttpResponse(simplejson.dumps(data), content_type="application/json")

def get_viewdef(viewset, view, viewtype="form", mode="edit"):

    matches = ((viewdef, altview.attrib['name'])
               for altview in view.findall('altviews/altview[@mode="%s"]' % mode)
               for viewdef in viewset.findall('viewdefs/viewdef[@name="%s"][@type="%s"]' % (altview.attrib['viewdef'], viewtype)))

    try:
        viewdef, altview = matches.next()
    except StopIteration:
        raise Http404("no viewdef matching view: %s with mode: %s and type: %s" % (
                view.attrib['name'], mode, viewtype))

    definition = viewdef.find('definition')
    if definition is not None:
        viewdef = viewset.find('viewdefs/viewdef[@name="%s"]' % definition.text)
        if viewdef is None:
            raise Http404("no viewdef: %s for definition of viewdef: %s" % (
                    definition.text, viewdef.attrib['name']))

    return viewdef, altview

def get_view(collection, user, viewname, viewtype="form", mode="edit"):

    matches = ((viewset, view, src, level)
               for get_viewsets, src in ((get_viewsets_from_db, 'db'), (load_viewsets, 'disk'))
               for level in AR.DIR_LEVELS
               for viewset in get_viewsets(collection, user, level)
               for view in viewset.findall('views/view[@name="%s"]' % viewname))
    try:
        viewset, view, source, level = matches.next()
    except StopIteration:
        raise Http404("view: %s not found" % viewname)

    data = view.attrib.copy()
    viewdef, altview = get_viewdef(viewset, view, viewtype, mode)
    data['viewdef'] = ElementTree.tostring(viewdef)
    data['altviewName'] = altview
    data['viewsetName'] = viewset.attrib['name']
    data['viewsetLevel'] = level
    data['viewSetSource'] = source
    return data

def get_viewsets_from_db(collection, user, level):
    """Try to get a viewset at a particular level in the given context from the database."""
    # The context directory structure for the viewset system is the same as for
    # the app resources, so we can use the same function to find the appropriate
    # SpAppResourceDirs to join against.
    dirs = AR.get_app_resource_dirs_for_level(collection, user, level)

    # Pull out all the SpAppResourceDatas that have an associated SpViewsetObj in
    # the SpAppResourceDirs we just found.
    objs = Spappresourcedata.objects.filter(spviewsetobj__spappresourcedir__in=dirs)
    return (ElementTree.XML(o.data) for o in objs)

def load_viewsets(collection, user, level):
    """Try to get a viewset for a given level and context from the filesystem."""
    # The directory structure for viewsets are the same as for app resources.
    path = AR.get_path_for_level(collection, user, level)
    if not path: return []

    # The viewset registry lists all the viewset files for that directory.
    registry = AR.load_registry(path, 'viewset_registry.xml')

    # Load them all.
    return (get_viewset_from_file(path, f.attrib['file'])
            for f in registry.findall('file'))

def get_viewset_from_file(path, filename):
    """Just load the XML for a viewset from path and pull out the root."""
    return ElementTree.parse(os.path.join(path, filename)).getroot()

