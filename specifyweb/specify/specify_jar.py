import os
from zipfile import ZipFile

from django.conf import settings

DEFAULT_SPECIFY_JAR_PATH = '/opt/specify7/config/specify.jar'

try:
    specify_jar_path = os.path.join(settings.SPECIFY_THICK_CLIENT, 'config/specify.jar')
    specify_jar = ZipFile(specify_jar_path)
except (FileNotFoundError, KeyError):
    specify_jar = ZipFile(DEFAULT_SPECIFY_JAR_PATH)