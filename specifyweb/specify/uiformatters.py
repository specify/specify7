import re, logging
from collections import namedtuple
from xml.etree import ElementTree
from xml.sax.saxutils import quoteattr

from datetime import date
logger = logging.getLogger(__name__)

from specifyweb.context.app_resource import get_app_resource

from .filter_by_col import filter_by_collection

def get_uiformatter(collection_arg, user, formatter_name):
    xml, __ = get_app_resource(collection_arg, user, "UIFormatters")
    node = ElementTree.XML(xml).find('.//format[@name=%s]' % quoteattr(formatter_name))
    if node is None: return None
    external = node.find('external')
    if external is not None:
        name = external.text.split('.')[-1]
        if name == 'CatalogNumberUIFieldFormatter':
            return UIFormatter(model_name = 'CollectionObject', field_name = 'CatalogNumber', fields = [CNNField()],format_name = formatter_name, collection = collection_arg)
        else:
            return None
    else:
        return UIFormatter(
            model_name = node.attrib['class'].split('.')[-1],field_name = node.attrib['fieldname'], fields = map(new_field, node.findall('field')), format_name = formatter_name, collection = collection_arg)

class AutonumberOverflowException(Exception):
    pass

class UIFormatter(namedtuple("UIFormatter", "model_name field_name fields format_name collection")):
    #def __init__(self, a, b, c, d):
    regrouped = False
    grouping = None
    
    def regroup(self):
        if not self.regrouped:
            sql = self.get_grouping_sql()
            self.grouping = self.get_grouping(sql)
            self.regrouped = True
            
    def get_grouping_sql(self):
        #need to pick autonumsch tbl based on model...
        tbl = 'autonumsch_coll'
        fld = 'a.collectionid'
        sql = 'select distinct m.collectionid from ' + tbl + ' a inner join autonumberingscheme ans on ans.autonumberingschemeid = ac.autonumberingschemeid inner join '
        sql += tbl + ' on m.autonumberingschemeid = ans.autonumberingschemeid where '
        sql += fld + ' = ' + str(self.collection.id) + " and formatname = '" + self.format_name + "'"
        return sql

    def get_grouping(self, sql):
        return ('collectionmemberid__in', [4,32768]) 
        
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
            if f.is_wild(v):
                logger.debug("found wild field: %s with value: %s", f, v)
                return True
        logger.debug("no wild fields found")
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

    def filter_by_grouping(self, objs, collection):
        if self.grouping is None:
            return filter_by_collection(objs, collection)
        else:
            #flt = self.grouping[0] + '__in=[' + ",".join(str(g) for g in self.grouping[1]) + ']'
            #print flt
            return objs.filter(**{self.grouping[0]: self.grouping[1]})
        
    def autonumber(self, collection, model, vals, year=None):
        with_year = self.fillin_year(vals, year)
        fieldname = self.field_name.lower()

        objs = model.objects.filter(**{ fieldname + '__regex': self.autonumber_regexp(with_year) })
        self.regroup()
        try:
            #biggest = filter_by_collection(objs, collection).order_by('-' + fieldname)[0]
            biggest = self.filter_by_grouping(objs, collection).order_by('-' + fieldname)[0]
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
                filled.append("1".zfill(field.size))
            else:
                filled.append(val)
        return filled

    def canonicalize(self, values):
        return ''.join([field.canonicalize(value) for field, value in zip(self.fields, values)])

def new_field(node):
    Field = {
        'constant': ConstantField,
        'alpha': AlphaField,
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


class Field(namedtuple("Field", "size value inc by_year")):
    def can_autonumber(self):
        return self.inc or self.by_year

    def wild_regexp(self):
        return re.escape(self.value)

    def is_wild(self, value):
        logger.debug("%s checking if value %s is wild", self, value)
        return (re.match("^%s$" % self.wild_regexp(), value) and not
                re.match("^%s$" % self.value_regexp(), value))

    def wild_or_value_regexp(self):
        if self.can_autonumber():
            return '%s|%s' % (self.wild_regexp(), self.value_regexp())
        else:
            return self.value_regexp()

    def canonicalize(self, value):
        return value

class NumericField(Field):
    def __new__(cls, size, value=None, inc=False, by_year=False):
        value = size * '#'
        return Field.__new__(cls, size, value, inc, by_year)

    def value_regexp(self):
        return r'[0-9]{%d}' % self.size

class YearField(Field):
    def value_regexp(self):
        return r'[0-9]{%d}' % self.size

class AlphaNumField(Field):
    def value_regexp(self):
        return r'[a-zA-Z0-9]{%d}' % self.size

class AlphaField(Field):
    def value_regexp(self):
        return r'[a-zA-Z]{%d}' % self.size

class ConstantField(Field):
    def is_wild(self, value):
        return False

    def value_regexp(self):
        return self.wild_regexp()

class SeparatorField(Field):
    def is_wild(self, value):
        return False

    def value_regexp(self):
        return self.wild_regexp()

class CNNField(NumericField):
    def __new__(cls):
        return NumericField.__new__( cls, size=9, inc=9)

    def value_regexp(self):
        return r'[0-9]{0,%d}' % self.size

    def canonicalize(self, value):
        return '0' * (self.size - len(value)) + value

#class CatalogNumberNumeric(UIFormatter):
        
    #def __new__(cls, formatter_name, collection):
    #    return UIFormatter.__new__(cls,
    #                               model_name='CollectionObject',
    #                               field_name='catalogNumber',
    #                               fields=[CatalogNumberNumeric.CNNField()],
    #                               format_name=formatter_name,
    #                               collection=collection)

    #def __init__(self):
        #self.model_name='CollectionObject'
        #self.field_name='CatalogNumber'
        #self.fields=[CatalogNumberNumeric.CNNField()]
        #self.format_name=formatter_name
        #self.collection=collection
        #UIFormatter.__init__(self)
