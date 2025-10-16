from django.core.management.base import BaseCommand
from django.db import connections, transaction
import logging

logger = logging.getLogger(__name__)

# Mock the initial Django migration for the specify app.
# Most of the Django models we defined in Specify 6 and so already exists in the
# database before any django migrations were made.
# This command simply adds the initial migration to the migration history table.
class Command(BaseCommand):
    help = "Add initial specify migration to django_migrations table."

    def add_arguments(self, parser):
        # Optional Override flag; defaults to False
        parser.add_argument(
            "--use-override",
            dest="use_override",
            action="store_true",
            default=False,
            help="Insert initial 'specify' migration record if missing.",
        )
        parser.add_argument("--database", default="migrations")

    def handle(self, *args, **options):
        use_override = bool(options.get('use_override', False))
        alias = options["database"]
        conn = connections[alias]
        logger.info(f"Running base_specify_migration using database alias '{alias}'")

        try:
            transaction.atomic(using=alias)
        except:
            alias = 'master'

        with transaction.atomic(using=alias):
            with conn.cursor() as cursor:
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

                # Check if the record in the django_migrations table exists with app 'specify' and name '0001_initial'
                if use_override:
                    cursor.execute("""
                        SELECT 1
                        FROM django_migrations
                        WHERE app = 'specify' AND name = '0001_initial'
                        LIMIT 1;
                    """)
                    record_exists = cursor.fetchone() is not None

                    if not record_exists:
                        # Insert the initial migration record for the specify app
                        cursor.execute("""
                            INSERT INTO django_migrations (app, name, applied)
                            VALUES ('specify', '0001_initial', NOW());
                        """)
        
        logger.info(f"Completed using database alias '{alias}'")
