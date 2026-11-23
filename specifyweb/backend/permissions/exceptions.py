class PermissionsException(Exception):
    status_code = 500

    def to_json(self) -> dict:
        return {"PermissionsException": repr(self)}
