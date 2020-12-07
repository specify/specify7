from .base import UploadTestsBase, get_table
from ..upload_result import Uploaded, ParseFailures, CellIssue, FailedBusinessRule
from ..upload import do_upload, do_upload_csv, unupload_record
from ..upload_table import UploadTable
from ..treerecord import TreeRecord


class UnUploadTests(UploadTestsBase):
    def setUp(self) -> None:
        super().setUp()


        co = get_table('Splocalecontainer').objects.create(
            name='collectionobject',
            schematype=0,
            discipline=self.discipline,
            ishidden=False,
            issystem=False
        )

        co.items.create(
            name='text1',
            ishidden=False,
            issystem=False,
            picklistname='Habitat',
            isrequired=True,
        )


        habitat = get_table('Picklist').objects.create(
            name='Habitat',
            type=0,
            collection=self.collection,
            readonly=False,
            sizelimit=4,
        )

        habitat.picklistitems.create(title='Marsh', value='marsh')

    def test_unupload_picklist(self) -> None:
        # data copied from the testparsing.test_nonreadonly_picklist test

        plan = UploadTable(
            name='Collectionobject',
            wbcols={'catalognumber': 'catno', 'text1': 'habitat'},
            static={},
            toOne={},
            toMany={}
        ).apply_scoping(self.collection)
        data = [
            {'catno': '1', 'habitat': 'River'},
            {'catno': '2', 'habitat': 'Lake'},
            {'catno': '3', 'habitat': 'Marsh'},
            {'catno': '4', 'habitat': 'Lake'},
            {'catno': '5', 'habitat': 'marsh'},
            {'catno': '6', 'habitat': 'lake'},
        ]
        results = do_upload(self.collection, data, plan)

        self.assertEqual(3, get_table('Picklistitem').objects.filter(picklist__name='Habitat').count(),
                         "There are now three items in the picklist.")

        for result in reversed(results):
            unupload_record(result)

        self.assertEqual(1, get_table('Picklistitem').objects.filter(picklist__name='Habitat').count(),
                         "The picklist is back to one item after unuploading.")

    def test_unupload_tree(self) -> None:
        plan = TreeRecord(
            name = 'Geography',
            ranks = {
                'Continent': 'Continent/Ocean',
                'Country': 'Country',
                'State': 'State/Prov/Pref',
                'County': 'Co',
            }
        ).apply_scoping(self.collection)

        data = [
            { 'Continent/Ocean': 'North America' , 'Country': 'United States' , 'State/Prov/Pref': 'Kansas', 'Co': 'Douglass'},
            { 'Continent/Ocean': 'North America' , 'Country': 'United States' , 'State/Prov/Pref': 'Missouri', 'Co': 'Greene'},
            { 'Continent/Ocean': 'North America' , 'Country': 'United States' , 'State/Prov/Pref': 'Missouri', 'Co': 'Christian'},
            { 'Continent/Ocean': 'North America' , 'Country': 'United States' , 'State/Prov/Pref': 'Kansas', 'Co': 'Johnson'},
        ]

        results = do_upload(self.collection, data, plan)

        self.assertEqual({
            (0, "Uploaded"),
            (100, "North America"),
            (200, "United States"),
            (300, "Kansas"),
            (300, "Missouri"),
            (400, "Douglass"),
            (400, "Greene"),
            (400, "Christian"),
            (400, "Johnson"),
        }, set((record.rankid, record.name) for record in get_table('Geography').objects.all()))

        for result in reversed(results):
            unupload_record(result)

        self.assertEqual(set(), set((record.rankid, record.name) for record in get_table('Geography').objects.all()))
