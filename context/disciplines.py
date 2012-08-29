import os
from xml.etree import ElementTree

from django.conf import settings

disc_file = os.path.join(settings.SPECIFY_CONFIG_DIR, "disciplines.xml")

disciplines = ElementTree.parse(disc_file)

discipline_dirs = dict( (disc.attrib['name'], disc.attrib.get('folder', disc.attrib['name']))
    for disc in disciplines.findall('discipline') )
