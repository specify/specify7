import logging

from django.dispatch import receiver
from django_auth_ldap.backend import populate_user
from django.conf import settings

logger = logging.getLogger(__name__)

django_auth_logger = logging.getLogger('django_auth_ldap')
django_auth_logger.addHandler(logging.StreamHandler())
django_auth_logger.setLevel(logging.DEBUG)

@receiver(populate_user)
def handle_populate_user(sender, user, ldap_user, **kwargs):
    from .models import Division, Agent
    from .agent_types import agent_types

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

    groups = ldap_user.group_names
    usertype = settings.SPECIFY_LDAP_USERTYPE_MAP
    if usertype.admin in groups:
        user.usertype = 'Manager'
        user.set_admin()
        logger.info("making user %s an admin", user.name)

    elif usertype.manager in groups:
        user.usertype = 'Manager'

    elif usertype.full_access in groups:
        user.usertype = 'FullAccess'

    elif usertype.limited_access in groups:
        user.usertype = 'LimitedAccess'

    else:
        user.usertype = 'Guest'

    logger.info("setting usertype %s on user %s", user.usertype, user.name)
