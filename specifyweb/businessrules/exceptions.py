from ..middleware.general import SpecifyExceptionWrapper
from typing import Dict
import traceback

class BusinessRuleException(SpecifyExceptionWrapper):
    
    def to_json(self) -> Dict:
        exception = self

        has_data = len(self.args) > 1
        data = self.args[1] if has_data else None

        result = {
            'exception' : exception.__class__.__name__,
            'message' : self.args[0],
            'data' : data,
            'traceback' : traceback.format_exc()
            }
        from ..specify import api
        return api.toJson(result)

class AbortSave(Exception):
    pass
