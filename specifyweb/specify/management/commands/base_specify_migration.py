from genericpath import exists
from django.core.management.base import BaseCommand
from django.db import connection


# Mock the initial Django migration for the specify app.
# Most of the Django models we defined in Specify 6 and so already exists in the
# database before any django migrations were made.
# This command simply adds the initial migration to the migration history table.
class Command(BaseCommand):
    help = "Add initial specify migration to django_migrations table."

    def handle(self, *args, **options):
        with connection.cursor() as cursor:
            # Check django table
            try:
                cursor.execute("""
                    SELECT 1
                    FROM django_migrations
                    LIMIT 1;
                """)
                exists = True
            except:
                exists = False
            
            if not exists:
                # Check if the django_migrations table exists and create it if it doesn't
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS `django_migrations` (
                        `id` int(11) NOT NULL AUTO_INCREMENT,
                        `app` varchar(255) NOT NULL,
                        `name` varchar(255) NOT NULL,
                        `applied` datetime NOT NULL,
                        PRIMARY KEY (`id`)
                    );
                """)

            # Check if the record exists and insert it if it doesn't
            cursor.execute("""
                INSERT INTO django_migrations (app, name, applied)
                SELECT 'specify', '0001_initial', NOW()
                FROM dual
                WHERE NOT EXISTS (
                    SELECT 1
                    FROM django_migrations
                    WHERE app = 'specify' AND name = '0001_initial'
                );
            """)
