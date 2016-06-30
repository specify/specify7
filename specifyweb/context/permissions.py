import re

from django.db import connection

TASK = re.compile(r'^Task\.')

def user_tasks(collectionid, userid):
    cursor = connection.cursor()

    cursor.execute("""
    select distinct perm.name
    from specifyuser_spprincipal up
    join spprincipal p on up.spprincipalid = p.spprincipalid
    join spprincipal_sppermission pp on pp.spprincipalid = p.spprincipalid
    join sppermission perm on perm.sppermissionid = pp.sppermissionid
    where usergroupscopeid = %s and specifyuserid = %s
    and actions like 'view%%' and perm.name like 'Task.%%'
    """, [collectionid, userid])

    return [TASK.sub('', task) for (task, ) in cursor.fetchall()]
