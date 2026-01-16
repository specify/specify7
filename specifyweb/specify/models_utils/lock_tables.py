import logging

from typing import Set
from contextlib import contextmanager

from django.db import connection, transaction

logger = logging.getLogger(__name__)


@contextmanager
def lock_tables(read_tables: Set[str], write_tables: Set[str]):
    assert not transaction.get_connection().in_atomic_block, "Can not lock tables in a transaction!"
    cursor = connection.cursor()
    if cursor.db.vendor != 'mysql':
        logger.warning("unable to lock tables")
        yield
    else:
        try:
            # If a table is present in in both read and write arguments,
            # remove the table from the read set
            final_read_tables = read_tables.difference(write_tables)
            write_statement = ','.join(
                [table + ' write' for table in write_tables]) + ',' if len(write_tables) > 0 else ''
            read_statement = ','.join(
                [table + ' read' for table in final_read_tables])
            cursor.execute(f'lock tables {write_statement}{read_statement};')
            yield
        finally:
            cursor.execute('unlock tables')
