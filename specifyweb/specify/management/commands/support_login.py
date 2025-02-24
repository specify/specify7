from optparse import make_option

from django.core.management.base import BaseCommand, CommandError
from django.conf import settings

from specifyweb.specify.support_login import make_token
from specifyweb.specify.models import Specifyuser

TTL = settings.SUPPORT_LOGIN_TTL

class Command(BaseCommand):
    help = 'Creates a token for support login as the given user.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--username',
            default=None
        )

        parser.add_argument(
            '--list',
            action='store_true',
            dest='list',
            default=False,
            help='List users in database',
        )

    def handle(self, **options):
        if options['list']:
            def admin(user): return 'admin' if user.is_legacy_admin() else ''

            for user in Specifyuser.objects.all():
                self.stdout.write('\t'.join((user.name, user.usertype, admin(user))))
            return

        username = options['username']

        if not settings.ALLOW_SUPPORT_LOGIN:
            raise CommandError('support login not enabled')

        if username is None:
            raise CommandError('username must be supplied')

        try:
            user = Specifyuser.objects.get(name=username)
        except Specifyuser.DoesNotExist:
            raise CommandError('No user with name "%s"' % username)

        self.stdout.write("The following token is good for %d seconds:" % TTL)
        self.stdout.write("/accounts/support_login/?token=" + make_token(user))
