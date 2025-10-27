import json
from pathlib import Path

import logging

from specifyweb.specify.models import (
    Collection,
    Preptype
)

logger = logging.getLogger(__name__)

def create_default_prep_types(collection: Collection, discipline_type: str):
    """
    Load default collection prep types from the prep_types file.
    """
    logger.debug('Creating default prep types.')
    prep_type_list = None
    prep_types_file = (Path(__file__).parent.parent.parent.parent / 'config' / 'common' / 'prep_types.json')
    try:
        with prep_types_file.open('r', encoding='utf-8') as fh:
            prep_type_list = json.load(fh)
    except Exception as e:
        logger.exception(f'Failed to prepTypes from {prep_types_file}: {e}')
        prep_type_list = None

    if prep_type_list is None:
        return
    
    # Get prep types for this collection's discipline type.
    prep_type_discipline_list = prep_type_list.get(discipline_type, None)

    if prep_type_discipline_list is None:
        return
    
    prep_type_bulk = []
    for prep_type in prep_type_discipline_list:
        prep_type_bulk.append(
            Preptype(
                collection=collection,
                name=prep_type.get('name'),
                isloanable=prep_type.get('isloanable')
            )
        )
    
    Preptype.objects.bulk_create(prep_type_bulk, ignore_conflicts=True)
    