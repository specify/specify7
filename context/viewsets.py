import os
from xml.etree import ElementTree

from django.http import HttpResponse, Http404
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_GET
from django.conf import settings

from specify.models import Spappresourcedata, Spappresourcedir, Specifyuser

from disciplines import discipline_dirs, DIR_LEVELS

@require_GET
@login_required
def viewsets(request, level):
    user = Specifyuser.objects.get(name=request.user.username)
    collection = request.specify_collection
    discipline = collection.discipline
    discipline_dir = discipline_dirs[discipline.type]
    usertype = user.usertype.replace(' ', '').lower()

    viewset_filters = {
        'Columns'    : ('ispersonal', 'usertype', 'collection', 'discipline'),
        'Personal'   : (True        , usertype  , collection  , discipline)  ,
        'UserType'   : (False       , usertype  , collection  , discipline)  ,
        'Collection' : (False       , None      , collection  , discipline)  ,
        'Discipline' : (False       , None      , None        , discipline)  ,
        'Common'     : (False       , "Common"  , None        , None)}

    def get_viewset(level):
        columns, values = viewset_filters['Columns'], viewset_filters[level]
        filters = dict(zip(columns, values))
        if filters['ispersonal']: filters['specifyuser'] = user
        dirs = Spappresourcedir.objects.filter(**filters)
        objs = Spappresourcedata.objects.filter(spviewsetobj__spappresourcedir__in=dirs)
        return [ElementTree.XML(o.data) for o in objs]

    viewset_paths = {
        'UserType'  : (discipline_dir, usertype),
        'Discipline': (discipline_dir,)         ,
        'Common'    : ('common'      ,)         ,
        'Backstop'  : ('backstop'    ,)}

    def load_viewset(level):
        path = viewset_paths.get(level, None)
        if not path: return []
        path = os.path.join(settings.SPECIFY_CONFIG_DIR, *path)
        registry = ElementTree.parse(os.path.join(path, 'viewset_registry.xml'))
        return [ElementTree.parse(os.path.join(path, f.attrib['file'])).getroot() \
                    for f in registry.findall('file')]

    try:
        dir_level = DIR_LEVELS[int(level)]
    except IndexError:
        raise Http404()

    if dir_level == 'Backstop': viewsets = load_viewset('Backstop')
    else: viewsets = get_viewset(dir_level) or load_viewset(dir_level)

    result = ElementTree.Element('viewsets')
    for viewset in viewsets: result.append(viewset)
    return HttpResponse(ElementTree.tostring(result), content_type="text/xml")
