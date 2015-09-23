from .orm_signal_handler import orm_signal_handler

@orm_signal_handler('pre_save', 'Workbench')
def fix_workbenchtemplate_name(workbench):
    workbench.workbenchtemplate.name = workbench.name
    workbench.workbenchtemplate.save(update_fields=['name'])
