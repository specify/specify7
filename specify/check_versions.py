from django.conf import settings
from xml.etree import ElementTree
import os
import re

from specify_jar import specify_jar

def check_versions(Spversion):
    """Check schema and application version compatibility."""
    SPECIFY_VERSION = re.findall(r'SPECIFY_VERSION=(.*)',
                                 specify_jar.read('resources_en.properties'))[0]

    SCHEMA_VERSION = ElementTree.parse(os.path.join(settings.SPECIFY_CONFIG_DIR, 'schema_version.xml')).getroot().text

    if not settings.TESTING:
        spversion = Spversion.objects.get()
        assert spversion.appversion == SPECIFY_VERSION and spversion.schemaversion == SCHEMA_VERSION, """
               Specify version: %s, Schema Version: %s do not match database values: %s, %s
               Please update and/or run the host thickclient installation at %s
               to update the database.""" % (
               SPECIFY_VERSION, SCHEMA_VERSION, spversion.appversion, spversion.schemaversion,
               settings.SPECIFY_THICK_CLIENT)
