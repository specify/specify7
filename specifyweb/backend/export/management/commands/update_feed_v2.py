"""Management command to update DwC export feed using the new model."""
from django.core.management.base import BaseCommand
from specifyweb.backend.export.feed import update_feed_v2


class Command(BaseCommand):
    help = 'Update DwC export feed items that are due for refresh'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force', action='store_true',
            help='Force update all RSS-enabled datasets regardless of schedule',
        )

    def handle(self, *args, **options):
        updated = update_feed_v2()
        if updated:
            self.stdout.write(self.style.SUCCESS(
                f'Updated {len(updated)} dataset(s): {", ".join(updated)}'
            ))
        else:
            self.stdout.write('No datasets needed updating.')
