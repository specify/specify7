import logging
from django import template

from ..static.js.manifest import manifest

logger = logging.getLogger(__name__)

register = template.Library()

@register.simple_tag
def script_src(script):
    src = manifest[script]
    logger.debug(f"found {src} for {script}")
    return src
