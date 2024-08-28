"""
Base class for related search
"""

import logging

from ..specify.models import datamodel
from ..stored_queries.execution import BuildQueryProps, build_query
from ..stored_queries.query_ops import QueryOps
from ..stored_queries.queryfield import QueryField
from ..stored_queries.queryfieldspec import QueryFieldSpec

logger = logging.getLogger(__name__)


class F(str):
    pass


class RelatedSearchMeta(type):
    def __new__(cls, name, bases, dict):
        Rs = super(RelatedSearchMeta, cls).__new__(cls, name, bases, dict)
        if Rs.definitions is None:
            return Rs

        root_table_name = Rs.definitions[0].split(".")[0]

        Rs.root = datamodel.get_table(root_table_name, strict=True)

        def col_to_fs(col, add_id=False):
            return QueryFieldSpec.from_path([root_table_name] + col.split("."), add_id)

        Rs.display_fields = [
            QueryField(
                fieldspec=col_to_fs(col),
                op_num=1,
                value="",
                negate=False,
                display=True,
                format_name=None,
                sort_type=0,
            )
            for col in Rs.columns
        ]

        if Rs.link:
            Rs.display_fields.append(
                QueryField(
                    fieldspec=col_to_fs(Rs.link, add_id=True),
                    op_num=1,
                    value="",
                    negate=False,
                    display=True,
                    format_name=None,
                    sort_type=0,
                )
            )

        def make_filter(f, negate):
            field, op, val = f
            return QueryField(
                fieldspec=col_to_fs(field),
                op_num=QueryOps.OPERATIONS.index(op.__name__),
                value=col_to_fs(val) if isinstance(val, F) else val,
                negate=negate,
                display=False,
                format_name=None,
                sort_type=0,
            )

        Rs.filter_fields = [make_filter(f, False) for f in Rs.filters] + [
            make_filter(f, True) for f in Rs.excludes
        ]

        return Rs


class RelatedSearch(object, metaclass=RelatedSearchMeta):
    distinct = False
    filters = []
    excludes = []
    definitions = None
    link = None
    columns = []

    @classmethod
    def execute(cls, session, config, terms, collection, user, limit, offset):
        queries = [
            _f
            for _f in (
                cls(defn).build_related_query(session, config, terms, collection, user)
                for defn in cls.definitions
            )
            if _f
        ]

        if len(queries) > 0:
            query = queries[0].union(*queries[1:])
            count = query.count()
            results = list(query.limit(limit).offset(offset))
        else:
            count = 0
            results = []

        return {
            "totalCount": count,
            "results": results,
            "definition": {
                "name": cls.__name__,
                "root": cls.root.name,
                "link": cls.link,
                "columns": cls.columns,
                "fieldSpecs": [
                    {
                        "stringId": fs.to_stringid(),
                        "isRelationship": fs.is_relationship(),
                    }
                    for field in cls.display_fields
                    for fs in [field.fieldspec]
                ],
            },
        }

    def __init__(self, definition):
        self.definition = definition

    def build_related_query(self, session, config, terms, collection, user):
        logger.info(
            "%s: building related query using definition: %s",
            self.__class__.__name__,
            self.definition,
        )

        from .views import build_primary_query

        primary_fieldspec = QueryFieldSpec.from_path(
            self.definition.split("."), add_id=True
        )

        pivot = primary_fieldspec.table

        logger.debug("pivoting on: %s", pivot)
        for searchtable in config.findall("tables/searchtable"):
            if searchtable.find("tableName").text == pivot.name:
                break
        else:
            return None

        logger.debug("using %s for primary search", searchtable.find("tableName").text)
        primary_query = build_primary_query(
            session, searchtable, terms, collection, user, as_scalar=True
        )

        if primary_query is None:
            return None
        logger.debug("primary query: %s", primary_query)

        primary_field = QueryField(
            fieldspec=primary_fieldspec,
            op_num=QueryOps.OPERATIONS.index("op_in"),
            value=primary_query,
            negate=False,
            display=False,
            format_name=None,
            sort_type=0,
        )

        logger.debug("primary queryfield: %s", primary_field)
        logger.debug("display queryfields: %s", self.display_fields)
        logger.debug("filter queryfields: %s", self.filter_fields)

        queryfields = self.display_fields + self.filter_fields + [primary_field]

        related_query, _ = build_query(
            session,
            collection,
            user,
            self.root.tableId,
            queryfields,
            props=BuildQueryProps(implicit_or=True),
        )

        if self.distinct:
            related_query = related_query.distinct()

        logger.debug("related query: %s", related_query)
        return related_query
