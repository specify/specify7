import logging
import re

from xml.etree import ElementTree
from xml.sax.saxutils import quoteattr

from sqlalchemy import orm, inspect
from sqlalchemy.sql.expression import case, func, cast
from sqlalchemy.sql.functions import concat, coalesce, count
from sqlalchemy import types

from specifyweb.context.app_resource import get_app_resource
from specifyweb.specify.models import datamodel, Spappresourcedata, Splocalecontaineritem

from . import models
from .queryfieldspec import build_join
from .group_concat import group_concat

logger = logging.getLogger(__name__)

CollectionObject_model = datamodel.get_table('CollectionObject')
Agent_model = datamodel.get_table('Agent')

class ObjectFormatter(object):
    def __init__(self, collection, user):
        formattersXML, _ = get_app_resource(collection, user, 'DataObjFormatters')
        self.formattersDom = ElementTree.fromstring(formattersXML)
        self.date_format = get_date_format()
        self.collection = collection

    def getFormatterDef(self, specify_model, formatter_name):
        def lookup(attr, val):
            return self.formattersDom.find('format[@%s=%s]' % (attr, quoteattr(val)))
        return (formatter_name and lookup('name', formatter_name)) \
            or lookup('class', specify_model.classname)

    def getAggregatorDef(self, specify_model, aggregator_name):
        def lookup(attr, val):
            return self.formattersDom.find('aggregators/aggregator[@%s=%s]' % (attr, quoteattr(val)))
        return (aggregator_name and lookup('name', aggregator_name)) \
            or lookup('class', specify_model.classname)

    def catalog_number_is_numeric(self):
        try:
            locale_item = Splocalecontaineritem.objects.get(
                container__discipline=self.collection.discipline,
                container__name='collectionobject',
                container__schematype=0,
                name='catalogNumber')
            formatter = locale_item.format
        except Splocalecontaineritem.DoesNotExist:
            return False

        return formatter == 'CatalogNumberNumeric'

    def objformat(self, query, orm_table, formatter_name, join_cache=None):
        logger.info('formatting %s using %s', orm_table, formatter_name)
        specify_model = datamodel.get_table(inspect(orm_table).class_.__name__, strict=True)
        formatterNode = self.getFormatterDef(specify_model, formatter_name)
        logger.debug("using dataobjformater: %s", ElementTree.tostring(formatterNode))

        switchNode = formatterNode.find('switch')

        def make_expr(query, fieldNode):
            path = fieldNode.text.split('.')
            query, table, model, specify_field = build_join(query, specify_model, orm_table, path, join_cache)
            if specify_field.is_relationship:
                formatter_name = fieldNode.attrib.get('formatter', None)
                query, expr = self.objformat(query, table, formatter_name, join_cache)
            else:
                expr = self._fieldformat(specify_field, getattr(table, specify_field.name))

            if 'sep' in fieldNode.attrib:
                expr = concat(fieldNode.attrib['sep'], expr)

            return query, coalesce(expr, '')

        def make_case(query, caseNode):
            field_exprs = []
            for node in caseNode.findall('field'):
                query, expr = make_expr(query, node)
                field_exprs.append(expr)

            expr = concat(*field_exprs) if len(field_exprs) > 1 else field_exprs[0]
            return query, caseNode.attrib.get('value', None), expr

        cases = []
        for caseNode in switchNode.findall('fields'):
            query, value, expr = make_case(query, caseNode)
            cases.append((value, expr))

        if switchNode.attrib.get('single', 'true') == 'true':
            value, expr = cases[0]
        else:
            control_field = getattr(orm_table, switchNode.attrib['field'])
            expr = case(cases, control_field)

        return query, coalesce(expr, '')

    def aggregate(self, query, field, rel_table, aggregator_name):
        logger.info('aggregating field %s on %s using %s', field, rel_table, aggregator_name)
        specify_model = datamodel.get_table(field.relatedModelName, strict=True)
        aggregatorNode = self.getAggregatorDef(specify_model, aggregator_name)
        logger.debug("using aggregator: %s", ElementTree.tostring(aggregatorNode))
        formatter_name = aggregatorNode.attrib.get('format', None)
        separator = aggregatorNode.attrib.get('separator', None)
        order_by = aggregatorNode.attrib.get('orderfieldname', None)

        orm_table = getattr(models, field.relatedModelName)
        if order_by is not None and order_by != '':
            order_by = getattr(orm_table, order_by)

        join_column = list(inspect(getattr(orm_table, field.otherSideName)).property.local_columns)[0]
        subquery = orm.Query([]).select_from(orm_table) \
                             .filter(join_column == getattr(rel_table, rel_table._id)) \
                             .correlate(rel_table)
        subquery, formatted = self.objformat(subquery, orm_table, formatter_name, {})
        aggregated = coalesce(group_concat(formatted, separator, order_by), '')
        return subquery.add_column(aggregated).as_scalar()

    def fieldformat(self, query_field, field):
        field_spec = query_field.fieldspec
        if field_spec.get_field() is None:
            return field

        field_type = field_spec.get_field().type


        if field_type in ("java.sql.Timestamp", "java.util.Calendar", "java.util.Date") \
           and field_spec.date_part == "Full Date":
            return func.date_format(field, self.date_format)

        if field_spec.tree_rank is not None:
            return field

        if field_spec.is_relationship():
            return field

        return self._fieldformat(field_spec.get_field(), field)

    def _fieldformat(self, specify_field, field):
        if specify_field.type == "java.lang.Boolean":
            return field != 0

        if specify_field.type in ("java.lang.Integer", "java.lang.Short"):
            return field

        if specify_field is CollectionObject_model.get_field('catalogNumber') \
           and self.catalog_number_is_numeric():
            return cast(field, types.Numeric(65)) # 65 is the mysql max precision

        if specify_field is Agent_model.get_field('agentType'):
            return case({0: 'Organization', 1: 'Person', 2: 'Other', 3: 'Group'}, field)

        return field


def get_date_format():
    res = Spappresourcedata.objects.filter(
        spappresource__name='preferences',
        spappresource__spappresourcedir__usertype='Prefs')
    remote_prefs = '\n'.join(r.data for r in res)
    match = re.search(r'ui\.formatting\.scrdateformat=(.+)', remote_prefs)
    date_format = match.group(1) if match is not None else 'yyyy-MM-dd'
    mysql_date_format = LDLM_TO_MYSQL.get(date_format, "%Y-%m-%d")
    logger.debug("dateformat = %s = %s", date_format, mysql_date_format)
    return mysql_date_format

LDLM_TO_MYSQL = {
    "MM dd yy":   "%m %d %y",
    "MM dd yyyy": "%m %d %Y",
    "MM-dd-yy":   "%m-%d-%y",
    "MM-dd-yyyy": "%m-%d-%Y",
    "MM.dd.yy":   "%m.%d.%y",
    "MM.dd.yyyy": "%m.%d.%Y",
    "MM/dd/yy":   "%m/%d/%y",
    "MM/dd/yyyy": "%m/%d/%Y",
    "dd MM yy":   "%d %m %y",
    "dd MM yyyy": "%d %m %Y",
    "dd MMM yyyy":"%d %b %Y",
    "dd-MM-yy":   "%d-%m-%y",
    "dd-MM-yyyy": "%d-%m-%Y",
    "dd-MMM-yyyy":"%d-%b-%Y",
    "dd.MM.yy":   "%d.%m.%y",
    "dd.MM.yyyy": "%d.%m.%Y",
    "dd.MMM.yyyy":"%d.%b.%Y",
    "dd/MM/yy":   "%d/%m/%y",
    "dd/MM/yyyy": "%d/%m/%Y",
    "dd/MMM/yyy": "%d/%b/%Y",
    "yyyy MM dd": "%Y %m %d",
    "yyyy-MM-dd": "%Y-%m-%d",
    "yyyy.MM.dd": "%Y.%m.%d",
    "yyyy/MM/dd": "%Y/%m/%d",
}
