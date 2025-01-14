import logging
from django.core.management.base import BaseCommand
from django.apps import apps
from specifyweb.businessrules.exceptions import BusinessRuleException

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = "Create default COTS for the Specify database if they haven't been previously set."

    def handle(self, *args, **options):
        Collection = apps.get_model('specify', 'Collection')
        Collectionobject = apps.get_model('specify', 'Collectionobject')
        Collectionobjecttype = apps.get_model('specify', 'Collectionobjecttype')
        code_set = set(Collection.objects.all().values_list('code', flat=True))

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
                if 'Collection must have unique code in discipline' in str(e):
                    # May want to do something besides numbering, but users can edit if after the migrqation if they want.
                    i = 1
                    while True:
                        collection.code = f'{collection.code}-{i}'
                        i += 1
                        if collection.code not in code_set:
                            code_set.add(collection.code)
                            break
                    try:
                        collection.save()
                    except BusinessRuleException as e:
                        logger.warning(f'Problem saving collection {collection}: {e}')
                continue
