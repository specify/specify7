from django.apps import apps as django_apps
from specifyweb.specify import models
from specifyweb.specify.migration_utils.migration_helpers.helper_0031_add_default_for_selectseries import make_selectseries_false

def test_make_selectseries_false_updates_only_null_smushed_values(self):
    null_query = models.Spquery.objects.create(
        name=f"Null Smushed {self.collection.id}",
        contextname="Collectionobject",
        contexttableid=models.Collectionobject.specify_model.tableId,
        specifyuser=self.specifyuser,
        smushed=None,
    )
    false_query = models.Spquery.objects.create(
        name=f"False Smushed {self.collection.id}",
        contextname="Collectionobject",
        contexttableid=models.Collectionobject.specify_model.tableId,
        specifyuser=self.specifyuser,
        smushed=False,
    )
    true_query = models.Spquery.objects.create(
        name=f"True Smushed {self.collection.id}",
        contextname="Collectionobject",
        contexttableid=models.Collectionobject.specify_model.tableId,
        specifyuser=self.specifyuser,
        smushed=True,
    )

    make_selectseries_false(django_apps)

    null_query.refresh_from_db()
    false_query.refresh_from_db()
    true_query.refresh_from_db()
    self.assertFalse(null_query.smushed)
    self.assertFalse(false_query.smushed)
    self.assertTrue(true_query.smushed)