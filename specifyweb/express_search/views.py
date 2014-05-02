import re, logging
from collections import namedtuple
from operator import and_, or_
from datetime import date, datetime
from xml.etree import ElementTree

from django.db.models import Q
from django.http import HttpResponse
from django.views.decorators.http import require_GET

from specifyweb.specify import models
from specifyweb.specify.filter_by_col import filter_by_collection
from specifyweb.specify.api import toJson, get_model_or_404, obj_to_data
from specifyweb.specify.views import login_required

from specifyweb.context.app_resource import get_app_resource

logger = logging.getLogger(__name__)

QUOTED_STR_RE = re.compile(r'^([\'"`])(.*)\1$')


class Term(namedtuple("Term", "term is_suffix is_prefix is_number maybe_year is_integer as_date")):
    discipline = None

    @classmethod
    def make_term(cls, term):
        is_suffix = term.startswith('*')
        is_prefix = term.endswith('*')
        term = term.strip('*')

        try:
            float(term)
            is_number = True
        except ValueError:
            is_number = False

        try:
            maybe_year = 1000 <= int(term) <= date.today().year
            is_integer = True
        except ValueError:
            maybe_year = is_integer = False

        for format in ('%m/%d/%Y', '%Y-%m-%d',):
            try:
                as_date = datetime.strptime(term, format).date()
                break
            except ValueError:
                pass
        else:
            as_date = None

        return cls(term, is_suffix, is_prefix, is_number, maybe_year, is_integer, as_date)

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
            from specifyweb.specify.models import Splocalecontaineritem
            args = dict(
                container__schematype=0, # core schema
                container__discipline=self.discipline,
                name__iexact=field.name,
                container__name__iexact=field.model.__name__)
            fieldinfo = Splocalecontaineritem.objects.get(**args)
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
        if self.is_integer:
            return Q(**{ field.name: int(self.term) })

    def create_date_filter(self, field):
        if self.maybe_year:
            return Q(**{ field.name + '__year': int(self.term) })

        if self.as_date:
            return Q(**{ field.name: self.as_date })

    def create_float_filter(self, field):
        if self.is_number:
            return Q(**{ field.name: float(self.term) })

def parse_search_str(collection, search_str):
    class TermForCollection(Term):
        discipline = collection.discipline

    match_quoted = QUOTED_STR_RE.match(search_str)
    if match_quoted:
        terms = [ match_quoted.groups()[1] ]
    else:
        terms = search_str.split()

    return map(TermForCollection.make_term, terms)

def build_queryset(searchtable, terms, collection):
    tablename = searchtable.find('tableName').text.capitalize()
    model = getattr(models, tablename)

    fields = [model._meta.get_field(fn.text.lower())
              for fn in searchtable.findall('.//searchfield/fieldName')]

    filters = [filtr
               for filtr in [
                   term.create_filter(field)
                   for term in terms
                   for field in fields]
               if filtr is not None]

    if len(filters) > 0:
        reduced = reduce(or_, filters)
        return filter_by_collection(model.objects.filter(reduced), collection, strict=False)
    logger.info("no filters for query. model: %s fields: %s terms: %s", model, fields, terms)
    return None

def get_express_search_config(request):
    resource, __ = get_app_resource(request.specify_collection,
                                    request.specify_user,
                                    'ExpressSearchConfig')
    return ElementTree.XML(resource)

@require_GET
@login_required
def search(request):
    express_search_config = get_express_search_config(request)
    terms = parse_search_str(request.specify_collection, request.GET['q'])
    specific_table = request.GET.get('name', None)

    def do_search(tablename, searchtable):
        qs = build_queryset(searchtable, terms, request.specify_collection)
        if qs is None:
            return dict(totalCount=0, results=[])

        display_fields = [fn.text.lower() \
                              for fn in searchtable.findall('.//displayfield/fieldName')]
        display_fields.append('id')
        qs = qs.values(*display_fields).order_by('id')
        total_count = qs.count()

        if specific_table is not None:
            limit = int(request.GET.get('limit', 20))
            offset = int(request.GET.get('offset', 0))
            results = list(qs[offset:offset+limit])
        else:
            results = list(qs)

        return dict(totalCount=total_count, results=results)

    data = dict((tablename, do_search(tablename, searchtable))
                for searchtable in express_search_config.findall('tables/searchtable')
                for tablename in [ searchtable.find('tableName').text.capitalize() ]
                if specific_table is None or tablename == specific_table)

    return HttpResponse(toJson(data), content_type='application/json')

@require_GET
@login_required
def related_search(request):
    from . import related_searches
    express_search_config = get_express_search_config(request)
    related_search = getattr(related_searches, request.GET['name'])
    related_qss = []
    for rs in related_search.get_all():
        model = rs.pivot()
        for searchtable in express_search_config.findall('tables/searchtable'):
            tablename = searchtable.find('tableName').text.capitalize()
            if tablename == model.__name__: break
        else:
            continue

        terms = parse_search_str(request.specify_collection, request.GET['q'])
        qs = build_queryset(searchtable, terms, request.specify_collection)
        related_qss.append(rs.do_search(qs))
                           
    final_result = related_search.final_result(related_qss,
                                               offset=int(request.GET.get('offset', 0)),
                                               limit=int(request.GET.get('limit', 20)))

    return HttpResponse(toJson(final_result), content_type='application/json')

@require_GET
@login_required
def querycbx_search(request, model):
    model = get_model_or_404(model)
    fields = [fieldname
              for fieldname in request.GET
              if fieldname not in ('limit', 'offset')]

    filters = []
    for field in fields:
        filters_for_field = []
        terms = parse_search_str(request.specify_collection, request.GET[field])
        logger.debug("found terms: %s for %s", terms, field)
        for term in terms:
            filter_for_term = term.create_filter(model._meta.get_field(field))
            if filter_for_term is not None:
                filters_for_field.append(filter_for_term)

        logger.debug("filtering %s with %s", field, filters_for_field)
        if len(filters_for_field) > 0:
            filters.append(reduce(or_, filters_for_field))

    if len(filters) > 0:
        combined = reduce(and_, filters)
        qs = filter_by_collection(model.objects.filter(combined), request.specify_collection, strict=False)
    else:
        qs = model.objects.none()

    results = [obj_to_data(obj) for obj in qs[:10]]
    return HttpResponse(toJson(results), content_type='application/json')
