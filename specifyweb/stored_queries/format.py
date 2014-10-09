import logging

from xml.etree import ElementTree
from xml.sax.saxutils import quoteattr

from sqlalchemy import orm, inspect
from sqlalchemy.sql.expression import case
from sqlalchemy.sql.functions import concat, coalesce, count

from specifyweb.context.app_resource import get_app_resource
from specifyweb.specify.models import datamodel

from . import models
from .queryfieldspec import build_join
from .group_concat import group_concat

logger = logging.getLogger(__name__)

class ObjectFormatter(object):
    def __init__(self, collection, user):
        formattersXML, _ = get_app_resource(collection, user, 'DataObjFormatters')
        logger.debug(formattersXML)
        self.formattersDom = ElementTree.fromstring(formattersXML)

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
                expr = getattr(table, specify_field.name)

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
        if order_by is not None:
            order_by = getattr(orm_table, order_by)

        join_column = list(inspect(getattr(orm_table, field.otherSideName)).property.local_columns)[0]
        subquery = orm.Query([]).select_from(orm_table) \
                             .filter(join_column == getattr(rel_table, rel_table._id)) \
                             .correlate(rel_table)
        subquery, formatted = self.objformat(subquery, orm_table, formatter_name, {})
        aggregated = coalesce(group_concat(formatted, separator, order_by), '')
        return subquery.add_column(aggregated).as_scalar()
