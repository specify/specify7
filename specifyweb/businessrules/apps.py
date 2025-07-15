from django.apps import AppConfig


class BussinessRuleConfig(AppConfig):
    name = "specifyweb.businessrules"

    def ready(self) -> None:
        import specifyweb.businessrules.rules
