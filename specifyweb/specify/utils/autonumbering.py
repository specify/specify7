"""
Autonumbering logic
"""

from collections import defaultdict

from django.db.models import Value, Case, When

from .uiformatters import UIFormatter, get_uiformatters
from ..models_utils.lock_tables import LockDispatcher
import logging
from typing import MutableMapping, Callable
from collections.abc import Sequence

from specifyweb.specify.utils.scoping import Scoping
from specifyweb.specify.datamodel import datamodel
from specifyweb.backend.redis_cache.connect import RedisConnection, RedisString

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


class AutonumberingLockDispatcher(LockDispatcher):
    def __init__(self):
        lock_prefix = "autonumbering"
        super().__init__(lock_prefix=lock_prefix, case_sensitive_names=False)

        # We use Redis for IPC, to maintain the current "highest" autonumbering
        # value for each table + field
        self.redis = RedisConnection(decode_responses=True)
        # Before the records are created within a transaction, they're stored
        # locally within this dictonary
        # The whole dictonary can be committed to Redis via commit_highest
        # The key hierarchy is generally:
        # table -> field -> scope -> scope_id = "highest value"
        self.highest_in_flight: MutableMapping[str, MutableMapping[str, MutableMapping[str, MutableMapping[int, str]]]] = defaultdict(
            lambda: defaultdict(lambda: defaultdict(lambda: defaultdict(str))))

    def __exit__(self, exc_type, exc_val, exc_tb):
        super().__exit__(exc_type, exc_val, exc_tb)

    def highest_stored_value(self,
                             table_name: str,
                             field_name: str,
                             scope_name: str,
                             scope_id: int) -> str | None:
        key_name = self.autonumbering_redis_key(
            table_name, field_name, scope_name, scope_id)
        highest = RedisString(self.redis).get(key_name)
        if isinstance(highest, bytes):
            return highest.decode()
        elif highest is None:
            return None
        return str(highest)

    def cache_highest(self,
                      table_name: str,
                      field_name: str,
                      scope_name: str,
                      scope_id: int,
                      value: str):
        self.highest_in_flight[table_name.lower(
        )][field_name.lower()][scope_name][scope_id] = value

    def commit_highest(self):
        for table_name, tables in self.highest_in_flight.items():
            for field_name, fields in tables.items():
                for scope_type, scope_ids in fields.items():
                    for scope_id, value in scope_ids.items():
                        self.set_highest_value(
                            table_name, field_name, scope_type, scope_id, value)
        self.highest_in_flight.clear()

    def set_highest_value(self,
                          table_name: str,
                          field_name: str,
                          scope_name: str,
                          scope_id: int,
                          value: str,
                          time_to_live: int = 5):
        key_name = self.autonumbering_redis_key(
            table_name, field_name, scope_name, scope_id)
        RedisString(self.redis).set(key_name, value,
                                    time_to_live, override_existing=True)

    def autonumbering_redis_key(self,
                                table_name: str,
                                field_name: str,
                                scope_name: str,
                                scope_id: int):
        return self.lock_name(table_name,
                              field_name,
                              "highest",
                              scope_name,
                              str(scope_id))


def highest_autonumbering_value(
        collection,
        model,
        formatter: UIFormatter,
        values: Sequence[str],
        get_lock_dispatcher: Callable[[],
                                      AutonumberingLockDispatcher] | None = None,
        wait_for_lock=10) -> str:
    """
    Retrieves the next highest number in the autonumbering sequence for a given
    autonumbering field format
    """

    if not formatter.needs_autonumber(values):
        raise ValueError(
            f"Formatter {formatter.format_name} does not need need autonumbered with {values}")

    if get_lock_dispatcher is None:
        lock_dispatcher = None
    else:
        lock_dispatcher = get_lock_dispatcher()
        lock_dispatcher.acquire(model._meta.db_table, timeout=wait_for_lock)

    field_name = formatter.field_name.lower()

    scope_type = Scoping.scope_type_from_class(model)
    hierarchy_model = Scoping.get_hierarchy_model(collection, scope_type)

    stored_highest_value = (lock_dispatcher.highest_stored_value(
        model._meta.db_table, field_name, scope_type.name, hierarchy_model.id)
        if lock_dispatcher is not None else None)

    with_year = formatter.fillin_year(values)
    largest_in_database = formatter._autonumber_queryset(collection, model, field_name, with_year).annotate(
        greater_than_stored=Case(
            When(**{field_name + '__gt': stored_highest_value},
                 then=Value(True)),
            default=Value(False))
        if stored_highest_value is not None
        else Value(False))

    if not largest_in_database.exists():
        if stored_highest_value is not None:
            filled_values = formatter.fill_vals_after(stored_highest_value)
        else:
            filled_values = formatter.fill_vals_no_prior(with_year)
    else:
        largest = largest_in_database[0]
        database_larger = largest.greater_than_stored
        value_to_inc = (getattr(largest, field_name)
                        if database_larger or stored_highest_value is None
                        else stored_highest_value)
        filled_values = formatter.fill_vals_after(value_to_inc)

    highest = ''.join(filled_values)

    if lock_dispatcher is not None and lock_dispatcher.in_context:
        lock_dispatcher.cache_highest(
            model._meta.db_table, field_name, scope_type.name, hierarchy_model.id, highest)

    return highest


def do_autonumbering(collection, obj, fields: list[tuple[UIFormatter, Sequence[str]]]) -> None:
    logger.debug("autonumbering %s fields: %s", obj, fields)

    with AutonumberingLockDispatcher() as locks:
        for formatter, vals in fields:
            new_field_value = highest_autonumbering_value(
                collection,
                obj.__class__,
                formatter,
                vals,
                get_lock_dispatcher=lambda: locks)
            setattr(obj, formatter.field_name.lower(), new_field_value)
        obj.save()
        locks.commit_highest()


# REFACTOR: Remove this funtion as it is no longer used
def get_tables_to_lock(collection, obj, field_names) -> set[str]:
    # TODO: Include the fix for https://github.com/specify/specify7/issues/4148
    from specifyweb.backend.businessrules.models import UniquenessRule

    obj_table = obj._meta.db_table
    scope_table = Scoping.model_from_instance(obj)

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
