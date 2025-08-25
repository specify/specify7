import logging
from collections import namedtuple

from django.dispatch import receiver
from django_auth_ldap.backend import populate_user
from django.conf import settings

logger = logging.getLogger(__name__)

django_auth_logger = logging.getLogger('django_auth_ldap')
django_auth_logger.addHandler(logging.StreamHandler())
django_auth_logger.setLevel(logging.DEBUG)

UserTypes = namedtuple('UserTypes', 'admin manager full_access limited_access guest')
USERTYPES = UserTypes(
    admin='Admin',
    manager='Manager',
    full_access='FullAccess',
    limited_access='LimitedAccess',
    guest='Guest',
)

@receiver(populate_user)
def handle_populate_user(sender, user, ldap_user, **kwargs):
    from django.db import connection
    from ..backend.datamodel.models import Collection, Division, Agent
    from .agent_types import agent_types
    from specifyweb.backend.context.views import set_users_collections

    for division in Division.objects.all():
        agent, created = Agent.objects.get_or_create(
            specifyuser=user,
            division=division,
            defaults=dict(
                firstname=(ldap_user.attrs.get('givenname', []) + [""])[0],
                lastname=(ldap_user.attrs.get('sn', []) + [""])[0],
                agenttype=agent_types.index('Person')
            )
        )
        if created:
            logger.info("created agent for user %s in division %s", user.name, division.name)

    if settings.SPECIFY_LDAP_USERTYPE_MAP is not None:
        usertype = settings.SPECIFY_LDAP_USERTYPE_MAP(USERTYPES, ldap_user)

        assert usertype in USERTYPES, """
        settings.SPECIFY_LDAP_USERTYPE_MAP must return one of {}. Got {}, instead.
        """.format(USERTYPES, usertype)

        if usertype == USERTYPES.admin:
            user.usertype = USERTYPES.manager
            user.set_admin()
            logger.info("making user %s an admin", user.name)

        else:
            user.usertype = usertype
            user.clear_admin()

        logger.info("setting usertype %s on user %s", user.usertype, user.name)

    if settings.SPECIFY_LDAP_COLLECTIONS is not None:
        collections = list(Collection.objects.all())
        user_collections = settings.SPECIFY_LDAP_COLLECTIONS(collections, ldap_user)

        assert all(c in collections for c in user_collections), \
            "settings.SPECIFY_LDAP_COLLECTIONS must return a specify collection record."

        set_users_collections(connection.cursor(), user, [c.id for c in user_collections])

        logger.info("granting access to %s for user %s",
                    [c.collectionname for c in user_collections],
                    user.name)
