from django.db.models import ProtectedError

from specifyweb.specify import models
from specifyweb.specify.tests.test_api import ApiTests
from ..exceptions import BusinessRuleException


class AccessionTests(ApiTests):
    def test_accession_number_unique_to_division(self):
        accession1 = models.Accession.objects.create(
            accessionnumber='a',
            division=self.division)

        with self.assertRaises(BusinessRuleException):
            accession2 = models.Accession.objects.create(
                accessionnumber='a',
                division=self.division)

        self.assertEqual(
            models.Accession.objects.filter(accessionnumber='a', division=self.division).count(),
            1)

        different_division = models.Division.objects.create(institution=self.institution)

        accession2 = models.Accession.objects.create(
            accessionnumber='a',
            division=different_division)

        accessions = models.Accession.objects.filter(accessionnumber='a')
        self.assertEqual(accessions.count(), 2)
        self.assertNotEqual(*[a.division for a in accessions])

    def test_no_delete_if_collection_objects_exist(self):
        accession = models.Accession.objects.create(
            accessionnumber='a',
            division=self.division)

        accession.collectionobjects.add(*self.collectionobjects)

        self.assertEqual(
            models.Collectionobject.objects.filter(
                id__in=[co.id for co in self.collectionobjects],
                accession=accession).count(),
            len(self.collectionobjects))

        with self.assertRaises(ProtectedError):
            accession.delete()

        accession.collectionobjects.clear()

        accession.delete()

        self.assertEqual(
            models.Collectionobject.objects.filter(id__in=[co.id for co in self.collectionobjects]).count(),
            len(self.collectionobjects))
