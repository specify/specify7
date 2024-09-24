import os
from zipfile import ZipFile

from django.conf import settings

specify_jar = ZipFile(os.path.join(settings.SPECIFY_THICK_CLIENT, 'config/specify.jar'))
