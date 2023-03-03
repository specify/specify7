from ..middleware.general import SpecifyExceptionWrapper

class BusinessRuleException(Exception):
    pass

class TreeBusinessRuleException(Exception):
    pass
    
class AbortSave(Exception):
    pass
