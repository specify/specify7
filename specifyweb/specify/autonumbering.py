"""
Autonumbering logic
"""


import logging
from typing import List, Tuple, Sequence

logger = logging.getLogger(__name__)

from .lock_tables import lock_tables
from .uiformatters import UIFormatter, get_uiformatters, AutonumberOverflowException

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

    with lock_tables(obj._meta.db_table):
        for apply_autonumbering_to in thunks:
            apply_autonumbering_to(obj)

        obj.save()
