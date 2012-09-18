"""
Provides a view that returns the appropriate viewset for a given context
hierarchy level. Depends on the user and logged in collectien of the request.
"""
import os
from xml.etree import ElementTree

from django.http import HttpResponse, Http404
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_GET

from specify.models import Spappresourcedata, Specifyuser

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
    viewsets = get_viewset(collection, user, level)

    if not viewsets:
        # Try to get viewsets from the filesystem.
        viewsets = load_viewset(collection, user, level)

    # Combine all the retrieved viewsets into a single XML document.
    result = ElementTree.Element('viewsets')
    for viewset in viewsets: result.append(viewset)
    return HttpResponse(ElementTree.tostring(result), content_type="text/xml")

def get_viewset(collection, user, level):
    """Try to get a viewset at a particular level in the given context from the database."""
    # The context directory structure for the viewset system is the same as for
    # the app resources, so we can use the same function to find the appropriate
    # SpAppResourceDirs to join against.
    dirs = AR.get_app_resource_dirs_for_level(collection, user, level)

    # Pull out all the SpAppResourceDatas that have an associated SpViewsetObj in
    # the SpAppResourceDirs we just found.
    objs = Spappresourcedata.objects.filter(spviewsetobj__spappresourcedir__in=dirs)
    return [ElementTree.XML(o.data) for o in objs]

def load_viewset(collection, user, level):
    """Try to get a viewset for a given level and context from the filesystem."""
    # The directory structure for viewsets are the same as for app resources.
    path = AR.get_path_for_level(collection, user, level)
    if not path: return []

    # The viewset registry lists all the viewset files for that directory.
    registry = AR.load_registry(path, 'viewset_registry.xml')

    # Load them all.
    return [get_viewset_from_file(path, f.attrib['file'])
            for f in registry.findall('file')]

def get_viewset_from_file(path, filename):
    """Just load the XML for a viewset from path and pull out the root."""
    return ElementTree.parse(os.path.join(path, filename)).getroot()

