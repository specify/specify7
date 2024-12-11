"""
Supports autonumbering mechanism
"""


import logging
import re
from datetime import date
from typing import NamedTuple, List, Optional, Sequence
from xml.etree import ElementTree
from xml.sax.saxutils import quoteattr

from django.core.exceptions import ObjectDoesNotExist
from django.db import connection

logger = logging.getLogger(__name__)

from specifyweb.context.app_resource import get_app_resource

from .models import Splocalecontaineritem as Item
from .filter_by_col import filter_by_collection

class AutonumberOverflowException(Exception):
    pass

class ScopeInfo(NamedTuple):
    db_id_field: str
    id: int
    scope: str
    django_id_field: str

def get_autonumber_group_filter(model, collection, format_name: str):
    default = lambda objs: filter_by_collection(objs, collection)

    scope_info = (
        ScopeInfo('collectionid', collection.id, 'coll', 'collectionmemberid') if hasattr(model, 'collectionmemberid') else
        ScopeInfo('disciplineid', collection.discipline.id, 'dsp', 'discipline_id') if hasattr(model, 'discipline_id') else
        ScopeInfo('divisionid', collection.discipline.division.id, 'div', 'division_id') if hasattr(model, 'division_id') else
        None
    )

    logger.info("autonumbering with %s and format_name = %r", scope_info, format_name)

    if scope_info is None or scope_info.db_id_field is None or scope_info.id is None:
        logger.debug("using default collection based autonumbering b/c of missing scope_info fields")
        return default

    sql = '''
    select distinct m.{db_id_field} from autonumsch_{scope} a
    inner join autonumberingscheme ans on ans.autonumberingschemeid = a.autonumberingschemeid
    inner join autonumsch_{scope} m on m.autonumberingschemeid = ans.autonumberingschemeid
    where a.{db_id_field} = %(gid)s and formatname = %(format_name)s
    '''.format(**scope_info._asdict())

    cursor = connection.cursor()
    try:
        cursor.execute(sql, {'gid': scope_info.id, 'format_name': format_name})
        rows = cursor.fetchall()
    finally:
        cursor.close()

    if len(rows) > 0:
        an_filter = {scope_info.django_id_field + '__in': [r[0] for r in rows]}
        logger.debug("using %s for autonumber filtering", an_filter)
        return lambda objs: objs.filter(**an_filter)
    else:
        logger.debug("using default collection based autonumbering b/c no autonumsch was found")
        return default

class FormatMismatch(ValueError):
    def __init__(self, *args: object, value: str, formatter: str) -> None:
        super().__init__(*args)
        self.value = value
        self.formatter = formatter
    pass

class UIFormatter(NamedTuple):
    model_name: str
    field_name: str
    fields: List
    format_name: str

    def parse_regexp(self) -> str:
        regexp = ''.join('(%s)' % f.wild_or_value_regexp() for f in self.fields)
        return '^%s$' % regexp

    def parse(self, value: str) -> Sequence[str]:
        match = re.match(self.parse_regexp(), value)
        if match is None:
            raise FormatMismatch("value {} doesn't match formatter {}".format(repr(value), self.value()), value=repr(value), formatter=self.value())
        return match.groups()

    def value(self) -> str:
        return ''.join(f.value for f in self.fields)

    def needs_autonumber(self, vals: Sequence[str]) -> bool:
        for f, v in zip(self.fields, vals):
            if f.is_wild(v):
                logger.debug("found wild field: %s with value: %s", f, v)
                return True
        logger.debug("no wild fields found")
        return False

    def autonumber_regexp(self, vals: Sequence[str]) -> str:
        return '^{}$'.format(''.join(
            '({})'.format(field.value_regexp() if field.is_wild(val) else re.escape(val))
            for field, val in zip(self.fields, vals)
        ))

    def fillin_year(self, vals: Sequence[str], year: Optional[int]=None) -> List[str]:
        if year is None:
            year = date.today().year

        return [
            ("%d" % year) if field.by_year and field.is_wild(val) else val
            for field, val in zip(self.fields, vals)
        ]

    def autonumber_now(self, collection, model, vals: Sequence[str], year: Optional[int]=None) -> str:
        with_year = self.fillin_year(vals, year)
        fieldname = self.field_name.lower()

        filtered_objs = self._autonumber_queryset(collection, model, fieldname, with_year)

        try:
            biggest = filtered_objs[0]
        except IndexError:
            filled_vals = self.fill_vals_no_prior(with_year)
        else:
            filled_vals = self.fill_vals_after(getattr(biggest, fieldname))

        return ''.join(filled_vals)

    def _autonumber_queryset(self, collection, model, fieldname: str, with_year: List[str]):
        group_filter = get_autonumber_group_filter(model, collection, self.format_name)
        objs = model.objects.filter(**{ fieldname + '__regex': self.autonumber_regexp(with_year) })
        return group_filter(objs).order_by('-' + fieldname)

    def prepare_autonumber_thunk(self, collection, model, vals: Sequence[str], year: Optional[int]=None):
        with_year = self.fillin_year(vals, year)
        fieldname = self.field_name.lower()

        filtered_objs = self._autonumber_queryset(collection, model, fieldname, with_year)
        # At this point the query for the autonumber is defined but not yet executed.

        # The actual lookup and setting of the autonumbering value
        # is thunked so that it can be executed in context of locked tables.
        def apply_autonumbering_to(obj):
            try:
                biggest = filtered_objs[0] # actual lookup occurs here
            except IndexError:
                filled_vals = self.fill_vals_no_prior(with_year)
            else:
                filled_vals = self.fill_vals_after(getattr(biggest, fieldname))

            # And here the new value is assigned to the object.  It is
            # the callers responsibilty to save the object within the
            # same locked tables context because there maybe multiple
            # autonumber fields.
            setattr(obj, self.field_name.lower(), ''.join(filled_vals))

        return apply_autonumbering_to

    def fill_vals_after(self, prior: str) -> List[str]:

        def inc_val(size: int, val: str) -> str:
            format_code = "%0{}d".format(size)
            new_val = format_code % (1 + int(val))
            if len(new_val) > size:
                raise AutonumberOverflowException(
                    'created value: %s longer than limit: %d current max: %s' %
                    (new_val, size, prior))
            return new_val

        return [
            inc_val(field.size, val) if field.inc else val
            for field, val in zip(self.fields, self.parse(prior))
        ]

    def fill_vals_no_prior(self, vals: Sequence[str]) -> List[str]:
        return [
            "1".zfill(field.size) if field.is_wild(val) else val
            for field, val in zip(self.fields, vals)
        ]

    def canonicalize(self, values: Sequence[str]) -> str:
        return ''.join([field.canonicalize(value) for field, value in zip(self.fields, values)])

class Field(NamedTuple):
    size: int
    value: str
    inc: bool
    by_year: bool

    def can_autonumber(self) -> bool:
        return self.inc or self.by_year

    def wild_regexp(self) -> str:
        return re.escape(self.value)

    def value_regexp(self) -> str:
        return self.wild_regexp()

    def is_wild(self, value: str) -> bool:
        logger.debug("%s checking if value %s is wild", self, value)
        return bool(re.match("^%s$" % self.wild_regexp(), value) and not
                    re.match("^%s$" % self.value_regexp(), value))

    def wild_or_value_regexp(self) -> str:
        if self.can_autonumber():
            return '%s|%s' % (self.wild_regexp(), self.value_regexp())
        else:
            return self.value_regexp()

    def canonicalize(self, value: str) -> str:
        return value

class NumericField(Field):
    def __new__(cls, size, value=None, inc=False, by_year=False):
        value = size * '#'
        return Field.__new__(cls, size, value, inc, by_year)

    def value_regexp(self) -> str:
        return r'[0-9]{%d}' % self.size

class YearField(Field):
    def value_regexp(self) -> str:
        return r'[0-9]{%d}' % self.size

class AlphaNumField(Field):
    def value_regexp(self) -> str:
        return r'[a-zA-Z0-9]{%d}' % self.size

class AnyCharField(Field):
    def value_regexp(self) -> str:
        return r'.{%d}' % self.size

class RegexField(Field):
    def value_regexp(self) -> str:
        return self.value

class AlphaField(Field):
    def value_regexp(self) -> str:
        return r'[a-zA-Z]{%d}' % self.size

class ConstantField(Field):
    def is_wild(self, value: str) -> bool:
        return False

    def value_regexp(self) -> str:
        return self.wild_regexp()

class SeparatorField(Field):
    def is_wild(self, value: str) -> bool:
        return False

    def value_regexp(self) -> str:
        return self.wild_regexp()

class CNNField(NumericField):
    def __new__(cls):
        return NumericField.__new__(cls, size=9, inc=9)

    def value_regexp(self) -> str:
        return r'[0-9]{0,%d}' % self.size

    def canonicalize(self, value: str) -> str:
        return value.zfill(self.size)

def get_uiformatter_by_name(collection, user, formatter_name: str) -> Optional[UIFormatter]:
    xml, _, __ = get_app_resource(collection, user, "UIFormatters")
    node = ElementTree.XML(xml).find('.//format[@name=%s]' % quoteattr(formatter_name))
    if node is None: return None
    external = node.find('external')
    if external is not None and external.text is not None:
        name = external.text.split('.')[-1]
        if name == 'CatalogNumberUIFieldFormatter':
            return UIFormatter('CollectionObject', 'CatalogNumber', [CNNField()], formatter_name)
        else:
            return None
    else:
        return UIFormatter(
            model_name = node.attrib['class'].split('.')[-1],
            field_name = node.attrib['fieldname'],
            fields = list(map(new_field, node.findall('field'))),
            format_name = formatter_name,
        )

def new_field(node) -> Field:
    Field = {
        'constant': ConstantField,
        'alpha': AlphaField,
        'numeric': NumericField,
        'year': YearField,
        'alphanumeric': AlphaNumField,
        'anychar': AnyCharField,
        'regex': RegexField,
        'separator': SeparatorField
        }[node.attrib['type']]
    return Field(
        size = int(node.attrib['size']) if 'size' in node.attrib else None,
        value = node.attrib.get('value', None),
        inc = node.attrib.get('inc', 'false') == 'true',
        by_year = node.attrib.get('byyear', 'false') == 'true')

def get_uiformatters(collection, obj, user) -> List[UIFormatter]:
    tablename = obj.__class__.__name__
    filters = dict(container__discipline=collection.discipline,
                   container__name=tablename.lower(),
                   format__isnull=False)

    formatter_names = list(
        Item.objects
        .filter(**filters)
        .exclude(container__name='collectionobject', name='catalognumber')
        .values_list('format', flat=True)
    )

    logger.debug("formatters for %s: %s", tablename, formatter_names)

    uiformatters = [
        f for f in
        (get_uiformatter_by_name(collection, user, fn) for fn in formatter_names)
        if f is not None
    ]
    if tablename.lower() == 'collectionobject':
        cat_num_format = get_catalognumber_format(collection, obj, user)
        if cat_num_format: uiformatters.append(cat_num_format)

    logger.debug("uiformatters for %s: %s", tablename, uiformatters)
    return uiformatters

def get_uiformatter(collection, tablename: str, fieldname: str) -> Optional[UIFormatter]:

    if tablename.lower() == "collectionobject" and fieldname.lower() == "catalognumber":
        return get_catalognumber_format(collection, None, None)

    try:
        field_format = Item.objects.get(
            container__discipline=collection.discipline,
            container__name=tablename.lower(),
            name=fieldname.lower(),
            format__isnull=False).format
    except ObjectDoesNotExist:
        return None
    else:
        return get_uiformatter_by_name(collection, None, field_format)

def get_catalognumber_format(collection, collection_object, user) -> UIFormatter: 
    cot_formatter = getattr(getattr(collection_object, 'collectionobjecttype', None), 'catalognumberformatname', None)
    if cot_formatter: 
        return get_uiformatter_by_name(collection, user, cot_formatter)
    else: 
        return get_uiformatter_by_name(collection, user, collection.catalognumformatname)
