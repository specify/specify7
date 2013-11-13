import re
from xml.etree import ElementTree
from datetime import date

from specifyweb.context.app_resource import get_app_resource

from .filter_by_col import filter_by_collection

def get_uiformatter(collection, user, formatter_name):
    xml, __ = get_app_resource(collection, user, "UIFormatters")
    node = ElementTree.XML(xml).find('.//format[@name="%s"]' % formatter_name)
    if node is None: return None
    external = node.find('external')
    if external is not None:
        name = external.text.split('.')[-1]
        if name == 'CatalogNumberUIFieldFormatter':
            return CatalogNumberNumeric()
        else:
            return None
    else:
        return UIFormatter(
            model_name = node.attrib['class'].split('.')[-1],
            field_name = node.attrib['fieldname'],
            fields = map(new_field, node.findall('field')))

class AutonumberOverflowException(Exception):
    pass

class UIFormatter(object):
    def __init__(self, model_name, field_name, fields):
        self.model_name = model_name
        self.field_name = field_name
        self.fields = fields

    def parse_regexp(self):
        regexp = ''.join('(%s)' % f.wild_or_value_regexp() for f in self.fields)
        return '^%s$' % regexp

    def parse(self, value):
        match = re.match(self.parse_regexp(), value)
        if match is None:
            raise ValueError("value doesn't match formatter")
        return match.groups()

    def needs_autonumber(self, vals):
        for f, v in zip(self.fields, vals):
            if f.is_wild(v): return True
        return False

    def autonumber_regexp(self, vals):
        regexp = []
        for field, val in zip(self.fields, vals):
            if field.is_wild(val):
                regexp.append('(%s)' % field.value_regexp())
            else:
                regexp.append('(%s)' % re.escape(val))
        return '^%s$' % ''.join(regexp)

    def fillin_year(self, vals, year=None):
        filled_vals = []
        for field, val in zip(self.fields, vals):
            if field.by_year and field.is_wild(val):
                filled_vals.append("%d" % (year or date.today().year))
            else:
                filled_vals.append(val)
        return filled_vals

    def autonumber(self, collection, model, vals, year=None):
        with_year = self.fillin_year(vals, year)
        fieldname = self.field_name.lower()

        objs = model.objects.filter(**{ fieldname + '__regex': self.autonumber_regexp(with_year) })
        try:
            biggest = filter_by_collection(objs, collection).order_by('-' + fieldname)[0]
        except IndexError:
            filled_vals = self.fill_vals_no_prior(with_year)
        else:
            filled_vals = self.fill_vals_after(getattr(biggest, fieldname))
        return ''.join(filled_vals)

    def fill_vals_after(self, prior):
        filled = []
        for field, val in zip(self.fields, self.parse(prior)):
            if field.inc:
                new_val = ("%0" + str(field.size) + "d") % (1 + int(val))
                if len(new_val) > field.size:
                    raise AutonumberOverflowException(
                        'created value: %s longer than limit: %d current max: %s' %
                        (new_val, field.size, prior))
                filled.append(new_val)
            else:
                filled.append(val)
        return filled

    def fill_vals_no_prior(self, vals):
        filled = []
        for field, val in zip(self.fields, vals):
            if field.is_wild(val):
                filled.append(field.size * "0")
            else:
                filled.append(val)
        return filled

    def canonicalize(self, values):
        return ''.join([field.canonicalize(value) for field, value in zip(self.fields, values)])

def new_field(node):
    Field = {
        'numeric': NumericField,
        'year': YearField,
        'alphanumeric': AlphaNumField,
        'separator': SeparatorField
        }[node.attrib['type']]
    return Field(
        size = int(node.attrib['size']),
        value = node.attrib.get('value'),
        inc = node.attrib.get('inc') == 'true',
        by_year = node.attrib.get('byyear') == 'true')


class Field(object):
    def __init__(self, size, value, inc, by_year):
        self.size = size
        self.value = value
        self.inc = inc
        self.by_year = by_year

    def can_autonumber(self):
        return self.inc or self.by_year

    def wild_regexp(self):
        return re.escape(self.value)

    def is_wild(self, value):
        return re.match(self.wild_regexp(), value) \
            and not re.match(self.value_regexp(), value)

    def wild_or_value_regexp(self):
        if self.can_autonumber():
            return '%s|%s' % (self.wild_regexp(), self.value_regexp())
        else:
            return self.value_regexp()

    def canonicalize(self, value):
        return value

class NumericField(Field):
    def __init__(self, size, value=None, inc=False, by_year=False):
        value = size * '#'
        Field.__init__(self, size, value, inc, by_year)

    def value_regexp(self):
        return r'[0-9]{%d}' % self.size

class YearField(Field):
    def value_regexp(self):
        return r'[0-9]{%d}' % self.size

class AlphaNumField(Field):
    def value_regexp(self):
        return r'[a-zA-Z0-9]{%d}' % self.size

class SeparatorField(Field):
    def is_wild(self, value):
        return False

    def value_regexp(self):
        return self.wild_regexp()

class CatalogNumberNumeric(UIFormatter):
    class CNNField(NumericField):
        def __init__(self):
            NumericField.__init__(self, size=9, inc=True)

        def value_regexp(self):
            return r'[0-9]{0,%d}' % self.size

        def canonicalize(self, value):
            return '0' * (self.size - len(value)) + value

    def __init__(self):
        UIFormatter.__init__(self,
                             model_name='CollectionObject',
                             field_name='catalogNumber',
                             fields=[CatalogNumberNumeric.CNNField()])
