from django.core.management.base import BaseCommand
from django.apps import apps
from specifyweb.businessrules.exceptions import BusinessRuleException

class Command(BaseCommand):
    help = "Create default COTS for the Specify database if they haven't been previously set."

    Collection = apps.get_model('specify', 'Collection')
    Collectionobject = apps.get_model('specify', 'Collectionobject')
    Collectionobjecttype = apps.get_model('specify', 'Collectionobjecttype')
    # Create default collection types for each collection, named after the discipline
    for collection in Collection.objects.all():
        discipline = collection.discipline
        discipline_name = discipline.name
        cot, created = Collectionobjecttype.objects.get_or_create(
            name=discipline_name,
            collection=collection,
            taxontreedef_id=discipline.taxontreedef_id
        )
        # Update CollectionObjects' collectionobjecttype for the discipline
        Collectionobject.objects.filter(collection=collection).update(collectionobjecttype=cot)
        collection.collectionobjecttype = cot
        try:
            collection.save()
        except BusinessRuleException as e:
            if str(e) == 'Collection must have unique code in discipline':
                codes = Collection.objects.filter(code=collection.code).values_list('code', flat=True)
                i = 1
                # May want to do something besides numbering, but users can edit if after the migrqation if they want.
                while True:
                    collection.code = f'{collection.code}-{i}'
                    if collection.code not in codes:
                        break
                collection.save()
            continue