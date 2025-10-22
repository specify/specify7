"""
Autonumbering logic
"""


from .uiformatters import UIFormatter, get_uiformatters
from ..models_utils.lock_tables import lock_tables
import logging
from typing import List, Tuple, Set
from collections.abc import Sequence
from django.db import transaction

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


def do_autonumbering(collection, obj, fields: list[tuple[UIFormatter, Sequence[str]]]) -> None:
    logger.debug("autonumbering %s fields: %s", obj, fields)

    with transaction.atomic():
        for fmt, vals in fields:
            fieldname = fmt.field_name.lower()
            with_year = fmt.fillin_year(vals, None)

            # Build the queryset used to find the current max
            qs = fmt._autonumber_queryset(collection, obj.__class__, fieldname, with_year)

            # Apply row locks
            biggest = (qs.select_for_update()
                         .order_by('-' + fieldname)
                         .first())

            if biggest is None:
                filled_vals = fmt.fill_vals_no_prior(with_year)
            else:
                filled_vals = fmt.fill_vals_after(getattr(biggest, fieldname))

            setattr(obj, fieldname, ''.join(filled_vals))

        obj.save()


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
