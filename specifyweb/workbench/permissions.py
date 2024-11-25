from specifyweb.permissions.permissions import PermissionTarget, PermissionTargetAction


class DataSetPT(PermissionTarget):
    resource = "/workbench/dataset"
    create = PermissionTargetAction()
    update = PermissionTargetAction()
    delete = PermissionTargetAction()
    upload = PermissionTargetAction()
    unupload = PermissionTargetAction()
    validate = PermissionTargetAction()
    transfer = PermissionTargetAction()
    create_recordset = PermissionTargetAction()


class BatchEditDataSetPT(PermissionTarget):
    resource = "/batch_edit/dataset"
    create = PermissionTargetAction()
    update = PermissionTargetAction()
    delete = PermissionTargetAction()
    commit = PermissionTargetAction()
    rollback = PermissionTargetAction()
    validate = PermissionTargetAction()
    transfer = PermissionTargetAction()
    create_recordset = PermissionTargetAction()
    # whether dependents should be deleted (checked during upload)
    delete_dependents = PermissionTargetAction()
    # whether multiple tables need to be updated (checked during dataset construction)
    edit_multiple_tables = PermissionTargetAction()
