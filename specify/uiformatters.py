import re
from xml.etree import ElementTree
from datetime import date

from filter_by_col import filter_by_collection
from context.app_resource import get_app_resource

def get_uiformatter(collection, user, formatter_name):
    xml, __ = get_app_resource(collection, user, "UIFormatters")
    node = ElementTree.XML(xml).find('.//format[@name="%s"]' % formatter_name)
    return node and UIFormatter(node)

class AutonumberOverflowException(Exception):
    pass

class UIFormatter(object):
    def __init__(self, node):
        self.system = node.attrib['system'] == 'true'
        self.name = node.attrib['name']
        self.model_name = node.attrib['class'].split('.')[-1]
        self.field_name = node.attrib['fieldname']
        self.is_external = node.find('external') is not None
        if self.is_external: return
        self.fields = map(new_field, node.findall('field'))

    def parse_regexp(self):
        regexp = ''.join('(%s)' % f.wild_or_value_regexp() for f in self.fields)
        return '^%s$' % regexp

    def parse(self, value):
        match = re.match(self.parse_regexp(), value)
        if match is None:
            raise ValueError("value doesn't match formatter")
        return match.groups()

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

    def autonumber(self, collection, model, fieldname, vals, year=None):
        with_year = self.fillin_year(vals, year)

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
                    raise AutonumberOverflowException()
                filled.append(new_val)
            else:
                filled.append(val)
        return filled

    def fill_vals_no_prior(self, vals):
        filled = []
        for field, val in zip(self.fields, vals):
            if field.is_wild(val):
                filled.append(self.size * "0")
            else:
                filled.append(val)
        return filled

def new_field(node):
    by_type = {
        'numeric': NumericField,
        'year': YearField,
        'alphanumeric': AlphaNumField,
        'separator': SeparatorField
        }
    return by_type[node.attrib['type']](node)

class Field(object):
    def __init__(self, node):
        self.type = node.attrib['type']
        self.size = int(node.attrib['size'])
        self.value = node.attrib.get('value')
        self.inc = node.attrib.get('inc') == 'true'
        self.by_year = node.attrib.get('byyear') == 'true'

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

class NumericField(Field):
    def __init__(self, node):
        Field.__init__(self, node)
        self.value = self.size * '#'

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
