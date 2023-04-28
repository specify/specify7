from django.core.management.base import BaseCommand

from specifyweb.export.feed import update_feed, MissingFeedResource


class Command(BaseCommand):
    help="""
    This will update all export feeds that need updating (based on the "days"
    interval in the export feed definition file).
    
    You can configure a CRON job to run this command at a regular interval.
    """

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

