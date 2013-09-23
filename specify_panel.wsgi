# -*- python -*-
import os, sys

specifypanel_dir = os.path.join(os.path.dirname(__file__), 'specifypanel')

os.chdir(specifypanel_dir)
sys.path.append(specifypanel_dir)

import bottle
import specifypanel
application = bottle.default_app()
bottle.debug(True)
