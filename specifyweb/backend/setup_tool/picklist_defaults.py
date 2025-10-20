import re
import json
from pathlib import Path
from django.db import transaction

import logging

from specifyweb.specify.models import (
    Collection,
    Picklist,
    Picklistitem
)

logger = logging.getLogger(__name__)

def create_picklist_defaults(collection: Collection):
    # Global picklists
    logger.debug('Creating default global picklists.')
    # Get from defaults file
    defaults = None
    global_picklists_file = (Path(__file__).parent.parent.parent.parent / 'config' / 'common' / 'global_picklists.json')
    if global_picklists_file.exists() and global_picklists_file.is_file():
        try:
            with global_picklists_file.open('r', encoding='utf-8') as fh:
                defaults = json.load(fh)
        except Exception as e:
            logger.exception(f'Failed to load global picklists from {global_picklists_file}: {e}')
            defaults = None
    
    global_picklists = defaults.get('picklists', None)
    if global_picklists is None:
        logger.exception('No global picklists found in global_picklists.json.')
        return
    try:
        with transaction.atomic():
            # Create picklists in bulk
            global_picklists_blk = []
            for picklist in global_picklists:
                global_picklists_blk.append(
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
            Picklist.objects.bulk_create(global_picklists_blk, ignore_conflicts=True)

            # Create picklist items in bulk
            names = [p.name for p in global_picklists_blk]
            db_picklists = Picklist.objects.filter(name__in=names)
            name_to_obj = {pl.name: pl for pl in db_picklists}

            global_picklistitems_blk = []
            for picklist in global_picklists:
                parent = name_to_obj.get(picklist['name'])
                for picklistitem in picklist['items']:
                    global_picklistitems_blk.append(
                        Picklistitem(
                            picklist=parent,
                            title=picklistitem.get('title'),
                            value=picklistitem.get('value'),
                        )
                    )
            Picklistitem.objects.bulk_create(global_picklistitems_blk, ignore_conflicts=True)

    except Exception:
        logger.exception('An error occured when creating default picklists.')