import os, itertools
from xml.etree import ElementTree

from django.http import HttpResponse, HttpResponseBadRequest
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_GET, require_http_methods
from django.views.decorators.csrf import csrf_exempt

from specify.models import Collection, Spappresourcedata, Spappresourcedir, Specifyuser

DIR_LEVELS = ['Personal', 'UserType', 'Collection', 'Discipline', 'Common', 'Backstop']

config_dir = os.path.join(os.path.dirname(__file__), "config")

disc_file = os.path.join(config_dir, "disciplines.xml")

disciplines = ElementTree.parse(disc_file)

discipline_dirs = dict( (disc.attrib['name'], disc.attrib.get('folder', disc.attrib['name'])) \
                            for disc in disciplines.findall('discipline') )


@login_required
@csrf_exempt
@require_http_methods(['GET', 'POST'])
def collection(request):
    if request.method == 'POST':
        try:
            collection = Collection.objects.get(id=int(request.raw_post_data))
        except ValueError:
            return HttpResponseBadRequest('bad collection id', content_type="text/plain")
        except Collection.DoesNotExist:
            return HttpResponseBadRequest('collection does not exist', content_type="text/plain")
        request.session['collection'] = str(collection.id)
        return HttpResponse('ok')
    else:
        collection = request.session.get('collection', '')
        return HttpResponse(collection, content_type="text/plain")

@login_required
@require_GET
def viewsets(request):
    try:
        collection = Collection.objects.get(id=int(request.session.get('collection', '')))
    except ValueError:
        return HttpResponseBadRequest('bad collection id', content_type="text/plain")
    except Collection.DoesNotExist:
        return HttpResponseBadRequest('collection does not exist', content_type="text/plain")

    user = Specifyuser.objects.get(name=request.user.username)
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
        return [ElementTree.XML(o.data) for o in objs] or load_viewset(level)

    viewset_paths = {
        'UserType'  : (discipline_dir, usertype),
        'Discipline': (discipline_dir,)         ,
        'Common'    : ('common'      ,)         ,
        'Backstop'  : ('backstop'    ,)}

    def load_viewset(level):
        path = viewset_paths.get(level, None)
        if not path: return []
        path = os.path.join(config_dir, *path)
        registry = ElementTree.parse(os.path.join(path, 'viewset_registry.xml'))
        return [ElementTree.parse(os.path.join(path, f.attrib['file'])).getroot() \
                    for f in registry.findall('file')]

    viewsets = map(get_viewset, DIR_LEVELS[:-1])
    viewsets.append(load_viewset('Backstop'))

    result = ElementTree.Element('viewsets')
    for viewset in itertools.chain(*viewsets): result.append(viewset)
    return HttpResponse(ElementTree.tostring(result), content_type="text/xml")
