from ..middleware.general import SpecifyExceptionWrapper
from typing import Dict
import traceback

class BusinessRuleException(Exception):
    pass

class TreeBusinessRuleException(Exception):
    pass
    
class AbortSave(Exception):
    pass
