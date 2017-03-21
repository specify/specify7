import os
import time
import errno
import logging

from xml.etree import ElementTree as ET

from django.core.management.base import BaseCommand, CommandError
from django.conf import settings

from specifyweb.context.app_resource import get_app_resource
from specifyweb.specify.models import Specifyuser, Collection, Spappresourcedata

from specifyweb.export.dwca import make_dwca

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    def handle(self, *args, **kwargs):
        try:
            feed_resource = Spappresourcedata.objects.get(
                spappresource__name="ExportFeed",
                spappresource__spappresourcedir__usertype="Common",
                spappresource__spappresourcedir__discipline=None,
            )
        except Spappresourcedata.DoesNotExist:
            self.stdout.write(self.style.ERROR('No "ExportFeed" app resource found at Common level.'))
            return

        feed_dir = os.path.join(settings.DEPOSITORY_DIR, "export_feed")
        try:
            os.makedirs(feed_dir)
        except OSError as  e:
            if e.errno != errno.EEXIST:
                raise

        def_tree = ET.fromstring(feed_resource.data)
        for item_node in def_tree.findall('item'):
            filename = item_node.attrib['filename']
            temp_file = os.path.join(feed_dir, '%s.tmp.zip' % filename)
            path = os.path.join(feed_dir, filename)
            try:
                mtime = os.path.getmtime(path)
            except OSError as e:
                if e.errno != errno.ENOENT:
                    raise
            else:
                update_interval = 24*60*60 * int(item_node.attrib['days'])
                if time.time() - mtime < update_interval:
                    self.stdout.write(self.style.SUCCESS(
                        'No update needed: %s' % filename
                    ))
                    continue

            self.stdout.write('Generating: %s' % filename)
            collection = Collection.objects.get(id=item_node.attrib['collectionId'])
            user = Specifyuser.objects.get(id=item_node.attrib['userId'])
            dwca_def, _ = get_app_resource(collection, user, item_node.attrib['definition'])
            eml, _ = get_app_resource(collection, user, item_node.attrib['metadata'])
            make_dwca(collection, user, dwca_def, temp_file, eml=eml)
            os.rename(temp_file, path)
            self.stdout.write(self.style.SUCCESS(
                'Finished updating: %s' % filename
            ))

