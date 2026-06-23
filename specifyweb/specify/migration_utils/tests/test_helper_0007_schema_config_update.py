from django.test import TestCase
from unittest.mock import patch, MagicMock

from specifyweb.specify.migration_utils.migration_helpers import helper_0007_schema_config_update

class UpdateCogTypeFieldsTests(TestCase):

    @patch(
        "specifyweb.specify.migration_utils.migration_helpers.helper_0007_schema_config_update.revert_table_field_schema_config"
    )
    @patch(
        "specifyweb.specify.migration_utils.migration_helpers.helper_0007_schema_config_update.update_table_field_schema_config_with_defaults"
    )
    def test_update_cog_type_fields(
        self,
        mock_update,
        mock_revert,
    ):
        mock_apps = MagicMock()

        discipline_model = MagicMock()
        containeritem_model = MagicMock()
        itemstr_model = MagicMock()

        discipline_model.objects.all.return_value = [
            MagicMock(id=1),
            MagicMock(id=2),
        ]

        container_qs = MagicMock()
        container_qs.__iter__.return_value = [
            MagicMock(),
            MagicMock(),
        ]

        containeritem_model.objects.filter.return_value = container_qs

        def get_model(app_label, model_name):
            return {
                "Discipline": discipline_model,
                "Splocalecontaineritem": containeritem_model,
                "Splocaleitemstr": itemstr_model,
            }[model_name]

        mock_apps.get_model.side_effect = get_model

        helper_0007_schema_config_update.update_cog_type_fields(mock_apps)

        mock_revert.assert_any_call(
            "CollectionObjectGroup",
            "children",
            mock_apps,
        )

        mock_revert.assert_any_call(
            "CollectionObjectGroup",
            "cojo",
            mock_apps,
        )

        itemstr_model.objects.filter.assert_called()
        container_qs.delete.assert_called_once()

class CreateCogTypePicklistTests(TestCase):

    def test_create_cogtype_picklist(self):
        mock_apps = MagicMock()

        collection_model = MagicMock()
        picklist_model = MagicMock()

        collection_model.objects.all.return_value = [
            MagicMock(),
            MagicMock(),
        ]

        def get_model(app_label, model_name):
            return {
                "Collection": collection_model,
                "Picklist": picklist_model,
            }[model_name]

        mock_apps.get_model.side_effect = get_model

        helper_0007_schema_config_update.create_cogtype_picklist(mock_apps)

        self.assertEqual(
            picklist_model.objects.update_or_create.call_count,
            2,
        )

class RevertCogTypePicklistTests(TestCase):

    def test_revert_cogtype_picklist(self):
        mock_apps = MagicMock()

        picklist_model = MagicMock()

        mock_apps.get_model.return_value = picklist_model

        helper_0007_schema_config_update.revert_cogtype_picklist(mock_apps)

        picklist_model.objects.filter.return_value.delete.assert_called_once()

class UpdateCogTypeSplocaleContainerItemTests(TestCase):

    def test_update_cogtype_splocalecontaineritem(self):
        mock_apps = MagicMock()

        model = MagicMock()
        mock_apps.get_model.return_value = model

        helper_0007_schema_config_update.update_cogtype_splocalecontaineritem(
            mock_apps
        )

        model.objects.filter.return_value.update.assert_called_once_with(
            picklistname=helper_0007_schema_config_update.COG_PICKLIST_NAME,
            type="ManyToOne",
            isrequired=True,
        )

class UpdateSystemCogTypesPicklistTests(TestCase):

    def test_update_systemcogtypes_picklist(self):
        mock_apps = MagicMock()

        model = MagicMock()
        mock_apps.get_model.return_value = model

        helper_0007_schema_config_update.update_systemcogtypes_picklist(
            mock_apps
        )

        model.objects.filter.return_value.update.assert_called_once()