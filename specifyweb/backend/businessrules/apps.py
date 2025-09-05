from django.apps import AppConfig


class BussinessRuleConfig(AppConfig):
    name = "specifyweb.backend.businessrules"

    def ready(self) -> None:
        import specifyweb.backend.businessrules.rules
