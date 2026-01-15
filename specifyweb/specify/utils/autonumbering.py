"""
Autonumbering logic
"""


from .uiformatters import UIFormatter, get_uiformatters
from ..models_utils.lock_tables import mysql_named_lock, autonumbering_lock_table
import logging
from typing import List, Tuple, Set
from collections.abc import Sequence
from django.db import transaction
from django.apps import apps

from specifyweb.specify.utils.scoping import Scoping
from specifyweb.specify.datamodel import datamodel
from specifyweb.backend.businessrules.models import UniquenessRule, UniquenessRuleField

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
        if hasattr(obj, "_requires_collection_user"):
            obj.save(collection=collection, user=user)
        else:
            obj.save()


def do_autonumbering_old(collection, obj, fields: list[tuple[UIFormatter, Sequence[str]]]) -> None:
    # THis is the old implementation of autonumbering involving lock mysql table explicitly.
    # Fall back to using this implementation if race-conditions are found.
    logger.debug("autonumbering %s fields: %s", obj, fields)

    # The autonumber action is prepared and thunked outside the locked table
    # context since it looks at other tables and that is not allowed by mysql
    # if those tables are not also locked.
    thunks = [
        formatter.prepare_autonumber_thunk(collection, obj.__class__, vals)
        for formatter, vals in fields
    ]

    # Serialize the autonumbering critical section without table locks.
    db_name = transaction.get_connection().alias
    table_name = obj._meta.db_table
    with autonumbering_lock_table(db_name, table_name):
        for apply_autonumbering_to in thunks:
            apply_autonumbering_to(obj)
        obj.save()

def do_autonumbering(collection, obj, fields: list[tuple[UIFormatter, Sequence[str]]]) -> None:
    logger.debug("autonumbering %s fields: %s", obj, fields)

    # Prepare the thunks/queries (ok to prep outside transaction)
    prepared = []
    for formatter, vals in fields:
        with_year = formatter.fillin_year(vals, None)
        fieldname = formatter.field_name.lower()
        prepared.append((formatter, fieldname, with_year))

    db_name = transaction.get_connection().alias
    table_name = obj._meta.db_table
    with autonumbering_lock_table(db_name, table_name):
        with transaction.atomic():
            for formatter, fieldname, with_year in prepared:
                # Build the exact queryset that limits by regex and scope
                # Use django's select_for_update() to lock the current max row itself
                qs_max = formatter._autonumber_queryset(collection, obj.__class__, fieldname, with_year)
                biggest_obj = (qs_max
                            # .select_for_update(nowait=True)
                            .order_by('-' + fieldname)
                            .first())

                if biggest_obj is None:
                    filled_vals = formatter.fill_vals_no_prior(with_year)
                    setattr(obj, fieldname, ''.join(filled_vals))
                    continue

                # Lock the range of all rows in-scope with field >= biggest_value
                biggest_value = getattr(biggest_obj, fieldname)
                formatter.lock_ge_range(
                    collection=collection,
                    model=obj.__class__,
                    fieldname=fieldname,
                    with_year=with_year,
                    biggest_value=biggest_value,
                )

                # Get next value off the locked biggest and assign
                filled_vals = formatter.fill_vals_after(biggest_value)
                setattr(obj, fieldname, ''.join(filled_vals))

            # Save once after all fields are assigned
            obj.save()

def verify_autonumbering(collection, obj, fields):
    pass

def get_tables_to_lock(collection, obj, field_names) -> set[str]:
    # TODO: Include the fix for https://github.com/specify/specify7/issues/4148
    from specifyweb.backend.businessrules.models import UniquenessRule

    obj_table = obj._meta.db_table
    scope_table = Scoping(obj).get_scope_model()

    tables = {obj._meta.db_table, 'django_migrations', UniquenessRule._meta.db_table, 'discipline',
              scope_table._meta.db_table}

    # Special case: if the table is 'component', also lock 'collectionobject'
    if obj_table == 'component':
        tables.add('collectionobject')

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
