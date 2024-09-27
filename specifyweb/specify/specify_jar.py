import os
from django.conf import settings

DEFAULT_SPECIFY_JAR_PATH = '/opt/specify7/config/specify_jar_dir'

# Determine the path to the specify_jar directory
specify_jar_dir_path = os.path.join(settings.SPECIFY_THICK_CLIENT, 'config/specify_jar_dir')

# If specify_jar_dir_path does not exist, then use DEFAULT_SPECIFY_JAR_PATH
if not os.path.exists(specify_jar_dir_path):
    specify_jar_dir_path = DEFAULT_SPECIFY_JAR_PATH

# Path to the resources_en.properties file
resources_en_properties_path = os.path.join(specify_jar_dir_path, 'resources_en.properties')

# Read the file into a string
with open(resources_en_properties_path, 'r', encoding='utf-8') as file:
    specify_jar_resources_en_properties = file.read()