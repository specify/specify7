from django.db import connection

from .orm_signal_handler import orm_signal_handler

@orm_signal_handler('pre_save', 'Workbench')
def fix_workbenchtemplate_name(workbench):
    workbench.workbenchtemplate.name = workbench.name
    workbench.workbenchtemplate.save(update_fields=['name'])

@orm_signal_handler('pre_delete', 'Workbench')
def optimize_workbench_delete(workbench):
    cursor = connection.cursor()

    cursor.execute("""
    delete from exported using
    workbenchrowexportedrelationship exported
    join workbenchrow row on exported.workbenchrowid = row.workbenchrowid
    where row.workbenchid = %s
    """, [workbench.id])

    cursor.execute("""
    delete from image using
    workbenchrowimage image
    join workbenchrow row on image.workbenchrowid = row.workbenchrowid
    where row.workbenchid = %s
    """, [workbench.id])

    cursor.execute("""
    delete from item using
    workbenchdataitem item
    join workbenchrow row on item.workbenchrowid = row.workbenchrowid
    where row.workbenchid = %s
    """, [workbench.id])

    cursor.execute("""
    delete from row using
    workbenchrow row
    where row.workbenchid = %s
    """, [workbench.id])
