# Below is taken from batch edit datasets.
# TODO: Refactor those tests and make these part of SqlTreeSetup
from specifyweb.backend.stored_queries.queryfield import QueryField
from specifyweb.backend.stored_queries.queryfieldspec import QueryFieldSpec
from specifyweb.specify.models import datamodel

def make_query_test(field_spec, sort_type=0):
    return QueryField(
        fieldspec=field_spec,
        op_num=8,
        value=None,
        negate=False,
        display=True,
        format_name=None,
        sort_type=sort_type,
    )

def make_query_fields_test(base_table, query_paths):
    added = [(base_table, *path) for path in query_paths]

    query_fields = [
        make_query_test(QueryFieldSpec.from_path(path), 0) for path in added
    ]

    return datamodel.get_table_strict(base_table), query_fields