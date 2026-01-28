import json
from pathlib import Path
from django.db.models import Model as DjangoModel
from typing import Optional, Type
from specifyweb.specify.api_utils import strict_uri_to_model

import logging

from specifyweb.backend.context.app_resource import DISCIPLINE_NAMES

from specifyweb.specify.models import Picklist, Picklistitem, Splocalecontaineritem
logger = logging.getLogger(__name__)

def resolve_uri_or_fallback(uri: Optional[str], id: Optional[int], table: Type[DjangoModel]) -> Optional[DjangoModel]:
    """
    Retrieves a record from a URI or ID, falling back to the last created record if it exists.
    """
    if uri is not None:
        # Try to resolve uri. It must be valid.
        try:
            uri_table, uri_id = strict_uri_to_model(uri, table._meta.db_table)
            return table.objects.filter(pk=uri_id).first()
        except Exception as e:
            raise ValueError(e)
    elif id is not None:
        # Try to use the provided id. It must be valid.
        try:
            return table.objects.get(pk=id)
        except table.DoesNotExist:
            raise table.DoesNotExist(f"{table.name} with id {id} not found")
    # Fallback to last created record.
    return table.objects.last()

def load_json_from_file(path: Path):
    """
    Read a JSON file included within Specify directories. The file is expected to exist.
    """

    if path.exists() and path.is_file():
        try:
            with path.open('r', encoding='utf-8') as fh:
                return json.load(fh)
        except json.JSONDecodeError as e:
            logger.exception('Failed to decode JSON from %s: %s', path, e)
            return None
        except Exception as e:
            logger.exception('Failed to decode JSON from %s: %s', path, e)
            return None
    else:
        logger.debug('JSON file at %s does not exist.', path)
        return None

def normalize_keys(obj):
    if isinstance(obj, dict):
        return {k.lower(): normalize_keys(v) for k, v in obj.items()}
    else:
        return obj

DISCIPLINE_TYPE_PICKLIST_NAME = 'DisciplineType'
def ensure_discipline_type_picklist(collection):
    picklist, created = Picklist.objects.get_or_create(
        name=DISCIPLINE_TYPE_PICKLIST_NAME,
        type=0,
        collection=collection,
        defaults={
            "issystem": True,
            "readonly": True,
            "sizelimit": -1,
            "sorttype": 1,
        }
    )

    if created:
        Picklistitem.objects.bulk_create([
            Picklistitem(
                picklist=picklist,
                ordinal=i + 1,
                value=value,
                title=title,
            )
            for i, (value, title) in enumerate(DISCIPLINE_NAMES.items())
        ])