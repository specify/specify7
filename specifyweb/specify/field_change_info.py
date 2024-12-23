from typing import Any, TypedDict

# All field change infos are of this type. Placing it here to avoid circular dependencies with, almost every data modification file.
class FieldChangeInfo(TypedDict):
    field_name: str
    old_value: Any
    new_value: Any