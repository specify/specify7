import os
from zipfile import ZipFile, BadZipFile

from django.conf import settings

DEFAULT_SPECIFY_JAR_PATHS = [
    '/opt/Specify/config/specify.jar',
    '/opt/specify7/config/specify.jar'
]

def find_jar(filename='specify.jar', search_dirs=['/']):
    for search_dir in search_dirs:
        for root, dirs, files in os.walk(search_dir):
            if filename in files:
                return os.path.join(root, filename)
    return None

def open_jar(paths):
    for path in paths:
        try:
            return ZipFile(path)
        except (FileNotFoundError, KeyError, BadZipFile):
            continue
    return None

# Main logic
specify_jar_paths = [
    os.path.join(settings.SPECIFY_THICK_CLIENT, 'config/specify.jar')
]

# Add found jar path if any
found_jar_path = find_jar()
if found_jar_path:
    specify_jar_paths.append(found_jar_path)

# Add default paths
specify_jar_paths.extend(DEFAULT_SPECIFY_JAR_PATHS)

# Open the jar file
specify_jar = open_jar(specify_jar_paths)

if specify_jar is None:
    raise FileNotFoundError("Specify JAR file not found in any of the specified paths.")