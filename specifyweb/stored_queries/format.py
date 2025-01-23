import logging
import re
from django.utils.translation import gettext as _text

from xml.etree import ElementTree
from xml.etree.ElementTree import Element
from xml.sax.saxutils import quoteattr

from sqlalchemy import orm, Table as SQLTable, inspect
from sqlalchemy.sql.expression import case, func, cast, literal, Label
from sqlalchemy.sql.functions import concat
from sqlalchemy.orm.attributes import InstrumentedAttribute
from sqlalchemy.sql.elements import Extract
from sqlalchemy import types

from typing import Tuple, Optional, Union

import specifyweb.context.app_resource as app_resource
from specifyweb.context.remote_prefs import get_remote_prefs

from specifyweb.specify.agent_types import agent_types
from specifyweb.specify.models import datamodel, Splocalecontainer, Splocalecontaineritem, Picklist

from specifyweb.specify.datamodel import Field, Relationship, Table
from specifyweb.stored_queries.queryfield import QueryField

from . import models
from .group_concat import group_concat
from .blank_nulls import blank_nulls
from .query_construct import QueryConstruct
from .queryfieldspec import QueryFieldSpec

logger = logging.getLogger(__name__)

CollectionObject_model = datamodel.get_table('CollectionObject')
Agent_model = datamodel.get_table('Agent')
Spauditlog_model = datamodel.get_table('SpAuditLog')


class ObjectFormatter(object):
    def __init__(self, collection, user, replace_nulls, format_agent_type=False, format_picklist=False):

        formattersXML, _, __ = app_resource.get_app_resource(collection, user, 'DataObjFormatters')
        self.formattersDom = ElementTree.fromstring(formattersXML)
        self.date_format = get_date_format()
        self.date_format_year = MYSQL_TO_YEAR.get(self.date_format)
        self.date_format_month = MYSQL_TO_MONTH.get(self.date_format)
        self.collection = collection
        self.replace_nulls = replace_nulls
        self.aggregator_count = 0
        self.format_agent_type = format_agent_type
        self.format_picklist = format_picklist

    def getFormatterDef(self, specify_model: Table, formatter_name) -> Optional[Element]:
        def lookup(attr: str, val: str) -> Optional[Element]:
            return self.formattersDom.find(
                'format[@%s=%s]' % (attr, quoteattr(val)))

        def lookup_default(attr: str, val: str) -> Optional[Element]:
            elements = self.formattersDom.findall('format[@%s=%s]' % (attr, quoteattr(val)))
            for element in elements:
                if element.get('default') == 'true':
                    return element
            return None
        
        def lookup_name(name: str) -> Optional[Element]:
            elements = self.formattersDom.findall('format[@name=%s]' % quoteattr(name))
            for element in elements:
                if element.get('class') == specify_model.classname:
                    return element
            return None

        def getFormatterFromSchema() -> Element:

            try:
                formatter_name = Splocalecontainer.objects.get(
                    name=specify_model.name.lower(),
                    schematype=0,
                    discipline=self.collection.discipline
                ).format
            except Splocalecontainer.DoesNotExist:
                return None

            if formatter_name:
                return lookup_name(formatter_name)
            else:
                return None

        result = None
        if formatter_name:
            result = lookup_name(formatter_name)

        if result is not None:
            return result

        result = lookup_default('class', specify_model.classname)
        if result is not None:
            return result

        result = getFormatterFromSchema()
        if result is not None:
            return result

        return lookup('class', specify_model.classname)

    def hasFormatterDef(self, specify_model: Table, formatter_name) -> bool:
        if formatter_name is None:
            return False
        elements = self.formattersDom.findall('format[@name=%s]' % quoteattr(formatter_name))
        for element in elements:
            if element.get('class') == specify_model.classname:
                return True
        return False

    def getAggregatorDef(self, specify_model: Table, aggregator_name) -> Optional[Element]:
        def lookup(attr: str, val: str) -> Optional[Element]:
            return self.formattersDom.find('aggregators/aggregator[@%s=%s]' % (attr, quoteattr(val)))

        def lookup_default(attr: str, val: str) -> Optional[Element]:
            elements = self.formattersDom.findall('aggregators/aggregator[@%s=%s]' % (attr, quoteattr(val)))
            for element in elements:
                if element.get('default') == 'true':
                    return element
            return None

        result = None
        if aggregator_name:
            result = lookup('name', aggregator_name)
        return result if result is not None else lookup_default('class', specify_model.classname)

    def catalog_number_is_numeric(self, raw_format_name: Optional[str] = None):
        format_name = raw_format_name if raw_format_name else self.collection.catalognumformatname
        return format_name == 'CatalogNumberNumeric'

    def pseudo_sprintf(self, format, expr):
        """Handle format attribute of fields in data object formatter definitions.

        expr - the expression giving the field to be formatted.

        format - an sprintf style format string. In Specify 6 this is
        given to the java.util.Formatter.format method with the value
        of expr as the sole argument. So, it seems the format sting
        should have only one substitution directive. Only going to
        handle '%s' and '%d' for now.
        """
        if '%s' in format:
            before, after = format.split('%s')
            return concat(before, expr, after)
        elif '%d' in format:
            before, after = format.split('%d')
            return concat(before, expr, after)
        else:
            return format

    def make_expr(self,
                  query: QueryConstruct,
                  path,
                  fieldNodeAttrib,
                  orm_table,
                  specify_model,
                  previous_tables=None,
                  do_blank_null = True
                  ) -> Tuple[
        QueryConstruct, blank_nulls, QueryFieldSpec]:
        path = path.split('.')
        path = [inspect(orm_table).class_.__name__, *path]
        formatter_field_spec = QueryFieldSpec.from_path(path)
        formatter = fieldNodeAttrib.get('formatter', None)
        aggregator = fieldNodeAttrib.get('aggregator', None)
        next_table_name = formatter_field_spec.table.name

        # preserve sql table alias
        formatter_field_spec = formatter_field_spec._replace(root_sql_table=orm_table)

        if formatter_field_spec.is_relationship():
            if previous_tables is not None and next_table_name in [table_name for table_name, _ in previous_tables]:
                return query, literal(_text('')), formatter_field_spec

            new_query, new_expr, _, __ = formatter_field_spec.add_spec_to_query(
                query,
                formatter,
                aggregator, previous_tables)

        else:
            new_query, table, model, specify_field = query.build_join(
                specify_model, orm_table, formatter_field_spec.join_path)
            new_expr = getattr(table, specify_field.name)

        if 'format' in fieldNodeAttrib:
            new_expr = self.pseudo_sprintf(fieldNodeAttrib['format'], new_expr)

        if 'sep' in fieldNodeAttrib:
            new_expr = concat(fieldNodeAttrib['sep'], new_expr)

        return new_query, blank_nulls(new_expr) if do_blank_null else new_expr, formatter_field_spec

    def objformat(self, query: QueryConstruct, orm_table: SQLTable,
                  formatter_name, cycle_detector=[]) -> Tuple[QueryConstruct, blank_nulls]:
        logger.info('formatting %s using %s', orm_table, formatter_name)
        specify_model = datamodel.get_table(inspect(orm_table).class_.__name__,
                                            strict=True)
        formatterNode = self.getFormatterDef(specify_model, formatter_name)
        if formatterNode is None:
            logger.warn("no dataobjformatter for %s", specify_model)
            return query, literal(_text("<Formatter not defined.>"))
        logger.debug("using dataobjformatter: %s",
                     ElementTree.tostring(formatterNode))


        cycle_with_self = [*cycle_detector, (inspect(orm_table).class_.__name__, 'formatting')] if (
                cycle_detector is not None) else None

        def make_case(query: QueryConstruct, caseNode: Element) -> Tuple[
            QueryConstruct, Optional[str], blank_nulls]:
            field_exprs = []
            for node in caseNode.findall('field'):
                query, expr, _ = self.make_expr(query, node.text, node.attrib, orm_table, specify_model, cycle_with_self)
                field_exprs.append(expr)
            if field_exprs:
                if len(field_exprs) > 1:
                    expr = concat(*field_exprs)
                else:    
                    expr = field_exprs[0]
            else:
                expr = None
            return query, caseNode.attrib.get('value', None), expr

        switchNode = formatterNode.find('switch')
        single = switchNode.attrib.get('single', 'true') == 'true'
        cases = []
        for caseNode in switchNode.findall('fields'):
            query, value, expr = make_case(query, caseNode)
            cases.append((value, expr))

        if not cases:
            logger.warn(
                "dataobjformatter for %s contains switch clause no fields",
                specify_model)
            return query, literal(_text("<Formatter not defined.>"))

        if single:
            value, expr = cases[0]
        else:
            query, formatted, switch_field_spec = self.make_expr(query, switchNode.attrib['field'], {}, orm_table, specify_model)
            def case_value_convert(value): return value == 'true' if switch_field_spec.get_field().type == 'java.lang.Boolean' else value
            cases = [(case_value_convert(value), expr) for (value, expr) in cases]
            expr = case(cases, formatted)
        return query, blank_nulls(expr)

    def aggregate(self, query: QueryConstruct,
                  field: Union[Field, Relationship], rel_table: SQLTable,
                  aggregator_formatter_name,
                  cycle_detector=[]) -> Label:

        logger.info('aggregating field %s on %s using %s', field, rel_table,
                    aggregator_formatter_name)
        specify_model = datamodel.get_table(field.relatedModelName, strict=True)
        aggregatorNode = self.getAggregatorDef(specify_model, aggregator_formatter_name)
        cycle_with_self = [*cycle_detector, (field.relatedModelName, 'aggregating')] if (
                cycle_detector is not None) else None
        if aggregatorNode is None:
            logger.warning("aggregator is not defined")
            return literal(_text("<Aggregator not defined.>"))
        logger.debug("using aggregator: %s",
                     ElementTree.tostring(aggregatorNode))
        formatter_name = aggregator_formatter_name
        if not self.hasFormatterDef(specify_model, aggregator_formatter_name):
            formatter_name = aggregatorNode.attrib.get('format', None)
        separator = aggregatorNode.attrib.get('separator', '; ')
        order_by = aggregatorNode.attrib.get('orderfieldname', '')
        limit = aggregatorNode.attrib.get('count', '')
        limit = None if limit == '' or int(limit) == 0 else limit
        orm_table = getattr(models, field.relatedModelName)


        join_column = list(inspect(
            getattr(orm_table, field.otherSideName)).property.local_columns)[0]
        subquery = QueryConstruct(
            collection=query.collection,
            objectformatter=self,
            query=orm.Query([]).select_from(orm_table) \
                .filter(join_column == getattr(rel_table, rel_table._id)) \
                .correlate(rel_table)
        )

        subquery, formatted = self.objformat(subquery, orm_table,
                                             formatter_name, cycle_with_self)

        if order_by != '':
            subquery, order_by_expr, _ = self.make_expr(subquery, order_by, {}, orm_table, specify_model, do_blank_null=False)
            order_by_expr = [order_by_expr]
        else:
            order_by_expr = []

        aggregated = blank_nulls(group_concat(formatted, separator, *order_by_expr))


        aggregator_label = f"aggregator_{self.aggregator_count}"
        self.aggregator_count += 1
        return subquery.query.add_column(aggregated).limit(limit).label(aggregator_label)

    def fieldformat(self, query_field: QueryField,
                    field: blank_nulls) -> blank_nulls:
        field_spec = query_field.fieldspec
        if field_spec.get_field() is not None:
            if field_spec.is_temporal() and field_spec.date_part == "Full Date":
                field = self._dateformat(field_spec.get_field(), field)

            elif field_spec.is_relationship():
                pass

            else:
                field = self._fieldformat(field_spec.table, field_spec.get_field(), field, query_field.format_name)
        return blank_nulls(field) if self.replace_nulls else field

    def _dateformat(self, specify_field, field):
        if specify_field.type == "java.sql.Timestamp":
            return func.date_format(field, self.date_format)

        prec_fld = getattr(field.class_, specify_field.name + 'Precision', None)

        format_expr = \
            case({2: self.date_format_month, 3: self.date_format_year},
                 prec_fld, else_=self.date_format) \
                if prec_fld is not None \
                else self.date_format

        return func.date_format(field, format_expr)

    def _fieldformat(self, table: Table, specify_field: Field,
                     field: Union[InstrumentedAttribute, Extract],
                     format_name: Optional[str] = None):
        
        if self.format_agent_type and specify_field is Agent_model.get_field("agenttype"):
            cases = [(field == _id, name) for (_id, name) in enumerate(agent_types)]
            _case = case(cases)
            return blank_nulls(_case) if self.replace_nulls else _case
        
        if self.format_picklist:
            schema_items = Splocalecontaineritem.objects.filter(
                container__discipline=self.collection.discipline,
                container__schematype=0,
                container__name=table.table.lower(),
                name=specify_field.name.lower(),
            )

            if len(schema_items) > 0 and schema_items[0].picklistname:
                picklist = Picklist.objects.filter(name=schema_items[0].picklistname).first()
                cases = [(field == item.value, item.title) for item in picklist.picklistitems.all()]
                _case = case(cases)
            
                return blank_nulls(_case) if self.replace_nulls else _case
        
        if specify_field.type == "java.lang.Boolean":
            return field != 0

        if specify_field.type in ("java.lang.Integer", "java.lang.Short"):
            return field

        if specify_field is CollectionObject_model.get_field('catalogNumber') \
                and self.catalog_number_is_numeric(format_name):
            return cast(field,
                        types.Numeric(65))  # 65 is the mysql max precision

        if specify_field.type == 'json' and isinstance(field.comparator.type, types.JSON):
            return cast(field, types.Text)

        return field


def get_date_format() -> str:
    match = re.search(r'ui\.formatting\.scrdateformat=(.+)', get_remote_prefs())
    date_format = match.group(1).strip() if match is not None else 'yyyy-MM-dd'
    mysql_date_format = LDLM_TO_MYSQL.get(date_format, "%Y-%m-%d")
    logger.debug("dateformat = %s = %s", date_format, mysql_date_format)
    return mysql_date_format


MYSQL_TO_YEAR = {
    "%m %d %y": "%y",
    "%m %d %Y": "%Y",
    "%m-%d-%y": "%y",
    "%m-%d-%Y": "%Y",
    "%m.%d.%y": "%y",
    "%m.%d.%Y": "%Y",
    "%m/%d/%y": "%y",
    "%m/%d/%Y": "%Y",
    "%d %m %y": "%y",
    "%d %m %Y": "%Y",
    "%d %b %Y": "%Y",
    "%d-%m-%y": "%y",
    "%d-%m-%Y": "%Y",
    "%d-%b-%Y": "%Y",
    "%d.%m.%y": "%y",
    "%d.%m.%Y": "%Y",
    "%d.%b.%Y": "%Y",
    "%d/%m/%y": "%y",
    "%d/%m/%Y": "%Y",
    "%d/%b/%Y": "%Y",
    "%Y %m %d": "%Y",
    "%Y-%m-%d": "%Y",
    "%Y.%m.%d": "%Y",
    "%Y/%m/%d": "%Y",
}

MYSQL_TO_MONTH = {
    "%m %d %y": "%m %y",
    "%m %d %Y": "%m %Y",
    "%m-%d-%y": "%m-%y",
    "%m-%d-%Y": "%m-%Y",
    "%m.%d.%y": "%m.%y",
    "%m.%d.%Y": "%m.%Y",
    "%m/%d/%y": "%m/%y",
    "%m/%d/%Y": "%m/%Y",
    "%d %m %y": "%m %y",
    "%d %m %Y": "%m %Y",
    "%d %b %Y": "%b %Y",
    "%d-%m-%y": "%m-%y",
    "%d-%m-%Y": "%m-%Y",
    "%d-%b-%Y": "%b-%Y",
    "%d.%m.%y": "%m.%y",
    "%d.%m.%Y": "%m.%Y",
    "%d.%b.%Y": "%b.%Y",
    "%d/%m/%y": "%m/%y",
    "%d/%m/%Y": "%m/%Y",
    "%d/%b/%Y": "%b/%Y",
    "%Y %m %d": "%Y %m",
    "%Y-%m-%d": "%Y-%m",
    "%Y.%m.%d": "%Y.%m",
    "%Y/%m/%d": "%Y/%m",
}

LDLM_TO_MYSQL = {
    "MM dd yy": "%m %d %y",
    "MM dd yyyy": "%m %d %Y",
    "MM-dd-yy": "%m-%d-%y",
    "MM-dd-yyyy": "%m-%d-%Y",
    "MM.dd.yy": "%m.%d.%y",
    "MM.dd.yyyy": "%m.%d.%Y",
    "MM/dd/yy": "%m/%d/%y",
    "MM/dd/yyyy": "%m/%d/%Y",
    "dd MM yy": "%d %m %y",
    "dd MM yyyy": "%d %m %Y",
    "dd MMM yyyy": "%d %b %Y",
    "dd-MM-yy": "%d-%m-%y",
    "dd-MM-yyyy": "%d-%m-%Y",
    "dd-MMM-yyyy": "%d-%b-%Y",
    "dd.MM.yy": "%d.%m.%y",
    "dd.MM.yyyy": "%d.%m.%Y",
    "dd.MMM.yyyy": "%d.%b.%Y",
    "dd/MM/yy": "%d/%m/%y",
    "dd/MM/yyyy": "%d/%m/%Y",
    "dd/MMM/yyy": "%d/%b/%Y",
    "yyyy MM dd": "%Y %m %d",
    "yyyy-MM-dd": "%Y-%m-%d",
    "yyyy.MM.dd": "%Y.%m.%d",
    "yyyy/MM/dd": "%Y/%m/%d",
}