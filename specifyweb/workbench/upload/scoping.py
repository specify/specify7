from typing import Dict, Any, Union

from specifyweb.specify.datamodel import datamodel, Table, Relationship
from specifyweb.specify.load_datamodel import DoesNotExistError

def scoping_relationships(collection, table: Table) -> Dict[str, int]:
    extra_static: Dict[str, int] = {}

    try:
        table.get_field_strict('collectionmemberid')
        extra_static['collectionmemberid'] = collection.id
    except DoesNotExistError:
        pass

    try:
        table.get_relationship('collection')
        extra_static['collection_id'] = collection.id
    except DoesNotExistError:
        pass

    try:
        table.get_relationship('discipline')
        extra_static['discipline_id'] = collection.discipline.id
    except DoesNotExistError:
        pass

    try:
        table.get_relationship('division')
        extra_static['division_id'] = collection.discipline.division.id
    except DoesNotExistError:
        pass

    return extra_static
