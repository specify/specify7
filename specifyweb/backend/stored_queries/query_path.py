from collections import deque

from specifyweb.specify.datamodel import datamodel


def tables_in_path(table, join_path):
    path = deque(join_path)
    tables = [table]
    while len(path) > 0:
        field = path.popleft()
        if isinstance(field, str):
            field = tables[-1].get_field(field, strict=True)
        if not field.is_relationship:  # also handles tree ranks
            break

        tables.append(datamodel.get_table(field.relatedModelName, strict=True))
    return tables
