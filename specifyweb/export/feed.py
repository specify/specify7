import errno
import json
import logging
import os
import time

from xml.etree import ElementTree as ET
from typing import Optional
from django.conf import settings

from .dwca import make_dwca
from ..context.app_resource import get_app_resource, get_app_resource_from_db
from ..notifications.models import Message
from ..specify.models import Collection, Specifyuser

logger = logging.getLogger(__name__)

FEED_DIR = os.path.join(settings.DEPOSITORY_DIR, "export_feed")


class MissingFeedResource(Exception):
    pass


def get_feed_resource():
    from_db = get_app_resource_from_db(None, None, 'Common', 'ExportFeed')
    return None if from_db is None else from_db[0]


def update_feed(force=False, notify_user: Optional[Specifyuser] = None):
    feed_resource = get_feed_resource()
    if feed_resource is None:
        raise MissingFeedResource()

    try:
        os.makedirs(FEED_DIR)
    except OSError as e:
        if e.errno != errno.EEXIST:
            raise

    def_tree = ET.fromstring(feed_resource)
    for item_node in def_tree.findall('item'):
        filename = item_node.attrib['filename']
        path = os.path.join(FEED_DIR, filename)

        if force or needs_update(path, int(item_node.attrib['days'])):
            logger.info('Generating: %s', filename)
            temp_file = os.path.join(FEED_DIR, '%s.tmp.zip' % filename)
            collection_id = item_node.attrib.get(
                'collectionid', item_node.attrib.get('collectionId'))
            collection = Collection.objects.get(id=collection_id)
            user_id = item_node.attrib.get(
                'userid', item_node.attrib.get('userId'))
            user = Specifyuser.objects.get(id=user_id)
            dwca_def, _, __ = get_app_resource(
                collection, user, item_node.attrib['definition'])
            eml, _, __ = get_app_resource(
                collection, user, item_node.attrib['metadata'])
            make_dwca(collection, user, dwca_def, temp_file, eml=eml)
            os.rename(temp_file, path)

            logger.info('Finished updating: %s', filename)
            notify_user_id = item_node.attrib.get(
                'notifyuserid', item_node.attrib.get('notifyUserId'))

            if notify_user_id:
                user = Specifyuser.objects.get(id=notify_user_id)
                create_notification(user, filename)
            else:
                create_notification(user, filename)

            if notify_user and user.id != notify_user.id:
                    create_notification(notify_user, None)

        else:
            logger.info('No update needed: %s', filename)


def needs_update(path, days):
    try:
        mtime = os.path.getmtime(path)
    except OSError as e:
        if e.errno != errno.ENOENT:
            raise
    else:
        update_interval = 24*60*60 * days
        age = time.time() - mtime
        logger.debug("archive age: %s update interval: %s",
                     age, update_interval)
        return age > update_interval


def create_notification(user: Specifyuser, filename: Optional[str]):
    Message.objects.create(user=user, content=json.dumps({
        'type': 'feed-item-updated',
        'file': filename
    }))
