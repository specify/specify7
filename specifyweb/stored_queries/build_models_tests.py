from sqlalchemy import inspect
from sqlalchemy import orm
from . import models
from django.http import HttpResponse
from specifyweb.specify.models import datamodel
import logging
logger = logging.getLogger(__name__)
import json
table_ = 'Agent'
def test_sqlalchemy_model(res):
    taxon_sql_alchemy_model = inspect(getattr(models, table_))
    taxon_datamodel = datamodel.get_table(table_.lower())

    datamodel_fields_and_relationships = taxon_datamodel.all_fields
    not_found = []
    incorrect_direction = []
    incorrect_table = []
    for ff in datamodel_fields_and_relationships:
        in_sql = getattr(orm.aliased(getattr(models, table_)), ff.name, None)
        if in_sql is None:
            not_found.append(ff.name)
        else:
            if ff.is_relationship:
                in_sql_inspect = [f for f in list(taxon_sql_alchemy_model.relationships) if str(f).split('.')[-1] == ff.name][0]

                if (in_sql_inspect.direction.name.lower() != ff.type.replace('-','').lower()):
                    incorrect_direction.append(f'Expected {ff.type.replace("-","").lower()}. Got {in_sql_inspect.direction.name.lower()} for {ff.name}')
                remote_sql_side = in_sql_inspect.remote_side
                remote_sql_table, remote_sql_column = str(list(remote_sql_side)[0]).split('.')
                if (remote_sql_table.lower() != ff.relatedModelName.lower()):
                    incorrect_table.append(f'{ff.name} is expected to end in {ff.relatedModelName} but ends in {remote_sql_table}')
                logger.warning(in_sql.expression)
                self_column = getattr(ff, 'column', None)
                #logger.warning(list(models.tables['taxon'].c)[-3].foreign_keys)
                self_table = None
                '''
                if self_column is None:
                    self_table, self_column = get_remote_table_column(ff.relatedModelName, ff.otherSideName)
                if (self_table.lower() != table_.lower()) and (self_table is not None):
                    raise Exception("A bad bad error")
                '''




    dict_ = {'not_found': not_found, 'incorrect_direction': incorrect_direction, 'all sql fields': [str(x) for x in list(taxon_sql_alchemy_model.attrs)]}
    return HttpResponse(json.dumps(dict_), content_type='text/plain')

def get_remote_table_column(table_name, rr_name):
    in_sql_inspect = [f for f in list(inspect(getattr(models, table_name)).relationships) if
                      str(f).split('.')[-1] == rr_name][0]
    remote_sql_side = in_sql_inspect.remote_side
    remote_sql_table, remote_sql_column = str(list(remote_sql_side)[0]).split(
        '.')
    return remote_sql_table, remote_sql_column




