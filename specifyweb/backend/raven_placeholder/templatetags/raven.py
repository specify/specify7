from django import template

register = template.Library()

@register.tag
def sentry_public_dsn(parser, token):
    return template.Node()
