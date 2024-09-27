import os
from zipfile import ZipFile

from django.conf import settings

DEFAULT_SPECIFY_JAR_PATH = '/opt/specify7/config/specify.jar'

def find_jar(filename='specify.jar', search_dir='/'):
    for root, dirs, files in os.walk(search_dir):
        if filename in files:
            return os.path.join(root, filename)
    return None

try:
    specify_jar_path = os.path.join(settings.SPECIFY_THICK_CLIENT, 'config/specify.jar')
    specify_jar = ZipFile(specify_jar_path)
except (FileNotFoundError, KeyError):
    found_jar_path = find_jar()
    if found_jar_path:
        specify_jar = ZipFile(found_jar_path)
    else:
        # Fall back to default path if the file is not found
        specify_jar = ZipFile(DEFAULT_SPECIFY_JAR_PATH)