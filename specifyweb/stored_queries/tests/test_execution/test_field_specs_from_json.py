from specifyweb.specify.load_datamodel import Field, Table
from specifyweb.specify.tests.test_api import ApiTests
import json

from specifyweb.stored_queries.queryfield import fields_from_json
from specifyweb.stored_queries.queryfieldspec import QueryFieldSpec, TreeRankQuery
from specifyweb.specify.datamodel import datamodel

from specifyweb.stored_queries.tests.static.simple_static_fields import (
    static_simple_field_spec,
)


class SimpleStr:

    def __init__(self, str_value):
        self.str_value = str_value

    def __repr__(self):
        # Don't put anything in here in quotes
        return str(self.str_value)


def GET_TABLE(table: Table):
    return SimpleStr(f'datamodel.get_table_strict("{table.name}")')


def GET_FIELD(table: Table, field: Field):
    return SimpleStr(f'{GET_TABLE(table)}.get_field_strict("{field.name}")')


def GET_SQL_TABLE(table: Table):
    return SimpleStr(f'get_sql_table("{table.name}")')


PREAMBLE = """
from specifyweb.stored_queries.queryfieldspec import QueryFieldSpec, TreeRankQuery
from specifyweb.stored_queries.queryfield import QueryField

from specifyweb.specify.datamodel import datamodel
import specifyweb.stored_queries.models as sql_models

def get_sql_table(name):
    return getattr(sql_models, name)

"""


class StrFriendlyQueryFieldSpec(QueryFieldSpec):

    # A wrapper around queryfieldspec to make it more friendly for unit tests.

    def __repr__(self):
        key_values = self._asdict()

        key_values["root_table"] = GET_TABLE(self.root_table)
        key_values["root_sql_table"] = GET_SQL_TABLE(self.root_table)
        key_values["join_path"] = self._easify_join_path()
        key_values["table"] = GET_TABLE(self.table)
        key_values["tree_field"] = (
            GET_FIELD(self.table, self.tree_field) if self.tree_field else None
        )

        # Technically there is nothing wrong with below, and it makes things easier
        # to write tests for.
        return f"QueryFieldSpec(**{repr(key_values)})"

    def _easify_join_path(self):
        join_path_list = list(self.join_path)
        table = self.root_table
        join_path_easy = []
        for node in join_path_list:
            if isinstance(node, TreeRankQuery):
                args_dict = dict(
                    name=node.name,
                    relatedModelName=node.relatedModelName,
                    type=node.type,
                    column=node.column,
                )
                to_add = SimpleStr(f"TreeRankQuery(**{repr(args_dict)})")
            else:
                to_add = GET_FIELD(table, node)

            join_path_easy.append(to_add)
            if len(join_path_easy) != len(join_path_list):
                # If more things to marse
                table = datamodel.get_table(node.relatedModelName)
        assert self.table.name == table.name
        return tuple(join_path_easy)


def generate_fields_test_str(query_fields, var_name):
    # Generates the python file to represent the named tuple.
    query_field_with_friendly_specs = [
        f._replace(fieldspec=StrFriendlyQueryFieldSpec(*f.fieldspec))
        for f in query_fields
    ]

    print(f"{PREAMBLE}\n\n\n{var_name}={repr(query_field_with_friendly_specs)}")


class TestFieldSpecsFromJson(ApiTests):

    def test_static_field_specs(self):
        query = json.load(open("specifyweb/stored_queries/tests/static/co_query.json"))
        query_fields = fields_from_json(query["fields"])

        # generate_fields_test_str(query_fields, "static_simple_field_spec")

        self.assertEqual(static_simple_field_spec, query_fields)
