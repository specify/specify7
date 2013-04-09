"""
Provides a function that returns the appropriate view for a given context
hierarchy level. Depends on the user and logged in collectien of the request.
"""
import os
from xml.etree import ElementTree

from django.http import Http404
from specify.models import Spappresourcedata

import app_resource as AR

def get_view(collection, user, viewname):
    """Return the data for the named view for the given user logged into the given collection."""
    # setup a generator that looks for the view in the proper discovery order
    matches = ((viewset, view, src, level)
               # db first, then disk
               for get_viewsets, src in ((get_viewsets_from_db, 'db'), (load_viewsets, 'disk'), (web_only, 'web_only'))
               # then by directory level
               for level in AR.DIR_LEVELS
               # then in the viewset files in a given directory level
               for viewset in get_viewsets(collection, user, level)
               # finally in the list of views in the file
               for view in viewset.findall('views/view[@name="%s"]' % viewname))

    # take the first view from the generator
    try:
        viewset, view, source, level = matches.next()
    except StopIteration:
        raise Http404("view: %s not found" % viewname)

    altviews = view.findall('altviews/altview')

    # make a set of the viewdefs the view points to
    viewdefs = set(viewdef
                   for altview in altviews
                   for viewdef in viewset.findall('viewdefs/viewdef[@name="%s"]' % altview.attrib['viewdef']))

    # some viewdefs reference other viewdefs through the 'definition' attribute
    # we will need to make sure those viewdefs are also sent to the client
    def get_definition(viewdef):
        definition = viewdef.find('definition')
        if definition is None: return
        definition_viewdef = viewset.find('viewdefs/viewdef[@name="%s"]' % definition.text)
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

    data['viewdefs'] = dict((viewdef.attrib['name'], ElementTree.tostring(viewdef))
                            for viewdef in viewdefs)

    # these properties are useful to see where the view was found for debugging
    data['viewsetName'] = viewset.attrib['name']
    data['viewsetLevel'] = level
    data['viewsetSource'] = source
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

def web_only(collection, user, level):
    return [get_viewset_from_file(os.path.dirname(__file__), 'web_only_views.xml')]

def get_viewset_from_file(path, filename):
    """Just load the XML for a viewset from path and pull out the root."""
    return ElementTree.parse(os.path.join(path, filename)).getroot()
