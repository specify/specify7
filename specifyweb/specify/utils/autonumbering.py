"""
Autonumbering logic
"""

from contextlib import contextmanager

from .uiformatters import UIFormatter, get_uiformatters
from ..models_utils.lock_tables import named_lock
import logging
from typing import Generator, Literal, Any
from collections.abc import Sequence

from specifyweb.specify.utils.scoping import Scoping
from specifyweb.specify.datamodel import datamodel

logger = logging.getLogger(__name__)


def autonumber_and_save(collection, user, obj) -> None:
    uiformatters = get_uiformatters(collection, obj, user)

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


@contextmanager
def autonumbering_lock(table_name: str, timeout: int = 10) -> Generator[Literal[True] | None, Any, None]:
    """
    A convienent wrapper for the named_lock generator that adds the 'autonumber'
    prefix to the table_name string argument for the resulting lock name.

    Raises a TimeoutError if timeout seconds have elapsed without acquiring the
    lock, and a ConnectionError if the database was otherwise unable to acquire
    the lock.

    Example:
    ```
    try:
        with autonumbering_lock('Collectionobject') as lock:
        ... # do something
    except TimeoutError:
        ... # handle case when lock is held by other connection for > timeout
    ```
    
    :param table_name: The name of the table that is being autonumbered
    :type table_name: str
    :param timeout: The time in seconds to wait for lock release if another 
    connection holds the lock
    :type timeout: int
    :return: yields True if the lock was obtained successfully and None 
    otherwise
    :rtype: Generator[Literal[True] | None, Any, None]
    """
    lock_name = f"autonumber_{table_name.lower()}"
    with named_lock(lock_name, timeout) as lock:
        yield lock


def do_autonumbering(collection, obj, fields: list[tuple[UIFormatter, Sequence[str]]]) -> None:
    logger.debug("autonumbering %s fields: %s", obj, fields)

    # The autonumber action is prepared and thunked outside the locked table
    # context since it looks at other tables and that is not allowed by mysql
    # if those tables are not also locked.
    thunks = [
        formatter.prepare_autonumber_thunk(collection, obj.__class__, vals)
        for formatter, vals in fields
    ]

    with autonumbering_lock(obj._meta.db_table):
        for apply_autonumbering_to in thunks:
            apply_autonumbering_to(obj)

        obj.save()


# REFACTOR: Remove this funtion as it is no longer used
def get_tables_to_lock(collection, obj, field_names) -> set[str]:
    # TODO: Include the fix for https://github.com/specify/specify7/issues/4148
    from specifyweb.backend.businessrules.models import UniquenessRule

    obj_table = obj._meta.db_table
    scope_table = Scoping(obj).get_scope_model()

    tables = {obj._meta.db_table, 'django_migrations', UniquenessRule._meta.db_table, 'discipline',
              scope_table._meta.db_table}

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


def get_tables_from_field_path(model: str, field_path: str) -> list[str]:
    tables = []
    table = datamodel.get_table_strict(model)
    relationships = field_path.split('__')

    for relationship in relationships:
        other_model = table.get_relationship(
            relationship).relatedModelName.lower()
        tables.append(other_model)
        table = datamodel.get_table_strict(other_model)

    return tables
