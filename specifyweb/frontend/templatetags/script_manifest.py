import json
from os import path

from django import template

with open(path.join(path.dirname(__file__), "..", "static", "js", "manifest.json")) as f:
    manifest = json.load(f)

register = template.Library()

@register.simple_tag
def script_src(script):
    return manifest[script]
