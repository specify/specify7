def users_collections_for_sp6(cursor, user_id):
    cursor.execute("""
    select distinct c.usergroupscopeid, c.collectionname from collection c
    inner join spprincipal p on p.usergroupscopeid = c.usergroupscopeid
    inner join specifyuser_spprincipal up on up.spprincipalid = p.spprincipalid
    inner join specifyuser u on u.specifyuserid = up.specifyuserid and p.grouptype is null
    where up.specifyuserid = %s
    """, [user_id])

    return list(cursor.fetchall())
