import logging
logger = logging.getLogger(__name__)

from .lock_tables import lock_tables
from .models import Splocalecontaineritem as Item
from .uiformatters import get_uiformatter, AutonumberOverflowException

def autonumber_and_save(collection, user, obj):
    filters = dict(container__discipline=collection.discipline,
                   container__name=obj.__class__.__name__.lower(),
                   format__isnull=False)

    formatter_names = Item.objects.filter(**filters).values_list('format', flat=True)
    logger.debug("formatters for %s: %s", obj, formatter_names)

    uiformatters = [get_uiformatter(collection, user, f) for f in formatter_names]
    logger.debug("uiformatters for %s: %s", obj, uiformatters)

    autonumber_fields = [(formatter, vals)
                         for formatter in uiformatters
                         if formatter is not None
                         for value in [getattr(obj, formatter.field_name.lower())]
                         if value is not None
                         for vals in [formatter.parse(value)]
                         if formatter.needs_autonumber(vals)]

    if len(autonumber_fields) > 0:
        do_autonumbering(collection, obj, autonumber_fields)
    else:
        logger.debug("no fields to autonumber for %s", obj)
        obj.save()

def do_autonumbering(collection, obj, fields):
    logger.debug("autonumbering %s fields: %s", obj, fields)

    # The autonumber action is prepared and thunked outside the locked table
    # context since it looks at other tables and that is not allowed by mysql
    # if those tables are not also locked.
    thunks = [
        formatter.prepare_autonumber_thunk(collection, obj.__class__, vals)
        for formatter, vals in fields
    ]

    with lock_tables(obj._meta.db_table):
        for apply_autonumbering_to in thunks:
            apply_autonumbering_to(obj)

        obj.save()
