import unittest
from unittest.mock import MagicMock

from specifyweb.specify.migration_utils.migration_helpers.helper_0002_schema_config_update import DEFAULT_COG_TYPES
from specifyweb.specify.migration_utils.migration_helpers.helper_0003_cotype_picklist import COT_PICKLIST_NAME

from ..default_cots import (
    create_default_collection_types,
    create_default_discipline_for_tree_defs,
    create_cogtype_type_picklist,
    create_cotype_picklist,
    set_discipline_for_taxon_treedefs,
    fix_taxon_treedef_discipline_links,
)


class CreateDefaultCollectionTypesTests(unittest.TestCase):
    def test_create_default_collection_types(self):
        apps = MagicMock()

        Collection = MagicMock()
        Collectionobject = MagicMock()
        Collectionobjecttype = MagicMock()

        apps.get_model.side_effect = [
            Collection,
            Collectionobject,
            Collectionobjecttype,
        ]

        discipline = MagicMock()
        discipline.name = "Botany"
        discipline.taxontreedef_id = 42

        collection = MagicMock()
        collection.discipline = discipline

        Collection.objects.filter.return_value = [collection]

        cot = MagicMock()
        Collectionobjecttype.objects.get_or_create.return_value = (cot, True)

        create_default_collection_types(apps)

        Collectionobjecttype.objects.get_or_create.assert_called_once_with(
            name="Botany",
            collection=collection,
            taxontreedef_id=42,
        )

        Collectionobject.objects.filter.assert_called_once_with(
            collection=collection
        )

        Collectionobject.objects.filter.return_value.update.assert_called_once_with(
            collectionobjecttype=cot
        )

        self.assertEqual(collection.collectionobjecttype, cot)
        collection.save.assert_called_once()


class CreateDefaultDisciplineForTreeDefsTests(unittest.TestCase):
    def test_assigns_missing_discipline_and_institution_links(self):
        apps = MagicMock()

        Discipline = MagicMock()
        Institution = MagicMock()

        apps.get_model.side_effect = [
            Discipline,
            Institution,
        ]

        geography = MagicMock(discipline_id=None)
        geology = MagicMock(discipline_id=None)
        litho = MagicMock(discipline_id=None)
        taxon = MagicMock(discipline_id=None)

        discipline = MagicMock()
        discipline.geographytreedef = geography
        discipline.geologictimeperiodtreedef = geology
        discipline.lithostrattreedef = litho
        discipline.taxontreedef = taxon

        Discipline.objects.all.return_value = [discipline]

        storage = MagicMock(institution_id=None)

        institution = MagicMock()
        institution.storagetreedef = storage

        Institution.objects.all.return_value = [institution]

        create_default_discipline_for_tree_defs(apps)

        self.assertEqual(geography.discipline, discipline)
        self.assertEqual(geology.discipline, discipline)
        self.assertEqual(litho.discipline, discipline)
        self.assertEqual(taxon.discipline, discipline)
        self.assertEqual(storage.institution, institution)

        geography.save.assert_called_once()
        geology.save.assert_called_once()
        litho.save.assert_called_once()
        taxon.save.assert_called_once()
        storage.save.assert_called_once()

    def test_skips_existing_links(self):
        apps = MagicMock()

        Discipline = MagicMock()
        Institution = MagicMock()

        apps.get_model.side_effect = [
            Discipline,
            Institution,
        ]

        geography = MagicMock(discipline_id=1)

        discipline = MagicMock()
        discipline.geographytreedef = geography
        discipline.geologictimeperiodtreedef = None
        discipline.lithostrattreedef = None
        discipline.taxontreedef = None

        Discipline.objects.all.return_value = [discipline]

        storage = MagicMock(institution_id=1)

        institution = MagicMock()
        institution.storagetreedef = storage

        Institution.objects.all.return_value = [institution]

        create_default_discipline_for_tree_defs(apps)

        geography.save.assert_not_called()
        storage.save.assert_not_called()


class CreateCogtypeTypePicklistTests(unittest.TestCase):
    def test_creates_default_picklist_items_when_picklist_created(self):
        apps = MagicMock()

        Collection = MagicMock()
        Picklist = MagicMock()
        Picklistitem = MagicMock()

        apps.get_model.side_effect = [
            Collection,
            Picklist,
            Picklistitem,
        ]

        collection = MagicMock()
        Collection.objects.all.return_value = [collection]

        picklist = MagicMock()
        Picklist.objects.get_or_create.return_value = (picklist, True)

        create_cogtype_type_picklist(apps)

        Picklist.objects.get_or_create.assert_called_once()

        self.assertEqual(
            Picklistitem.objects.get_or_create.call_count,
            len(DEFAULT_COG_TYPES),
        )

        for cog_type in DEFAULT_COG_TYPES:
            Picklistitem.objects.get_or_create.assert_any_call(
                title=cog_type,
                value=cog_type,
                picklist=picklist,
            )

    def test_does_not_create_items_when_picklist_exists(self):
        apps = MagicMock()

        Collection = MagicMock()
        Picklist = MagicMock()
        Picklistitem = MagicMock()

        apps.get_model.side_effect = [
            Collection,
            Picklist,
            Picklistitem,
        ]

        Collection.objects.all.return_value = [MagicMock()]

        Picklist.objects.get_or_create.return_value = (
            MagicMock(),
            False,
        )

        create_cogtype_type_picklist(apps)

        Picklistitem.objects.get_or_create.assert_not_called()


class CreateCotypePicklistTests(unittest.TestCase):
    def test_creates_picklist_for_each_collection(self):
        apps = MagicMock()

        Collection = MagicMock()
        Picklist = MagicMock()

        apps.get_model.side_effect = [
            Collection,
            Picklist,
        ]

        collections = [MagicMock(), MagicMock()]
        Collection.objects.all.return_value = collections

        create_cotype_picklist(apps)

        self.assertEqual(
            Picklist.objects.get_or_create.call_count,
            2,
        )

        for collection in collections:
            Picklist.objects.get_or_create.assert_any_call(
                name=COT_PICKLIST_NAME,
                type=1,
                tablename="collectionobjecttype",
                collection=collection,
                defaults={
                    "issystem": True,
                    "readonly": True,
                    "sizelimit": -1,
                    "sorttype": 1,
                    "formatter": COT_PICKLIST_NAME,
                },
            )


class SetDisciplineForTaxonTreedefsTests(unittest.TestCase):
    def test_updates_null_disciplines(self):
        apps = MagicMock()

        Collectionobjecttype = MagicMock()
        Taxontreedef = MagicMock()

        apps.get_model.side_effect = [
            Collectionobjecttype,
            Taxontreedef,
        ]

        qs = MagicMock()
        Taxontreedef.objects.filter.return_value = qs

        create_subquery_qs = MagicMock()
        Collectionobjecttype.objects.filter.return_value = create_subquery_qs

        (
            create_subquery_qs.order_by.return_value
            .values.return_value.__getitem__.return_value
        ) = MagicMock()

        set_discipline_for_taxon_treedefs(apps)

        Taxontreedef.objects.filter.assert_called_once_with(
            discipline__isnull=True
        )

        qs.update.assert_called_once()


class FixTaxonTreedefDisciplineLinksTests(unittest.TestCase):
    def test_updates_null_taxon_treedef_disciplines(self):
        apps = MagicMock()

        Discipline = MagicMock()
        Taxontreedef = MagicMock()

        apps.get_model.side_effect = [
            Discipline,
            Taxontreedef,
        ]

        qs = MagicMock()
        Taxontreedef.objects.filter.return_value = qs

        discipline_qs = MagicMock()
        Discipline.objects.filter.return_value = discipline_qs

        (
            discipline_qs.order_by.return_value
            .values.return_value.__getitem__.return_value
        ) = MagicMock()

        fix_taxon_treedef_discipline_links(apps)

        Taxontreedef.objects.filter.assert_called_once_with(
            discipline__isnull=True
        )

        qs.update.assert_called_once()