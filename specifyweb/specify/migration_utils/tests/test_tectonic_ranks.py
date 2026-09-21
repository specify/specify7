import unittest
from unittest.mock import MagicMock, call, patch

from ..tectonic_ranks import (
    DEFAULT_RANKS,
    create_default_tectonic_ranks,
    create_root_tectonic_node,
    _create_tectonic_unit_for_discipline,
    fix_tectonic_unit_treedef_discipline_links,
)


class CreateDefaultTectonicRanksTests(unittest.TestCase):
    @patch(
        "specifyweb.specify.migration_utils.tectonic_ranks._create_tectonic_unit_for_discipline"
    )
    def test_creates_default_ranks_for_trees_missing_ranks(
        self, mock_create_tectonic_units
    ):
        apps = MagicMock()

        TectonicUnitTreeDefItem = MagicMock()
        TectonicTreeDef = MagicMock()
        Discipline = MagicMock()

        apps.get_model.side_effect = [
            TectonicUnitTreeDefItem,
            TectonicTreeDef,
            Discipline,
        ]

        tree1 = MagicMock()
        tree2 = MagicMock()

        TectonicTreeDef.objects.filter.return_value = [tree1, tree2]

        parent_node = MagicMock()
        TectonicUnitTreeDefItem.objects.get_or_create.return_value = (
            parent_node,
            True,
        )

        create_default_tectonic_ranks(apps)

        mock_create_tectonic_units.assert_called_once_with(
            Discipline_Model=Discipline,
            Tectonicunittreedef_Model=TectonicTreeDef,
        )

        expected_calls = []
        for tree in [tree1, tree2]:
            parent = None
            for rank in DEFAULT_RANKS:
                expected_calls.append(
                    call(
                        rankid=rank["rankid"],
                        parent=parent,
                        treedef=tree,
                        defaults={
                            "name": rank["name"],
                            "title": rank["name"],
                            **rank.get("attrs", {}),
                        },
                    )
                )
                parent = parent_node

        self.assertEqual(
            TectonicUnitTreeDefItem.objects.get_or_create.call_count,
            len(DEFAULT_RANKS) * 2,
        )
        TectonicUnitTreeDefItem.objects.get_or_create.assert_has_calls(
            expected_calls,
            any_order=False,
        )

    @patch(
        "specifyweb.specify.migration_utils.tectonic_ranks._create_tectonic_unit_for_discipline"
    )
    def test_no_rank_creation_when_no_trees_missing_ranks(
        self, mock_create_tectonic_units
    ):
        apps = MagicMock()

        TectonicUnitTreeDefItem = MagicMock()
        TectonicTreeDef = MagicMock()
        Discipline = MagicMock()

        apps.get_model.side_effect = [
            TectonicUnitTreeDefItem,
            TectonicTreeDef,
            Discipline,
        ]

        TectonicTreeDef.objects.filter.return_value = []

        create_default_tectonic_ranks(apps)

        TectonicUnitTreeDefItem.objects.get_or_create.assert_not_called()


class CreateRootTectonicNodeTests(unittest.TestCase):
    @patch(
        "specifyweb.specify.migration_utils.tectonic_ranks.logger"
    )
    def test_creates_root_node_for_missing_trees(self, mock_logger):
        apps = MagicMock()

        TectonicUnit = MagicMock()
        TectonicUnitTreeDefItem = MagicMock()
        TectonicUnitTreeDef = MagicMock()

        apps.get_model.side_effect = [
            TectonicUnit,
            TectonicUnitTreeDefItem,
            TectonicUnitTreeDef,
        ]

        tree1 = MagicMock()
        tree1.discipline_id = 101

        tree2 = MagicMock()
        tree2.discipline_id = 202

        annotated_qs = MagicMock()
        annotated_qs.filter.return_value = [tree1, tree2]

        TectonicUnitTreeDef.objects.annotate.return_value = annotated_qs

        root_rank = MagicMock()
        TectonicUnitTreeDefItem.objects.get_or_create.return_value = (
            root_rank,
            True,
        )

        create_root_tectonic_node(apps)

        self.assertEqual(
            TectonicUnitTreeDefItem.objects.get_or_create.call_count,
            2,
        )

        self.assertEqual(
            TectonicUnit.objects.create.call_count,
            2,
        )

        TectonicUnit.objects.create.assert_any_call(
            name="Root",
            fullname="Root",
            isaccepted=1,
            nodenumber=1,
            rankid=0,
            parent=None,
            definition=tree1,
            definitionitem=root_rank,
        )

        TectonicUnit.objects.create.assert_any_call(
            name="Root",
            fullname="Root",
            isaccepted=1,
            nodenumber=1,
            rankid=0,
            parent=None,
            definition=tree2,
            definitionitem=root_rank,
        )

        self.assertEqual(mock_logger.info.call_count, 2)

        TectonicUnitTreeDefItem.objects.filter.assert_called_once_with(
            parent=None,
            rankid=0,
            isenforced__isnull=True,
        )

        TectonicUnitTreeDefItem.objects.filter.return_value.update.assert_called_once_with(
            isenforced=True
        )

    def test_no_missing_root_nodes_still_updates_isenforced(self):
        apps = MagicMock()

        TectonicUnit = MagicMock()
        TectonicUnitTreeDefItem = MagicMock()
        TectonicUnitTreeDef = MagicMock()

        apps.get_model.side_effect = [
            TectonicUnit,
            TectonicUnitTreeDefItem,
            TectonicUnitTreeDef,
        ]

        annotated_qs = MagicMock()
        annotated_qs.filter.return_value = []

        TectonicUnitTreeDef.objects.annotate.return_value = annotated_qs

        create_root_tectonic_node(apps)

        TectonicUnit.objects.create.assert_not_called()

        TectonicUnitTreeDefItem.objects.filter.return_value.update.assert_called_once_with(
            isenforced=True
        )


class CreateTectonicUnitForDisciplineTests(unittest.TestCase):
    def test_creates_missing_tree_defs_and_updates_discipline_links(self):
        Discipline_Model = MagicMock()
        TectonicTreeDef_Model = MagicMock()

        missing_disciplines = [1, 2, 3]

        first_filter = MagicMock()
        first_filter.values_list.return_value = missing_disciplines

        second_filter = MagicMock()

        Discipline_Model.objects.filter.side_effect = [
            first_filter,
            second_filter,
        ]

        _create_tectonic_unit_for_discipline(
            Discipline_Model=Discipline_Model,
            Tectonicunittreedef_Model=TectonicTreeDef_Model,
        )

        TectonicTreeDef_Model.objects.bulk_create.assert_called_once()

        bulk_create_args = (
            TectonicTreeDef_Model.objects.bulk_create.call_args.args[0]
        )

        self.assertEqual(len(bulk_create_args), 3)

        TectonicTreeDef_Model.objects.bulk_create.assert_called_once_with(
            bulk_create_args,
            batch_size=1000,
        )

        second_filter.update.assert_called_once()

    def test_handles_no_missing_disciplines(self):
        Discipline_Model = MagicMock()
        TectonicTreeDef_Model = MagicMock()

        first_filter = MagicMock()
        first_filter.values_list.return_value = []

        second_filter = MagicMock()

        Discipline_Model.objects.filter.side_effect = [
            first_filter,
            second_filter,
        ]

        _create_tectonic_unit_for_discipline(
            Discipline_Model=Discipline_Model,
            Tectonicunittreedef_Model=TectonicTreeDef_Model,
        )

        TectonicTreeDef_Model.objects.bulk_create.assert_called_once()

        created_objects = (
            TectonicTreeDef_Model.objects.bulk_create.call_args.args[0]
        )

        self.assertEqual(created_objects, [])


class FixTectonicUnitTreeDefDisciplineLinksTests(unittest.TestCase):
    @patch(
        "specifyweb.specify.migration_utils.tectonic_ranks._create_tectonic_unit_for_discipline"
    )
    def test_updates_null_discipline_links(self, mock_create):
        apps = MagicMock()

        Discipline = MagicMock()
        TectonicTreeDef = MagicMock()

        apps.get_model.side_effect = [
            Discipline,
            TectonicTreeDef,
        ]

        qs = MagicMock()
        TectonicTreeDef.objects.filter.return_value = qs

        fix_tectonic_unit_treedef_discipline_links(apps)

        mock_create.assert_called_once_with(
            Discipline_Model=Discipline,
            Tectonicunittreedef_Model=TectonicTreeDef,
        )

        TectonicTreeDef.objects.filter.assert_called_once_with(
            discipline__isnull=True,
            disciplines__isnull=False,
        )

        qs.update.assert_called_once()