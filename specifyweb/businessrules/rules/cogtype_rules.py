from math import pi
from specifyweb.businessrules.exceptions import BusinessRuleException
from specifyweb.businessrules.orm_signal_handler import orm_signal_handler
from specifyweb.specify.models import Picklist, Picklistitem

@orm_signal_handler('pre_save', 'CollectionObjectGroupType')
def cogtype_pre_save(cog_type):

    # Ensure the cog_type type is validated by being the picklist.
    # NOTE: Maybe add constraint on the cog_type name in the future.
    default_cog_types_picklist = Picklist.objects.get(
        name="Default Collection Object Group Types",
        tablename="collectionobjectgrouptype",
        collection=cog_type.collection
    )
    if Picklistitem.objects.filter(picklist=default_cog_types_picklist, value=cog_type.type).count() == 0:
        raise BusinessRuleException(f'Invalid cog type: {cog_type.type}')
