"""
Autonumbering logic
"""


from .uiformatters import UIFormatter, get_uiformatters
from .lock_tables import lock_tables
import logging
from typing import List, Tuple, Sequence, Set

from specifyweb.specify.scoping import Scoping
from specifyweb.specify.datamodel import datamodel
from specifyweb.specify.tree_extras import is_treetable

logger = logging.getLogger(__name__)


def autonumber_and_save(collection, user, obj) -> None:
    uiformatters = get_uiformatters(collection, user, obj.__class__.__name__)

    autonumber_fields = [(formatter, vals)
                         for formatter in uiformatters
                         for value in [getattr(obj, formatter.field_name.lower())]
                         if value is not None
                         for vals in [formatter.parse(value)]
                         if formatter.needs_autonumber(vals)]

    if len(autonumber_fields) > 0:
        do_autonumbering(collection, obj, autonumber_fields)
    else:
        logger.debug("no fields to autonumber for %s", obj)
        obj.save()


def do_autonumbering(collection, obj, fields: List[Tuple[UIFormatter, Sequence[str]]]) -> None:
    logger.debug("autonumbering %s fields: %s", obj, fields)

    # The autonumber action is prepared and thunked outside the locked table
    # context since it looks at other tables and that is not allowed by mysql
    # if those tables are not also locked.
    thunks = [
        formatter.prepare_autonumber_thunk(collection, obj.__class__, vals)
        for formatter, vals in fields
    ]

    writing_to =  set([obj._meta.db_table])
    reading_from = get_tables_to_read_lock(collection, obj, [formatter.field_name for formatter, _ in fields])
    with lock_tables(read_tables=reading_from, write_tables=writing_to):
        for apply_autonumbering_to in thunks:
            apply_autonumbering_to(obj)

        obj.save()


def get_tables_to_read_lock(collection, obj, field_names: List[str]) -> Set[str]:
    obj_table = obj._meta.db_table
    scope_table = Scoping(obj).get_scope_model()

    tables = set([scope_table._meta.db_table, *get_uniqueness_rule_tables(collection, obj_table, field_names)])

    if is_treetable(obj): 
        tables.update(get_tree_tables_to_lock())

    return tables

def get_uniqueness_rule_tables(collection, obj_table: str, field_names: List[str]) -> Set[str]: 
    from specifyweb.businessrules.models import UniquenessRule, UniquenessRuleField
    tables = set(['django_migrations', UniquenessRule._meta.db_table, UniquenessRuleField._meta.db_table, 'discipline'])

    rules = UniquenessRule.objects.filter(
        modelName=obj_table, discipline=collection.discipline)

    for rule in rules:
        fields = rule.fields.filter(fieldPath__in=field_names)
        if len(fields) > 0:
            rule_scopes = rule.fields.filter(isScope=True)
            for scope in rule_scopes:
                tables.update(get_tables_from_field_path(
                    obj_table, scope.fieldPath))

    return tables
                
def get_tables_from_field_path(model: str, field_path: str) -> List[str]:
    tables = []
    table = datamodel.get_table_strict(model)
    relationships = field_path.split('__')

    for relationship in relationships:
        other_model = table.get_relationship(
            relationship).relatedModelName.lower()
        tables.append(other_model)
        table = datamodel.get_table_strict(other_model)

    return tables

def get_tree_tables_to_lock(tree_table: str) -> Set[str]: 
    return set(['discipline', f'{tree_table}def', f'{tree_table}defitem'])