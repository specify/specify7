from urllib.parse import quote_plus

from Crypto.Random import get_random_bytes
from django.core.management.base import BaseCommand, CommandError
from django.utils.http import urlencode
from django.conf import settings

from specifyweb.specify.auth.support_login import make_token, bytes_to_b64_url
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
                self.stdout.write(
                    '\t'.join((user.name, user.usertype, admin(user))))
            return

        username = options['username']

        if not settings.ALLOW_SUPPORT_LOGIN:
            raise CommandError('support login not enabled')

        if username is None:
            raise CommandError('username must be supplied')

        # The symmetric encryption algorithm (AES CGM - see make_token) expects
        # one of three key sizes:
        # - 128 bit (16 byte)
        # - 192 bit (24 byte)
        # - 256 bit (32 byte)
        # We use the most cryptographically secure key here: doesn't seem to impact
        # performance too much
        # This key is essentially a private key, it is used in conjuction with 
        # the SECRET_KEY of the server to encrypt/decrtpy
        key = get_random_bytes(32)

        try:
            user = Specifyuser.objects.get(name=username)
        except Specifyuser.DoesNotExist:
            raise CommandError('No user with name "%s"' % username)

        self.stdout.write("The following token is good for %d seconds:" % TTL)
        self.stdout.write(f"Append the token to your server domain to login as {username}")
        self.stdout.write(
            f"/accounts/support_login/?token={quote_plus(make_token(user, key))}&key={bytes_to_b64_url(key)}")
