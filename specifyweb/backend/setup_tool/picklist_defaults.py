import json
from pathlib import Path
from django.db import transaction
from .utils import load_json_from_file

import logging

from specifyweb.specify.models import (
    Collection,
    Picklist,
    Picklistitem
)

logger = logging.getLogger(__name__)

def create_default_picklists(collection: Collection, discipline_type: str | None):
    """
    Creates defaults picklists for -one- collection, including discipline specific picklists.
    """
    # Get global picklists
    logger.debug('Reading default global picklists.')
    defaults = load_json_from_file(Path(__file__).parent.parent.parent.parent / 'config' / 'common' / 'global_picklists.json')
    
    global_picklists = defaults.get('picklists', None) if defaults is not None else None
    if global_picklists is None:
        logger.exception('No global picklists found in global_picklists.json.')
        return

    # Get discipline picklists
    logger.debug('Reading default discipline picklists.')
    if discipline_type is None:
        return
    discipline_defaults = load_json_from_file(Path(__file__).parent.parent.parent.parent / 'config' / 'common' / 'picklists.json')
    
    discipline_picklists = discipline_defaults.get(discipline_type, None)
    if discipline_picklists is None:
        logger.exception(f'No picklists found for discipline "{discipline_type}" in picklists.json.')
        return

    # Create the picklists
    logger.debug('Creating default picklists.')
    picklists_to_create = []
    picklists_to_create.extend(global_picklists)
    picklists_to_create.extend(discipline_picklists)
    create_picklists(picklists_to_create, collection)
 
def create_picklists(configuraton: list, collection: Collection):
    """
    Create a set of picklists from a configuration list.
    """
    # Create picklists from a list of picklist configuration dicts.
    try:
        with transaction.atomic():
            # Create picklists in bulk
            picklists_bulk = []
            for picklist in configuraton:
                picklists_bulk.append(
                    Picklist(
                        collection=collection,
                        name=picklist.get('name'),
                        issystem=picklist.get('issystem', True),
                        type=picklist.get('type'),
                        tablename=picklist.get('tablename'),
                        fieldname=picklist.get('fieldname'),
                        readonly=picklist.get('readonly'),
                        sizelimit=picklist.get('sizelimit'),
                    )
                )
            Picklist.objects.bulk_create(picklists_bulk, ignore_conflicts=True)

            # Create picklist items in bulk
            names = [p.name for p in picklists_bulk]
            picklist_records = Picklist.objects.filter(name__in=names)
            name_to_obj = {pl.name: pl for pl in picklist_records}

            picklistitems_bulk = []
            for picklist in configuraton:
                parent = name_to_obj.get(picklist['name'])
                for picklistitem in picklist['items']:
                    picklistitems_bulk.append(
                        Picklistitem(
                            picklist=parent,
                            title=picklistitem.get('title'),
                            value=picklistitem.get('value'),
                        )
                    )
            Picklistitem.objects.bulk_create(picklistitems_bulk, ignore_conflicts=True)

    except Exception:
        logger.exception('An error occured when creating default picklists.')