from unittest.mock import MagicMock, patch

from django.test import TestCase

from specifyweb.specify.migration_utils.migration_helpers import helper_0023_update_schema_config_text


class UpdateSchemaConfigTextTests(TestCase):

    def _setup_apps(self):
        Splocalecontainer = MagicMock()
        Splocalecontaineritem = MagicMock()
        Splocaleitemstr = MagicMock()
        Discipline = MagicMock()

        apps = MagicMock()

        def get_model(app_label, model_name):
            if model_name == "Splocalecontainer":
                return Splocalecontainer
            if model_name == "Splocalecontaineritem":
                return Splocalecontaineritem
            if model_name == "Splocaleitemstr":
                return Splocaleitemstr
            if model_name == "Discipline":
                return Discipline
            raise KeyError(model_name)

        apps.get_model.side_effect = get_model
        return apps, Splocalecontainer, Splocalecontaineritem, Splocaleitemstr, Discipline

    def test_update_schema_config_field_desc(self):
        apps, Splocalecontainer, Splocalecontaineritem, Splocaleitemstr, _ = self._setup_apps()

        container = MagicMock(id=1)
        item = MagicMock(id=10, name="guid")
        desc = MagicMock()
        name = MagicMock()

        Splocalecontainer.objects.filter.return_value = [container]
        Splocalecontaineritem.objects.filter.return_value = [item]

        def itemstr_filter(**kwargs):
            if kwargs == {"itemdesc_id": item.id}:
                return MagicMock(first=MagicMock(return_value=desc))
            if kwargs == {"itemname_id": item.id}:
                return MagicMock(first=MagicMock(return_value=name))
            return MagicMock(first=MagicMock(return_value=None))

        Splocaleitemstr.objects.filter.side_effect = itemstr_filter

        helper_0023_update_schema_config_text.update_schema_config_field_desc(apps)

        self.assertEqual(desc.text, "GUID")
        self.assertEqual(name.text, "GUID")
        desc.save.assert_called_once()
        name.save.assert_called_once()

    def test_reverse_update_schema_config_field_desc(self):
        apps, Splocalecontainer, Splocalecontaineritem, Splocaleitemstr, _ = self._setup_apps()

        container = MagicMock(id=1)
        item = MagicMock(id=10, name="cogType")
        desc = MagicMock()
        name = MagicMock()

        Splocalecontainer.objects.filter.return_value = [container]
        Splocalecontaineritem.objects.filter.return_value = [item]

        def itemstr_filter(**kwargs):
            if kwargs == {"itemdesc_id": item.id}:
                return MagicMock(first=MagicMock(return_value=desc))
            if kwargs == {"itemname_id": item.id}:
                return MagicMock(first=MagicMock(return_value=name))
            return MagicMock(first=MagicMock(return_value=None))

        Splocaleitemstr.objects.filter.side_effect = itemstr_filter

        helper_0023_update_schema_config_text.reverse_update_schema_config_field_desc(apps)

        self.assertEqual(desc.text, "cogType")
        self.assertEqual(name.text, "cogType")
        desc.save.assert_called_once()
        name.save.assert_called_once()

    @patch(
        "specifyweb.specify.migration_utils.migration_helpers.helper_0023_update_schema_config_text._schema_override_hidden_values_for_discipline"
    )
    @patch(
        "specifyweb.specify.migration_utils.migration_helpers.helper_0023_update_schema_config_text._fields_without_explicit_hidden_override"
    )
    def test_update_hidden_prop_hides_and_reconciles_duplicates(
        self,
        mock_fields_without_override,
        mock_schema_override,
    ):
        apps, Splocalecontainer, Splocalecontaineritem, Splocaleitemstr, Discipline = self._setup_apps()

        container = MagicMock(id=1, discipline_id=10)
        Splocalecontainer.objects.filter.return_value = [container]
        Discipline.objects.values_list.return_value = [(10, "bird")]

        mock_schema_override.return_value = {
            "absoluteage": {
                "yesno2": True,
                "date1": False,
            }
        }
        mock_fields_without_override.return_value = ["date2"]

        explicit_hide_qs = MagicMock()
        explicit_show_qs = MagicMock()
        implicit_hide_qs = MagicMock()
        duplicates_qs = MagicMock()
        duplicate_items_qs = MagicMock()
        duplicate_items_qs.first.return_value = MagicMock(id=99)
        duplicate_items_qs.exclude.return_value = MagicMock()

        def filter_side_effect(*args, **kwargs):
            if kwargs == {"container": container, "ishidden": False, "name__in": ["yesno2"]}:
                return explicit_hide_qs
            if kwargs == {"container": container, "ishidden": True, "name__in": ["date1"]}:
                return explicit_show_qs
            if kwargs == {"container": container, "ishidden": False, "name__in": ["date2"]}:
                implicit_hide_qs.update.return_value = 1
                return implicit_hide_qs
            if kwargs == {"container_id": container.id, "name": "guid"}:
                return duplicate_items_qs
            return MagicMock()

        Splocalecontaineritem.objects.filter.side_effect = filter_side_effect
        Splocalecontaineritem.objects.values.return_value.annotate.return_value.filter.return_value = [
            {"container": container.id, "name": "guid"}
        ]

        helper_0023_update_schema_config_text.update_hidden_prop(apps)

        explicit_hide_qs.update.assert_called_once_with(ishidden=True)
        explicit_show_qs.update.assert_called_once_with(ishidden=False)
        implicit_hide_qs.update.assert_called_once_with(ishidden=True)
        Splocaleitemstr.objects.filter.assert_any_call(itemdesc_id__in=duplicate_items_qs.exclude.return_value)
        Splocaleitemstr.objects.filter.assert_any_call(itemname_id__in=duplicate_items_qs.exclude.return_value)

    @patch(
        "specifyweb.specify.migration_utils.migration_helpers.helper_0023_update_schema_config_text._fields_without_explicit_hidden_override"
    )
    def test_reverse_update_hidden_prop_unhides_fields(self, mock_fields_without_override):
        apps, Splocalecontainer, Splocalecontaineritem, _, _ = self._setup_apps()

        container = MagicMock(id=1, discipline_id=10)
        Splocalecontainer.objects.filter.return_value = [container]
        mock_fields_without_override.return_value = ["date2"]

        unhiding_qs = MagicMock()

        def filter_side_effect(*args, **kwargs):
            if kwargs == {"container": container, "name__in": ["date2"]}:
                return unhiding_qs
            return MagicMock()

        Splocalecontaineritem.objects.filter.side_effect = filter_side_effect

        helper_0023_update_schema_config_text.reverse_update_hidden_prop(apps)

        unhiding_qs.update.assert_called_once_with(ishidden=False)
