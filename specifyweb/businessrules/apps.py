import sys

from django.apps import AppConfig


class BussinessRuleConfig(AppConfig):
    name = "specifyweb.businessrules"

    def ready(self):
        from .uniqueness_rules import initialize_unique_rules
        if 'runserver' not in sys.argv:
            return

        initialize_unique_rules()
