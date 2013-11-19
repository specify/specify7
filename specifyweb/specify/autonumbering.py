import logging
logger = logging.getLogger(__name__)

from django.db import connection, transaction

from .models import Splocalecontaineritem as Item
from .uiformatters import get_uiformatter, AutonumberOverflowException

def autonumber_and_save(collection, user, obj):
    filters = dict(container__discipline=collection.discipline,
                   container__name=obj.__class__.__name__.lower(),
                   format__isnull=False)

    uiformatters = [get_uiformatter(collection, user, f)
                    for f in Item.objects.filter(**filters).values_list('format', flat=True)]

    autonumber_fields = []
    for formatter in uiformatters:
        value = getattr(obj, formatter.field_name.lower())
        if value is None: continue
        vals = formatter.parse(value)
        if formatter.needs_autonumber(vals):
            autonumber_fields.append((formatter, vals))

    if len(autonumber_fields) > 0:
        do_autonumbering(collection, obj, autonumber_fields)
    else:
        logger.debug("no fields to autonumber for %s", obj)
        obj.save()

def do_autonumbering(collection, obj, fields):
    logger.debug("autonumbering %s fields: %s", obj, fields)

    for formatter, vals in fields:
        # Set all the fields to be autonumbered to NULL to
        # avoid saving the placeholder value into db.
        setattr(obj, formatter.field_name.lower(), None)
    # Have to save the object before autonumbering b/c
    # autonumber acquires a write lock on the model,
    # but save touches other tables.
    obj.save()

    table = obj._meta.db_table
    cursor = connection.cursor()

    try:
        if cursor.db.vendor == 'mysql':
            cursor.execute('lock tables %s write' % table)
        else:
            logger.warning("unable to lock tables for autonumbering.")

        for formatter, vals in fields:
            value = formatter.autonumber(collection, obj.__class__, vals)
            setattr(obj, formatter.field_name.lower(), value)
        obj.save()
    finally:
        if cursor.db.vendor == 'mysql':
            cursor.execute('unlock tables')



