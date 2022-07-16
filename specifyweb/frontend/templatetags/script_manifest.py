import json
import logging

from django import template

logger = logging.getLogger(__name__)
register = template.Library()


@register.simple_tag
def script_src(script):
    with open('./specifyweb/frontend/static/js/manifest.json') as file:
        manifest = json.load(file)
    src = manifest[script]
    logger.debug(f"found {src} for {script}")
    return src
