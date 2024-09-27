from django.conf import settings
from django.utils.translation import gettext as _
from xml.etree import ElementTree
import os
import re

from .specify_jar import specify_jar_resources_en_properties

def check_versions(Spversion):
    """Check schema and application version compatibility."""
    SPECIFY_VERSION = re.findall(r'SPECIFY_VERSION=(.*)',
                                 specify_jar_resources_en_properties)[0]

    SCHEMA_VERSION = ElementTree.parse(os.path.join(settings.SPECIFY_CONFIG_DIR, 'schema_version.xml')).getroot().text

    if not settings.TESTING:
        spversion = Spversion.objects.get()
        assert spversion.appversion == SPECIFY_VERSION and spversion.schemaversion == SCHEMA_VERSION, _(
               "Specify version: %(specify_version)s, Schema Version: "
               "%(schema_version)s do not match database values: "
               "%(app_specify_version)s, %(app_schema_version)s\n"
               "Please update and/or run the host thickclient installation "
               "at %(thick_client_location)s to update the database.") % {
                   'specify_version': SPECIFY_VERSION,
                   'schema_version': SCHEMA_VERSION,
                   'app_specify_version': spversion.appversion,
                   'app_schema_version': spversion.schemaversion,
                   'thick_client_location': settings.SPECIFY_THICK_CLIENT
               }
