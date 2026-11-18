from specifyweb.backend.permissions.permissions import PermissionTarget, PermissionTargetAction


class InviteLinkPT(PermissionTarget):
    resource = "/admin/user/invite_link"
    create = PermissionTargetAction()

class UserOICProvidersPT(PermissionTarget):
    resource = "/admin/user/oic_providers"
    read = PermissionTargetAction()
    # an update action could be added to enable/disable certain providers.

class SetPasswordPT(PermissionTarget):
    resource = '/admin/user/password'
    update = PermissionTargetAction()

class SetUserAgentsPT(PermissionTarget):
    resource = '/admin/user/agents'
    update = PermissionTargetAction()

class Sp6AdminPT(PermissionTarget):
    resource = '/admin/user/sp6/is_admin'
    update = PermissionTargetAction()

