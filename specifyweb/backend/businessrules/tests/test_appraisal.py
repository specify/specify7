import datetime
from django.db.models import ProtectedError

from specifyweb.specify import models
from specifyweb.specify.tests.test_api import ApiTests
from ..exceptions import BusinessRuleException

class AppraisalTests(ApiTests):
    def test_delete_blocked_by_collection_objects(self):
        appraisal = models.Appraisal.objects.create(
            appraisaldate=datetime.date.today(),
            appraisalnumber='1',
            agent=self.agent)

        appraisal.collectionobjects.add(*self.collectionobjects)
        self.assertEqual(
            models.Collectionobject.objects.filter(appraisal=appraisal).count(),
            len(self.collectionobjects))

        with self.assertRaises(ProtectedError):
            appraisal.delete()

    def test_appraisal_number_is_unique_in_accession(self):
        accession = models.Accession.objects.create(
            accessionnumber='a',
            division=self.division)

        accession.appraisals.create(
            appraisaldate=datetime.date.today(),
            appraisalnumber='1',
            agent=self.agent)

        with self.assertRaises(BusinessRuleException):
            accession.appraisals.create(
                appraisaldate=datetime.date.today(),
                appraisalnumber='1',
                agent=self.agent)

        accession.appraisals.create(
            appraisaldate=datetime.date.today(),
            appraisalnumber='2',
            agent=self.agent)

    def test_appraisal_number_can_be_duped_if_not_in_accession(self):
        models.Appraisal.objects.create(
            appraisaldate=datetime.date.today(),
            appraisalnumber='1',
            agent=self.agent)

        models.Appraisal.objects.create(
            appraisaldate=datetime.date.today(),
            appraisalnumber='2',
            agent=self.agent)
