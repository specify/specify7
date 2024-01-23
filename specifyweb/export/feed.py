import os
import time
import errno
import logging
import json

from xml.etree import ElementTree as ET

from django.conf import settings

from ..specify.models import Spappresourcedata, Collection, Specifyuser
from ..context.app_resource import get_app_resource
from ..notifications.models import Message

from .dwca import make_dwca

logger = logging.getLogger(__name__)

FEED_DIR = os.path.join(settings.DEPOSITORY_DIR, "export_feed")

class MissingFeedResource(Exception):
    pass

def get_feed_resource():
    try:
        return Spappresourcedata.objects.get(
            spappresource__name="ExportFeed",
            spappresource__spappresourcedir__usertype="Common",
            spappresource__spappresourcedir__discipline=None,
        ).data
    except Spappresourcedata.DoesNotExist:
        return None

def update_feed(force=False, notify_user=None):
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
            collection = Collection.objects.get(id=item_node.attrib['collectionId'])
            user = Specifyuser.objects.get(id=item_node.attrib['userId'])
            dwca_def, _ = get_app_resource(collection, user, item_node.attrib['definition'])
            eml, _ = get_app_resource(collection, user, item_node.attrib['metadata'])
            make_dwca(collection, user, dwca_def, temp_file, eml=eml)
            os.rename(temp_file, path)

            logger.info('Finished updating: %s', filename)
            if notify_user is not None:
                create_notification(notify_user, filename)
            elif 'notifyUserId' in item_node.attrib:
                user = Specifyuser.objects.get(id=item_node.attrib['notifyUserId'])
                create_notification(user, filename)

        else:
            logger.info('No update needed: %s', filename)

def needs_update(path, days):
    try:
        mtime = os.path.getmtime(path)
    except OSError as e:
        if e.errno == errno.ENOENT:
            return True
        else:
            raise
    else:
        update_interval = 24*60*60 * days
        age = time.time() - mtime
        logger.debug("archive age: %s update interval: %s", age, update_interval)
        return age > update_interval

def create_notification(user, filename):
    Message.objects.create(user=user, content=json.dumps({
        'type': 'feed-item-updated',
        'file': filename
    }))
