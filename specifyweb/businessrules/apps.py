from django.apps import AppConfig
from django.db.models.signals import post_migrate


class BussinessRuleConfig(AppConfig):
    name = "specifyweb.businessrules"

    def ready(self):
        from .uniqueness_rules import initialize_unique_rules

        post_migrate.connect(initialize_unique_rules, sender=self)
