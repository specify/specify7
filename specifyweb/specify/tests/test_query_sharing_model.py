from django.db import IntegrityError, transaction

from specifyweb.backend.permissions.models import SpqueryShare
from specifyweb.specify import models
from specifyweb.specify.tests.test_api import ApiTests


class SpqueryShareTests(ApiTests):
    def test_recipient_can_have_only_one_grant_for_a_query(self):
        query = models.Spquery.objects.create(
            name=f"Shared query {self.collection.id}",
            contextname="Collectionobject",
            contexttableid=models.Collectionobject.specify_model.tableId,
            specifyuser=self.specifyuser,
        )

        self.assertEqual(query.share_grants.count(), 0)
        SpqueryShare.objects.create(query=query, recipient=self.specifyuser)

        with self.assertRaises(IntegrityError), transaction.atomic():
            SpqueryShare.objects.create(query=query, recipient=self.specifyuser)

        self.assertEqual(query.share_grants.count(), 1)

        other_query = models.Spquery.objects.create(
            name=f"Second shared query {self.collection.id}",
            contextname="Collectionobject",
            contexttableid=models.Collectionobject.specify_model.tableId,
            specifyuser=self.specifyuser,
        )
        SpqueryShare.objects.create(query=other_query, recipient=self.specifyuser)
        self.assertEqual(self.specifyuser.shared_query_grants.count(), 2)
