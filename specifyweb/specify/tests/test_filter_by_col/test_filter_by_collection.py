from specifyweb.specify.filter_by_col import HierarchyException, filter_by_collection
from specifyweb.backend.datamodel.models import (
    Attachment,
    Collection,
    Determination,
    Discipline,
    Disposal,
    Geography,
    Taxontreedefitem,
    Taxon,
)
from specifyweb.specify.scoping import ScopeType
from specifyweb.specify.tests.test_trees import GeographyTree


class TestFilterByCollection(GeographyTree):

    def test_attachment(self):

        collection_2 = Collection.objects.create(
            catalognumformatname="test",
            collectionname="TestCollection2",
            isembeddedcollectingevent=False,
            discipline=self.discipline,
        )

        discipline_2 = Discipline.objects.create(
            geologictimeperiodtreedef=self.geologictimeperiodtreedef,
            geographytreedef=self.geographytreedef,
            division=self.division,
            datatype=self.datatype,
            type="paleobotany",
        )

        attachment_1 = Attachment.objects.create(scopetype=None)

        attachment_2 = Attachment.objects.create(
            scopetype=ScopeType.COLLECTION, scopeid=self.collection.id
        )
        attachment_3 = Attachment.objects.create(
            scopetype=ScopeType.COLLECTION, scopeid=collection_2.id
        )

        attachment_4 = Attachment.objects.create(
            scopetype=ScopeType.DISCIPLINE, scopeid=self.discipline.id
        )
        attachment_5 = Attachment.objects.create(
            scopetype=ScopeType.DISCIPLINE, scopeid=discipline_2.id
        )

        queryset = filter_by_collection(Attachment.objects.all(), self.collection)

        self.assertCountEqual(
            queryset.values_list("id", flat=True),
            [attachment_1.id, attachment_2.id, attachment_4.id],
        )

    def test_geography(self):

        queryset = filter_by_collection(Geography.objects.all(), self.collection)
        self.assertEqual(queryset.count(), 13)

    def test_taxon(self):
        life = self.make_taxontree("Life", "Taxonomy Root")
        self.make_taxontree("Plantae", "Kingdom", parent=life)

        queryset = filter_by_collection(Taxon.objects.all(), self.collection)
        self.assertEqual(queryset.count(), 0)

        self.taxontreedef.discipline = self.discipline
        self.taxontreedef.save()

        queryset = filter_by_collection(Taxon.objects.all(), self.collection)
        self.assertEqual(queryset.count(), 2)

    def test_disposal_strict(self):
        with self.assertRaises(HierarchyException) as context:
            queryset = filter_by_collection(Disposal.objects.all(), self.collection)

        self.assertTrue(
            "queryset model Disposal has no hierarchy field" in str(context.exception)
        )

    def test_disposal_not_strict(self):

        disp_id = Disposal.objects.create()

        queryset = filter_by_collection(Disposal.objects.all(), self.collection, False)

        self.assertCountEqual([disp_id.id], queryset.values_list("id", flat=True))

    def test_collection_object_scope(self):
        collection_2 = Collection.objects.create(
            catalognumformatname="test",
            collectionname="TestCollection2",
            isembeddedcollectingevent=False,
            discipline=self.discipline,
        )

        det_1 = Determination.objects.create(collectionobject=self.collectionobjects[0])

        self._update(
            self.collectionobjects[1],
            dict(collection=collection_2, collectionmemberid=collection_2.id),
        )

        det_2 = Determination.objects.create(
            collectionobject_id=self.collectionobjects[1].id
        )

        queryset = filter_by_collection(Determination.objects.all(), self.collection)
        self.assertCountEqual(queryset.values_list("id", flat=True), [det_1.id])

        queryset = filter_by_collection(Determination.objects.all(), collection_2)
        self.assertCountEqual(queryset.values_list("id", flat=True), [det_2.id])
