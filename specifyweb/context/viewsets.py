"""
Provides a function that returns the appropriate view for a given context
hierarchy level. Depends on the user and logged in collectien of the request.
"""
import logging
import os
from django.http import Http404
from django.utils.encoding import force_bytes
from xml.etree import ElementTree
from xml.sax.saxutils import quoteattr

from specifyweb.specify.models import Spappresourcedata
from . import app_resource as AR

logger = logging.getLogger(__name__)

def get_view(collection, user, viewname):
    """Return the data for the named view for the given user logged into the given collection."""
    logger.debug("get_view %s %s %s", collection, user, viewname)
    # setup a generator that looks for the view in the proper discovery order
    matches = ((id, viewset, view, src, level)
               # db first, then disk
               for get_viewsets, src in ((get_viewsets_from_db, 'db'), (load_viewsets, 'disk'))
               # then by directory level
               for level in AR.DIR_LEVELS
               # then in the viewset files in a given directory level
               for id, viewset in get_viewsets(collection, user, level)
               # finally in the list of views in the file
               for view in viewset.findall('views/view[@name=%s]' % quoteattr(viewname)))

    # take the first view from the generator
    try:
        id, viewset, view, source, level = next(matches)
    except StopIteration:
        raise Http404("view: %s not found" % viewname)

    altviews = view.findall('altviews/altview')

    # make a set of the viewdefs the view points to
    viewdefs = set(viewdef
                   for altview in altviews
                   for viewdef in viewset.findall('viewdefs/viewdef[@name=%s]' % quoteattr(altview.attrib['viewdef'])))

    # some viewdefs reference other viewdefs through the 'definition' attribute
    # we will need to make sure those viewdefs are also sent to the client
    def get_definition(viewdef):
        definition = viewdef.find('definition')
        if definition is None: return
        definition_viewdef = viewset.find('viewdefs/viewdef[@name=%s]' % quoteattr(definition.text))
        if definition_viewdef is None:
            raise Http404("no viewdef: %s for definition of viewdef: %s" % (
                    definition.text, viewdef.attrib['name']))
        return definition_viewdef

    # add any viewdefs referenced in other viewdefs to the set
    viewdefs.update([definition
                    for viewdef in viewdefs
                    for definition in [ get_definition(viewdef) ]
                    if definition is not None])

    # build the data to send to the client
    data = view.attrib.copy()
    data['altviews'] = dict((altview.attrib['name'], altview.attrib.copy())
                            for altview in altviews)

    data['viewdefs'] = dict((viewdef.attrib['name'], ElementTree.tostring(viewdef, encoding="unicode"))
                            for viewdef in viewdefs)

    # these properties are useful to see where the view was found for debugging
    data['viewsetName'] = viewset.attrib['name']
    data['viewsetLevel'] = level
    data['viewsetSource'] = source
    data['viewsetId'] = id
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
    def viewsets():
        for o in objs:
            try:
                yield o.spviewsetobj.id, ElementTree.fromstring(force_bytes(o.data))
            except Exception as e:
                logger.error("Bad XML in view set: %s\n%s  id = %s", e, o, o.id)

    return viewsets()

def load_viewsets(collection, user, level):
    """Try to get a viewset for a given level and context from the filesystem."""
    # The directory structure for viewsets are the same as for app resources.
    path = AR.get_path_for_level(collection, user, level)
    if not path: return []

    # The viewset registry lists all the viewset files for that directory.
    registry = AR.load_registry(path, 'viewset_registry.xml')
    if registry is None: return []

    # Load them all.
    def viewsets():
        for f in registry.findall('file'):
            try:
                yield None, get_viewset_from_file(path, f.attrib['file'])
            except Exception:
                pass

    return viewsets()

def get_viewset_from_file(path, filename):
    """Just load the XML for a viewset from path and pull out the root."""
    file_path = os.path.join(path, filename)
    try:
        return ElementTree.parse(file_path).getroot()
    except Exception as e:
        logger.error("Couldn't load viewset from %s\n$s", file_path, e)
        raise
