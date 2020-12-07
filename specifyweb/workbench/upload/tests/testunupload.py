from .base import UploadTestsBase, get_table
from ..upload_result import Uploaded, ParseFailures, CellIssue, FailedBusinessRule
from ..upload import do_upload, do_upload_csv, unupload_record
from ..upload_table import UploadTable


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

        for i, v in enumerate('River Lake marsh Lake marsh Lake'.split()):
            r = results[i].record_result
            assert isinstance(r, Uploaded)
            self.assertEqual(v, get_table('Collectionobject').objects.get(id=r.get_id()).text1)

        self.assertEqual(3, get_table('Picklistitem').objects.filter(picklist__name='Habitat').count(),
                         "There are now three items in the picklist.")

        for i, v in enumerate('River Lake None None None None'.split()):
            r = results[i].record_result
            assert isinstance(r, Uploaded)
            if v == 'None':
                self.assertEqual([], r.picklistAdditions)
            else:
                self.assertEqual(['habitat'], [a.caption for a in r.picklistAdditions])
                self.assertEqual([v], [get_table('Picklistitem').objects.get(id=a.id).value for a in r.picklistAdditions])

        for result in reversed(results):
            unupload_record(result)

        self.assertEqual(1, get_table('Picklistitem').objects.filter(picklist__name='Habitat').count(),
                         "The picklist is back to one item after unuploading.")
