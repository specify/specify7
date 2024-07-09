from specifyweb.businessrules.orm_signal_handler import orm_signal_handler

COG_TYPE_NAMES = {
    'microscope slide', 
    'whole rock',
    'piece of bark'
}

COG_TYPE_TYPES = {
    'discrete',
    'consolidated',
    'drill core'
}

@orm_signal_handler('pre_save', 'CollectionObjectGroupType')
def cogtype_pre_save(cog_type):
    if cog_type.name not in COG_TYPE_NAMES:
        raise ValueError(f'Invalid cog type name: {cog_type.name}')
    if cog_type.type not in COG_TYPE_TYPES:
        raise ValueError(f'Invalid cog type type: {cog_type.type}')
