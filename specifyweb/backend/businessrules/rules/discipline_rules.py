from specifyweb.businessrules.orm_signal_handler import orm_signal_handler
from specifyweb.specify.models import Taxontreedef
import re

@orm_signal_handler('pre_save', 'Discipline')
def create_taxontreedef_if_null(discipline):
    if discipline.id is not None:
        # only do this for new disciplines
        return
    if discipline.taxontreedef is None:
        # Get all Taxontreedef objects with names starting with 'Sample' followed by a number
        sample_taxontreedefs = Taxontreedef.objects.filter(name__regex=r'^Sample\d+$')
        max_number = 0
        for taxontreedef in sample_taxontreedefs:
            # Extract the number from the name
            number = int(re.search(r'\d+$', taxontreedef.name).group())
            max_number = max(max_number, number)
        
        # Create a new Taxontreedef with the incremented name
        new_number = max_number + 1
        discipline.taxontreedef = Taxontreedef.objects.create(
            name=f'Sample{new_number}')
