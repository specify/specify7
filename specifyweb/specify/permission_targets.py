from specifyweb.permissions.permissions import PermissionTarget, PermissionTargetAction


class SetPasswordPT(PermissionTarget):
    resource = '/admin/user/password'
    update = PermissionTargetAction()

class SetUserAgentsPT(PermissionTarget):
    resource = '/admin/user/agents'
    update = PermissionTargetAction()

class Sp6AdminPT(PermissionTarget):
    resource = '/admin/user/sp6/is_admin'
    update = PermissionTargetAction()

class ReplaceRecordPT(PermissionTarget):
    resource = "/record/merge"
    update = PermissionTargetAction()
    delete = PermissionTargetAction()

