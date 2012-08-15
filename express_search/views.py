import re
import json
from datetime import date, datetime
from xml.etree import ElementTree

from django.db.models import Q
from django.http import HttpResponse
from django.views.decorators.http import require_GET
from django.contrib.auth.decorators import login_required
from django.db.models import fields as django_fields

from specify import models
from specify.filter_by_col import filter_by_collection

from context.views import get_express_search_config

QUOTED_STR_RE = re.compile(r'^([\'"`])(.*)\1$')

class JsonDateEncoder(json.JSONEncoder):
    def default(self, obj):
        if hasattr(obj, 'isoformat'):
            return obj.isoformat()
        return json.JSONEncoder.default(self, obj)

def toJson(obj):
    return json.dumps(obj, cls=JsonDateEncoder)

class Term:
    discipline = None
    def __init__(self, term):
        self.is_suffix = term.startswith('*')
        self.is_prefix = term.endswith('*')
        self.term = term.strip('*')

        try:
            float(self.term)
            self.is_number = True
        except ValueError:
            self.is_number = False

        try:
            self.maybe_year = 1000 <= int(self.term) <= date.today().year
            self.is_integer = True
        except ValueError:
            self.maybe_year = self.is_integer = False

        try:
            self.as_date = datetime.strptime(self.term, '%m/%d/%Y').date()
        except ValueError:
            self.as_date = None

    def create_filter(self, field):
        filter_map = {
            'DateField': self.create_date_filter,
            'DateTimeField': self.create_date_filter,
            'CharField': self.create_text_filter,
            'TextField': self.create_text_filter,
            'IntegerField': self.create_integer_filter,
            'FloatField': self.create_float_filter,
            'DecimalField': self.create_float_filter,}

        create = filter_map.get(field.__class__.__name__, lambda f: None)
        return create(field)

    def create_text_filter(self, field):
        if self.discipline:
            from specify.models import Splocalecontaineritem
            fieldinfo = Splocalecontaineritem.objects.get(
                container__discipline=self.discipline,
                name=field.name,
                container__name=field.model.__name__.lower())
            if fieldinfo.format == 'CatalogNumberNumeric':
                if not self.is_integer: return None
                term = "%.9d" % int(self.term)
                return Q(**{ field.name: term })

        if self.is_prefix and self.is_suffix:
            op = '__icontains'
        elif self.is_prefix:
            op = '__istartswith'
        elif self.is_suffix:
            op = '__iendswith'
        else:
            op = '__iexact'
        return Q(**{ field.name + op: self.term })

    def create_integer_filter(self, field):
        if not self.is_integer: return None
        return Q(**{ field.name: int(self.term) })

    def create_date_filter(self, field):
        if self.maybe_year:
            return Q(**{ field.name + '__year': int(self.term) })

        if not self.as_date: return None
        return Q(**{ field.name: self.as_date })

    def create_float_filter(self, field):
        if not self.is_number: return None
        return Q(**{ field.name: float(self.term) })

def parse_search_str(collection, search_str):
    class TermForCollection(Term):
        discipline = collection.discipline

    match_quoted = QUOTED_STR_RE.match(search_str)
    if match_quoted:
        terms = [ match_quoted.groups()[1] ]
    else:
        terms = search_str.split()

    return map(TermForCollection, terms)

def build_queryset(searchtable, terms, collection):
    tablename = searchtable.find('tableName').text.capitalize()
    model = getattr(models, tablename)

    fields = [model._meta.get_field(fn.text.lower()) \
                  for fn in searchtable.findall('.//searchfield/fieldName')]

    filters = filter(None,
                     [term.create_filter(field) for term in terms for field in fields])

    if len(filters) > 0:
        reduced = reduce(lambda p, q: p | q, filters)
        return filter_by_collection(model.objects.filter(reduced), collection)

@require_GET
@login_required
def search(request):
    express_search_config = ElementTree.XML(get_express_search_config(request.specify_collection))
    terms = parse_search_str(request.specify_collection, request.GET['q'])
    results = {}
    for searchtable in express_search_config.findall('tables/searchtable'):
        tablename = searchtable.find('tableName').text.capitalize()
        qs = build_queryset(searchtable, terms, request.specify_collection)
        if not qs:
            results[tablename] = []
            continue

        display_fields = [fn.text.lower() \
                              for fn in searchtable.findall('.//displayfield/fieldName')]
        display_fields.append('id')

        results[tablename] = list(qs.values(*display_fields))

    return HttpResponse(toJson(results), content_type='application/json')

@require_GET
@login_required
def related_search(request):
    import related_searches
    express_search_config = ElementTree.XML(get_express_search_config(request.specify_collection))
    rs = getattr(related_searches, request.GET['name'])()
    model = rs.pivot()
    for searchtable in express_search_config.findall('tables/searchtable'):
        tablename = searchtable.find('tableName').text.capitalize()
        if tablename == model.__name__: break
    else:
        raise Exception('no matching primary search for related search: ' + rs)

    terms = parse_search_str(request.specify_collection, request.GET['q'])
    qs = build_queryset(searchtable, terms, request.specify_collection)
    results = rs.do_search(qs)
    return HttpResponse(toJson(results), content_type='application/json')
