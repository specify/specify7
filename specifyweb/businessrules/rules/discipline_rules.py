from specifyweb.businessrules.orm_signal_handler import orm_signal_handler
from specifyweb.specify.models import Taxontreedef


@orm_signal_handler('pre_save', 'Discipline')
def create_taxontreedef_if_null(discipline):
    if discipline.id is not None:
        # only do this for new disciplines
        return
    if discipline.taxontreedef is None:
        discipline.taxontreedef = Taxontreedef.objects.create(
            name='Sample')
