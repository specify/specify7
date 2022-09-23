from typing import Dict

class BusinessRuleException(Exception):
    http_status = 400

    def to_json(self) -> Dict:
        return {'BusinessRuleException': self.args[0]}


class AbortSave(Exception):
    pass
