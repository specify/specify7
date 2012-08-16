import os
from xml.etree import ElementTree
from collections import defaultdict

from django.http import HttpResponse, HttpResponseBadRequest, Http404
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_GET, require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import views as auth_views
from django.conf import settings
from django.utils import simplejson

from specify.models import Collection, Spappresourcedata, Spappresourcedir, Specifyuser

DIR_LEVELS = ['Personal', 'UserType', 'Collection', 'Discipline', 'Common', 'Backstop']

disc_file = os.path.join(settings.SPECIFY_CONFIG_DIR, "disciplines.xml")

disciplines = ElementTree.parse(disc_file)

discipline_dirs = dict( (disc.attrib['name'], disc.attrib.get('folder', disc.attrib['name'])) \
                            for disc in disciplines.findall('discipline') )

def login(request):
    if request.method == 'POST':
        request.session['collection'] = request.POST['collection_id']

    kwargs = {
        'template_name': 'login.html',
        'extra_context': { 'collections': Collection.objects.all() } }
    return auth_views.login(request, **kwargs)

def logout(request):
    return auth_views.logout(request, template_name='logged_out.html')

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

@require_GET
@login_required
def schema_localization(request):
    from specify.models import Splocalecontainer as Container
    from specify.models import Splocalecontaineritem as Item
    from specify.models import Splocaleitemstr as SpString
    collection = request.specify_collection

    strings = dict(
        ((i.containername_id, i.containerdesc_id, i.itemname_id, i.itemdesc_id), i.text) \
            for i in SpString.objects.filter(language='en')
        )

    ifields = ('format', 'ishidden', 'isuiformatter', 'picklistname',
               'type', 'isrequired', 'weblinkname',)

    items = defaultdict(dict)
    for i in Item.objects.all():
        items[i.container_id][i.name.lower()] = item = dict((field, getattr(i, field)) for field in ifields)
        item.update({
                'name': strings.get((None, None, i.id, None), None),
                'desc': strings.get((None, None, None, i.id), None)})

    cfields = ('format', 'ishidden', 'isuiformatter', 'picklistname', 'type', 'aggregator', 'defaultui')

    containers = {}
    for c in Container.objects.filter(discipline=collection.discipline):
        containers[c.name] = container = dict((field, getattr(c, field)) for field in cfields)
        container.update({
                'name': strings.get((c.id, None, None, None), None),
                'desc': strings.get((None, c.id, None, None), None),
                'items': items[c.id] })

    return HttpResponse(simplejson.dumps(containers), content_type='application/json')

def get_express_search_config(collection):
    try:
        return Spappresourcedata.objects.get(spappresource__name='ExpressSearchConfig').data
    except Spappresourcedata.DoesNotExist:
        pass

    discipline = collection.discipline
    discipline_dir = discipline_dirs[discipline.type]
    f = open(os.path.join(settings.SPECIFY_CONFIG_DIR, discipline_dir, 'es_config.xml'))
    return f.read()

@require_GET
@login_required
def express_search_config(request):
    xml = get_express_search_config(request.specify_collection)
    return HttpResponse(xml, content_type='text/xml')

@require_GET
def available_related_searches(request):
    from express_search import related_searches
    return HttpResponse(simplejson.dumps(related_searches.__all__),
                        content_type='application/json')
