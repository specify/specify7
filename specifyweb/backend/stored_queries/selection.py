from typing import Literal, TypedDict

from django.core.exceptions import BadRequest
from sqlalchemy import false


MAX_SELECTION_IDS = 10000


class QuerySelection(TypedDict):
    mode: Literal["include", "exclude"]
    ids: list[int]


def parse_selection(value: object) -> QuerySelection | None:
    if value is None:
        return None
    if not isinstance(value, dict) or value.get("mode") not in ("include", "exclude"):
        raise BadRequest("Selection mode must be 'include' or 'exclude'.")
    ids = value.get("ids")
    if (
        not isinstance(ids, list)
        or len(ids) > MAX_SELECTION_IDS
        or any(type(record_id) is not int or record_id <= 0 for record_id in ids)
    ):
        raise BadRequest(
            f"Selection must contain at most {MAX_SELECTION_IDS} positive integer IDs."
        )
    return {"mode": value["mode"], "ids": list(dict.fromkeys(ids))}


def apply_selection(query, id_field, selection: QuerySelection | None):
    if selection is None:
        return query
    if selection["mode"] == "include":
        if not selection["ids"]:
            return query.filter(false())
        return query.filter(id_field.in_(selection["ids"]))
    return query.filter(~id_field.in_(selection["ids"])) if selection["ids"] else query
