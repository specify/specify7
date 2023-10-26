from sqlalchemy import inspect
from sqlalchemy import orm
from . import models
from django.http import HttpResponse
from specifyweb.specify.models import datamodel
import logging
logger = logging.getLogger(__name__)
import json


def test_sqlalchemy_model(res):
    resp = []
    for table in datamodel.tables:
        table_ = table.name
        orm_table = getattr(models, table_)
        datamodel_table = datamodel.get_table(table_.lower())
        known_fields = datamodel_table.all_fields

        not_found = []

        incorrect_direction = {}
        incorrect_columns = {}
        incorrect_table = {}

        for field in known_fields:

            in_sql = getattr(orm_table, field.name, None) or getattr(orm_table, field.name.lower(), None)

            if in_sql is None:
                not_found.append(field.name)
                continue

            if not field.is_relationship:
                continue

            sa_relationship = inspect(in_sql).property

            sa_direction = sa_relationship.direction.name.lower()
            datamodel_direction = field.type.replace('-', '').lower()

            if sa_direction != datamodel_direction:
                incorrect_direction[field.name] = (sa_direction, datamodel_direction)

            remote_sql_table = sa_relationship.target.name.lower()
            remote_datamodel_table = field.relatedModelName.lower()

            if remote_sql_table.lower() != remote_datamodel_table:
                incorrect_table[field.name] = (remote_sql_table, remote_datamodel_table)

            sa_column = list(sa_relationship.local_columns)[0].name
            if sa_column.lower() != (datamodel_table.idColumn.lower() if getattr(field, 'column', None) is None else field.column.lower()):
                incorrect_columns[field.name] = (sa_column, datamodel_table.idColumn.lower(), field.column)


        if incorrect_direction or incorrect_table or incorrect_columns or not_found:
            invalid_dict = {'direction': incorrect_direction, 'table': incorrect_table, 'columns': incorrect_columns, 'not_found': not_found}
            resp.append(str((table_, invalid_dict)))

    return HttpResponse(json.dumps('\n'.join(resp)), content_type='text/plain')





