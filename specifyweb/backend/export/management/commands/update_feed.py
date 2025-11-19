from django.core.management.base import BaseCommand, CommandError

from specifyweb.backend.export.feed import update_feed, MissingFeedResource

class Command(BaseCommand):

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            dest='force',
            default=False,
            help='Force update of all publications regardless of update interval.',
        )

    def handle(self, *args, **kwargs):
        try:
            update_feed(force=kwargs['force'])
        except MissingFeedResource:
            self.stdout.write(self.style.ERROR('No "ExportFeed" app resource found at Common level.'))
            return
        self.stdout.write(self.style.SUCCESS('Finished updating feed.'))

