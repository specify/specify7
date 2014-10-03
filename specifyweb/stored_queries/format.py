import logging

from xml.etree import ElementTree
from xml.sax.saxutils import quoteattr

from sqlalchemy import orm, inspect
from sqlalchemy.sql.expression import case
from sqlalchemy.sql.functions import concat, coalesce

from specifyweb.context.app_resource import get_app_resource
from specifyweb.specify.models import datamodel

from . import models
from .queryfieldspec import build_join

logger = logging.getLogger(__name__)

class ObjectFormatter(object):
    def __init__(self, collection, user):
        formattersXML, _ = get_app_resource(collection, user, 'DataObjFormatters')
        self.formattersDom = ElementTree.fromstring(formattersXML)

    def getFormatterDef(self, specify_model, formatter_name):
        def lookup(attr, val):
            return self.formattersDom.find('format[@%s=%s]' % (attr, quoteattr(val)))
        return (formatter_name and lookup('name', formatter_name)) \
            or lookup('class', specify_model.classname)

    def objformat(self, query, orm_table, formatter_name, join_cache=None):
        specify_model = datamodel.get_table(inspect(orm_table).class_.__name__, strict=True)
        formatterNode = self.getFormatterDef(specify_model, formatter_name)
        logger.debug("using dataobjformater: %s", ElementTree.tostring(formatterNode))

        switchNode = formatterNode.find('switch')

        def make_expr(query, fieldNode):
            path = fieldNode.text.split('.')
            query, table, model = build_join(query, specify_model, orm_table, path, join_cache)
            specify_field = model.get_field(path[-1])
            if specify_field.is_relationship:
                formatter_name = fieldNode.attrib.get('formatter', None)
                query, expr = self.objformat(query, table, formatter_name, join_cache)
            else:
                expr = coalesce(getattr(table, specify_field.name), '')
            exprs = (fieldNode.attrib['sep'], expr) if 'sep' in fieldNode.attrib else (expr, )

            return query, exprs

        def make_case(query, caseNode):
            field_exprs = []
            for node in caseNode.findall('field'):
                query, exprs = make_expr(query, node)
                field_exprs.extend(exprs)

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

        return query, expr
