from specifyweb.specify.models import (
    Collectionobjecttype,
    Discipline,
    Collection,
    Taxontreedef,
)
from specifyweb.specify.tests.test_api import ApiTests
from django.db.models import Q


# REFACTOR: This can create cyclical import issues
class TestMultipleTaxonTreeContext:

    def _create_multiple_taxon(self):
        taxontreedef_1 = Taxontreedef.objects.create(
            name="Test taxon1", discipline=self.discipline
        )

        self._update(self.discipline, dict(taxontreedef=taxontreedef_1))
        self._update(self.collectionobjecttype, dict(taxontreedef=taxontreedef_1))

        discipline_2 = Discipline.objects.create(
            geologictimeperiodtreedef=self.geologictimeperiodtreedef,
            geographytreedef=self.geographytreedef,
            division=self.division,
            datatype=self.datatype,
            type="paleobotany",
        )

        taxontreedef_2 = Taxontreedef.objects.create(
            name="Test taxon2", discipline=discipline_2
        )

        collection_2 = Collection.objects.create(
            catalognumformatname="test",
            collectionname="TestCollection2",
            isembeddedcollectingevent=False,
            discipline=discipline_2,
        )

        self._update(discipline_2, dict(taxontreedef=taxontreedef_2))

        Collectionobjecttype.objects.create(
            name="Test2", collection=collection_2, taxontreedef=taxontreedef_1
        )

        Taxontreedef.objects.filter(
            ~Q(id__in=[taxontreedef_1.id, taxontreedef_2.id])
        ).delete()

        return (collection_2, taxontreedef_1, taxontreedef_2)

    def _create_simple_taxon(self):
        Collectionobjecttype.objects.all().delete()

        discipline_2 = Discipline.objects.create(
            geologictimeperiodtreedef=self.geologictimeperiodtreedef,
            geographytreedef=self.geographytreedef,
            division=self.division,
            datatype=self.datatype,
            type="paleobotany",
        )

        collection_2 = Collection.objects.create(
            catalognumformatname="test",
            collectionname="TestCollection2",
            isembeddedcollectingevent=False,
            discipline=discipline_2,
        )

        taxontreedef_1 = Taxontreedef.objects.create(
            name="Test taxon1", discipline=self.discipline
        )

        self._update(self.discipline, dict(taxontreedef=taxontreedef_1))

        taxontreedef_2 = Taxontreedef.objects.create(
            name="Test taxon2", discipline=discipline_2
        )

        self._update(discipline_2, dict(taxontreedef=taxontreedef_2))

        return (collection_2, taxontreedef_1, taxontreedef_2)
