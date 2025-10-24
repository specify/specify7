
from specifyweb.backend.permissions.permissions import PermissionsException


class SetAgentsException(PermissionsException):
    status_code = 400

    def to_json(self):
        return {self.__class__.__name__: self.args[0]}


class AgentInUseException(SetAgentsException):
    "One of the agents being assigned is already assigned to another user."
    pass


class MultipleAgentsException(SetAgentsException):
    "Attempting to assign more than one agent per division to the user."
    pass


class MissingAgentForAccessibleCollection(SetAgentsException):
    "The user has access to a collection in a division that is not represented by any agent."
    pass
