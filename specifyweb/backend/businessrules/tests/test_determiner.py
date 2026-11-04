from datetime import datetime
from unittest import skipUnless
from specifyweb.specify import models
from specifyweb.specify.tests.test_api import ApiTests
from ..exceptions import BusinessRuleException

class DeterminerTests(ApiTests):
    @skipUnless(hasattr(models, 'Determiner'), "Determiner table added in 6.8.02")
    def test_determination_date_type_and_remarks(self):
        determined_date = datetime(2025, 6, 15, 12, 30)
        determination = models.Determination.objects.create(
            collectionobject=self.collectionobjects[0],
            collectionmemberid=self.collection.id,
            determineddate=determined_date,
            typestatusname="Holotype",
            remarks="Verified by unit test",
            iscurrent=True,
        )

        fetched_determination = models.Determination.objects.get(id=determination.id)
        self.assertEqual(fetched_determination.determineddate, determined_date)
        self.assertEqual(fetched_determination.typestatusname, "Holotype")
        self.assertEqual(fetched_determination.remarks, "Verified by unit test")

    @skipUnless(hasattr(models, 'Determiner'), "Determiner table added in 6.8.02")
    def test_add_existing_agent_as_determiner(self):
        determination = models.Determination.objects.create(
            collectionobject=self.collectionobjects[0],
            collectionmemberid=self.collection.id,
            iscurrent=True,
        )

        determiner = determination.determiners.create(
            isprimary=True,
            ordernumber=0,
            agent=self.agent,
        )
        fetched_determiner = determination.determiners.get(id=determiner.id)
        self.assertEqual(fetched_determiner.agent_id, self.agent.id)

    @skipUnless(hasattr(models, 'Determiner'), "Determiner table added in 6.8.02")
    def test_agent_unique_in_determination(self):
        determination = models.Determination.objects.create(
            collectionobject=self.collectionobjects[0],
            collectionmemberid=self.collection.id,
            iscurrent=True,
        )

        determination.determiners.create(
            isprimary=True,
            ordernumber=0,
            agent=self.agent)

        with self.assertRaises(BusinessRuleException):
            determination.determiners.create(
                isprimary=False,
                ordernumber=1,
                agent=self.agent)
