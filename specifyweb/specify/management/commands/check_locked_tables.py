from django.core.management.base import BaseCommand
from django.db import connection
from time import sleep

def check_locked_tables(table_names=None):
    with connection.cursor() as cursor:
        if table_names is None:
            cursor.execute('SHOW TABLES')
            table_names = [row[0] for row in cursor.fetchall()]

        table_list = ', '.join(['"{}"'.format(table_name) for table_name in table_names])
        cursor.execute(f'SHOW OPEN TABLES WHERE Table IN ({table_list}) AND In_use > 0')
        locked_tables = [row[1] for row in cursor.fetchall()]

        if locked_tables:
            sleep(2)
            return check_locked_tables(table_names)

        return locked_tables

def verify_no_locked_tables(table_names):
    locked_tables = check_locked_tables(table_names)

    if locked_tables:
        raise Exception(f'Tables {locked_tables} are still locked after retrying')
    return True

class CheckLockedTables(BaseCommand):
    help = 'Check if specified tables are locked in the database'

    def add_arguments(self, parser):
        parser.add_argument('table_names', nargs='*', type=str)

    def handle(self, *args, **options):
        table_names = options['table_names']
        locked_tables = check_locked_tables(table_names)

        if locked_tables:
            self.stdout.write(self.style.ERROR(f'The following tables are still locked: {locked_tables}'))
            raise Exception(f'Tables {locked_tables} are still locked after retrying')
        else:
            self.stdout.write(self.style.SUCCESS('No locked tables found'))
