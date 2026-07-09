import unittest
from unittest.mock import MagicMock, Mock, call, patch

from specifyweb.specify.migration_utils.deduplication import (
    deduplicate_schema_config_sql,
    deduplicate_splocalecontainers,
    deduplicate_containeritems_and_strings,
    deduplicate_schema_config_orm,
)


class DeduplicateSchemaConfigSqlTests(unittest.TestCase):

    @patch(
        "specifyweb.specify.migration_utils.deduplication.connection.cursor"
    )
    def test_executes_sql_and_closes_cursor(self, mock_cursor_factory):
        mock_cursor = MagicMock()
        mock_cursor_factory.return_value = mock_cursor

        deduplicate_schema_config_sql()

        mock_cursor.execute.assert_called_once()

        sql = mock_cursor.execute.call_args[0][0]

        self.assertIn(
            "CREATE TEMPORARY TABLE container_items_to_delete",
            sql,
        )
        self.assertIn(
            "DELETE FROM splocalecontaineritem",
            sql,
        )

        mock_cursor.close.assert_called_once()


class DeduplicateSpLocaleContainersTests(unittest.TestCase):

    @patch(
        "specifyweb.specify.migration_utils.deduplication.transaction.atomic"
    )
    def test_removes_duplicate_containers_and_related_records(
        self,
        mock_atomic,
    ):
        apps = Mock()

        Container = MagicMock()
        ContainerItem = MagicMock()
        ItemStr = MagicMock()

        apps.get_model.side_effect = [
            Container,
            ContainerItem,
            ItemStr,
        ]

        duplicate_containers = MagicMock(name="duplicate_containers")
        duplicate_items = MagicMock(name="duplicate_items")

        (
            Container.objects.filter.return_value
            .annotate.return_value
            .filter.return_value
        ) = duplicate_containers

        ContainerItem.objects.filter.return_value = duplicate_items

        deduplicate_splocalecontainers(apps)

        Container.objects.filter.assert_any_call(
            schematype=0
        )

        ContainerItem.objects.filter.assert_called_once_with(
            container__in=duplicate_containers
        )

        self.assertEqual(
            ItemStr.objects.filter.call_args_list,
            [
                call(itemname__in=duplicate_items),
                call(itemdesc__in=duplicate_items),
                call(containername__in=duplicate_containers),
                call(containerdesc__in=duplicate_containers),
            ],
        )

        duplicate_items.delete.assert_called_once()
        duplicate_containers.delete.assert_called_once()

        self.assertEqual(
            ItemStr.objects.filter.return_value.delete.call_count,
            4,
        )


class DeduplicateContainerItemsAndStringsTests(unittest.TestCase):

    @patch(
        "specifyweb.specify.migration_utils.deduplication.transaction.atomic"
    )
    @patch(
        "specifyweb.specify.migration_utils.deduplication.print"
    )
    def test_deletes_duplicate_items_and_strings(
        self,
        mock_print,
        mock_atomic,
    ):
        apps = Mock()

        ContainerItem = MagicMock()
        ItemStr = MagicMock()

        apps.get_model.side_effect = [
            ContainerItem,
            ItemStr,
        ]

        item1 = Mock(id=1, rn=1)
        item2 = Mock(id=2, rn=2)
        item3 = Mock(id=3, rn=3)

        ContainerItem.objects.filter.return_value.annotate.return_value = [
            item1,
            item2,
            item3,
        ]

        deduplicate_containeritems_and_strings(apps)

        ItemStr.objects.filter.assert_any_call(
            itemname_id__in=[2, 3]
        )
        ItemStr.objects.filter.assert_any_call(
            itemdesc_id__in=[2, 3]
        )

        ContainerItem.objects.filter.assert_any_call(
            id__in=[2, 3]
        )

        self.assertEqual(
            ItemStr.objects.filter.return_value.delete.call_count,
            2,
        )

        ContainerItem.objects.filter.return_value.delete.assert_called_once()

        mock_print.assert_called_once_with(
            "Successfully deleted 2 duplicate schema items."
        )

    @patch(
        "specifyweb.specify.migration_utils.deduplication.transaction.atomic"
    )
    @patch(
        "specifyweb.specify.migration_utils.deduplication.print"
    )
    def test_no_duplicates_found(
        self,
        mock_print,
        mock_atomic,
    ):
        apps = Mock()

        ContainerItem = MagicMock()
        ItemStr = MagicMock()

        apps.get_model.side_effect = [
            ContainerItem,
            ItemStr,
        ]

        ContainerItem.objects.filter.return_value.annotate.return_value = [
            Mock(id=1, rn=1),
        ]

        deduplicate_containeritems_and_strings(apps)

        self.assertFalse(
            any(
                kwargs.get("id__in") is not None
                for _, kwargs
                in ContainerItem.objects.filter.call_args_list
            )
        )

        self.assertEqual(
            ItemStr.objects.filter.return_value.delete.call_count,
            0,
        )

        mock_print.assert_called_once_with(
            "No duplicates found."
        )


class DeduplicateSchemaConfigOrmTests(unittest.TestCase):

    @patch(
        "specifyweb.specify.migration_utils.deduplication.transaction.atomic"
    )
    @patch(
        "specifyweb.specify.migration_utils.deduplication.deduplicate_containeritems_and_strings"
    )
    @patch(
        "specifyweb.specify.migration_utils.deduplication.deduplicate_splocalecontainers"
    )
    def test_calls_both_dedupe_steps(
        self,
        mock_container_dedupe,
        mock_item_dedupe,
        mock_atomic,
    ):
        apps = Mock()

        deduplicate_schema_config_orm(apps)

        mock_container_dedupe.assert_called_once_with(apps)
        mock_item_dedupe.assert_called_once_with(apps)