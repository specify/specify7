from django.db import transaction

from specifyweb.specify.models import Collection, Spprincipal, Specifyuser
from specifyweb.backend.permissions.permissions import query_pt, CollectionAccessPT

def users_collections_for_sp6(cursor, user_id) -> list[tuple[int, str]]:
    """
    Given a SpecifyUser ID, returns the Collection IDs and Names of each
    Collection they can access through Specify 6
    """
    cursor.execute("""
    select distinct c.usergroupscopeid, c.collectionname from collection c
    inner join spprincipal p on p.usergroupscopeid = c.usergroupscopeid
    inner join specifyuser_spprincipal up on up.spprincipalid = p.spprincipalid
    inner join specifyuser u on u.specifyuserid = up.specifyuserid and p.grouptype is null
    where up.specifyuserid = %s
    """, [user_id])

    return list(cursor.fetchall())

def has_collection_access(collection_id: int, user_id: int) -> bool:
    """
    Returns whether a user has access (through Specify 7) to a specific collection
    """
    return query_pt(collection_id, user_id, CollectionAccessPT.access).allowed

def users_collections_for_sp7(userid: int) -> list[Collection]: # pragma: no cover
    """
    Given a SpecifyUser ID, returns a list of Collections they can access
    through Specify7
    """
    return [
        c
        for c in Collection.objects.all()
        if has_collection_access(c.pk, userid)
    ]

def set_users_collections_for_sp6(cursor, user: Specifyuser, collectionids: list[int]): # pragma: no cover
    with transaction.atomic():
        # Delete the principals for the user for all collections not
        # in collectionids. (I think the principal represents the
        # user's capacity wrt to a collection.)

        # Unset all collections for the user if collectionids is empty
        if not collectionids:
            cursor.execute("delete from specifyuser_spprincipal where SpecifyUserID = %s", [user.id])
            cursor.execute("delete from spprincipal_sppermission where spprincipalid in ("
                           "select spprincipalid from specifyuser_spprincipal)")

            return

        # First delete the mappings from the user to the principals.
        cursor.execute("delete specifyuser_spprincipal "
                       "from specifyuser_spprincipal "
                       "join spprincipal using (spprincipalid) "
                       "where specifyuserid = %s and usergroupscopeid not in %s"
                       "and spprincipal.Name != 'Administrator'",
                       [user.id, collectionids])

        # Next delete the joins from the principals to any permissions.
        cursor.execute("delete from spprincipal_sppermission where spprincipalid not in ("
                       "select spprincipalid from specifyuser_spprincipal)")

        # Finally delete all the principals that aren't connected to
        # any user. This should just be the ones where the mappings
        # were deleted above.
        cursor.execute("delete from spprincipal where grouptype is null and spprincipalid not in ("
                       "select spprincipalid from specifyuser_spprincipal)")

        # Now to add any new principals. Which ones alerady exist?
        cursor.execute("select usergroupscopeid from spprincipal "
                       "join specifyuser_spprincipal using (spprincipalid) "
                       "where grouptype is null and specifyuserid = %s",
                       [user.id])
        already_exist = {r[0] for r in cursor.fetchall()}

        for collectionid in set(collectionids) - already_exist:
            principal = Spprincipal.objects.create(
                groupsubclass='edu.ku.brc.af.auth.specify.principal.UserPrincipal',
                grouptype=None,
                name=user.name,
                priority=80,
            )
            cursor.execute('update spprincipal set usergroupscopeid = %s where spprincipalid = %s',
                           [collectionid, principal.id])
            cursor.execute('insert specifyuser_spprincipal(SpecifyUserID, SpPrincipalID) '
                           'values (%s, %s)', [user.id, principal.id])
