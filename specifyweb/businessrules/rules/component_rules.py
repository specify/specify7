
from specifyweb.businessrules.exceptions import BusinessRuleException
from specifyweb.businessrules.orm_signal_handler import orm_signal_handler
from specifyweb.specify.models import Component

@orm_signal_handler('pre_save', 'Component')
def component_pre_save(component):
     if component.parentcomponent is not None and not hasattr(component, "collectionobject"):
         component.collectionobject =  component.parentcomponent.collectionobject
         component.save()
         component.parentcomponent.children.add(component)
         component.parentcomponent.save()
         component.parentcomponent.collectionobject.components.add(component)
         component.parentcomponent.collectionobject.save()
 

