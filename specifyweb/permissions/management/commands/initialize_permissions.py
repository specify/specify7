from django.core.management.base import BaseCommand, CommandError

from specifyweb.permissions.initialize import initialize

class Command(BaseCommand):
    def add_arguments(self, parser) -> None:
        parser.add_argument(
            '--wipe',
            action='store_true',
            dest='wipe',
            default=False,
            help=''' Initialization of permissions will be blocked if the Sp7
            permissions settings have been customized. This option
            wipes out all customization and reintializes the
            permissions to the default state.
            ''',
        )

    def handle(self, *args, **options) -> None:
        initialize(wipe=options['wipe'])
