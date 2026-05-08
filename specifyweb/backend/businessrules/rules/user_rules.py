from django.db.models import signals
from django.dispatch import receiver
from django.db import connection

from specifyweb.specify.models import Specifyuser, Spprincipal, Collection
from specifyweb.backend.businessrules.exceptions import BusinessRuleException


@receiver(signals.post_save, sender=Specifyuser)
def added_user(sender, instance, created, raw, **kwargs):
    if raw or not created:
        return
    user = instance
    cursor = connection.cursor()

    for collection in Collection.objects.all():
        principal = Spprincipal.objects.create(
            groupsubclass='edu.ku.brc.af.auth.specify.principal.UserPrincipal',
            grouptype=None,
            name=user.name,
            priority=80,
        )
        cursor.execute('update spprincipal set usergroupscopeid = %s where spprincipalid = %s',
                       (collection.id, principal.id))
        # cursor.execute('insert into specifyuser_spprincipal(SpecifyUserID, SpPrincipalID) values (%s, %s)',
        #                (user.id, principal.id))

    group_principals = Spprincipal.objects.filter(
        groupsubclass='edu.ku.brc.af.auth.specify.principal.GroupPrincipal',
        grouptype=user.usertype,
    )

    for gp in group_principals:
        cursor.execute(
            'insert into specifyuser_spprincipal(specifyuserid, spprincipalid) values (%s, %s)',
            [user.id, gp.id]
        )


@receiver(signals.pre_delete, sender=Specifyuser)
def deleting_user(sender, instance, **kwargs):
    user = instance

    nonpersonal_appresources = user.spappresources.filter(
        spappresourcedir__ispersonal=False)
    if nonpersonal_appresources.exists():
        raise BusinessRuleException(
            f"user {user.name} owns nonpersonal appresources {[r.name for r in nonpersonal_appresources]}",
            {"table": user.__class__.__name__,
             "userid": user.id}
        )

    cursor = connection.cursor()
    cursor.execute(
        'delete from specifyuser_spprincipal where SpecifyUserID = %s', [user.id])
    # Clean up unused user principal rows.
    cursor.execute('delete from spprincipal where grouptype is null and spprincipalid not in ('
                   'select spprincipalid from specifyuser_spprincipal)')
