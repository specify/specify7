from ..upload_plan_schema import schema, parse_plan
from ..upload_table import UploadTable, OneToOneTable, ScopedUploadTable, ScopedOneToOneTable, ColumnOptions, ExtendedColumnOptions
from ..upload import do_upload

from specifyweb.specify import models
from specifyweb.specify.api_tests import get_table
from .base import UploadTestsBase
from . import example_plan


class ScopingTests(UploadTestsBase):

    def setUp(self) -> None:
        super().setUp()
        self.rel_type_name = "ToRightSide"

        self.right_side_collection = get_table('Collection').objects.create(
            catalognumformatname='test',
            collectionname='RightSideTest',
            isembeddedcollectingevent=False,
            discipline=self.discipline)

        get_table('Collectionreltype').objects.create(
            name = self.rel_type_name,
            leftsidecollection = self.collection,
            rightsidecollection = self.right_side_collection,
        )

        self.collection_rel_plan = {
            "baseTableName": "collectionrelationship",
            "uploadable": {
                "uploadTable": {
                    "wbcols": {},
                    "static": {},
                    "toOne": {
                        "leftside": {
                            "uploadTable": {
                                "wbcols": {
                                    "catalognumber": "Cat #"
                                },
                                "static": {},
                                "toOne": {},
                                "toMany": {}
                            }
                        },
                        "rightside": {
                            "uploadTable": {
                                "wbcols": {
                                    "catalognumber": "Cat # (2)"
                                },
                                "static": {},
                                "toOne": {},
                                "toMany": {}
                            }
                        },
                        "collectionreltype": {
                            "uploadTable": {
                                "wbcols": {
                                    "name": "Collection Rel Type"
                                },
                                "static": {},
                                "toOne": {},
                                "toMany": {}
                            }
                        }
                    },
                    "toMany": {}
                }
            }
        }

    def test_embedded_collectingevent(self) -> None:
        self.collection.isembeddedcollectingevent = True
        self.collection.save()

        plan = parse_plan(self.collection, example_plan.json)

        assert isinstance(plan, UploadTable)
        ce_rel = plan.toOne['collectingevent']

        self.assertNotIsInstance(ce_rel, OneToOneTable)

        scoped = plan.apply_scoping(self.collection)[1]

        assert isinstance(scoped, ScopedUploadTable)
        scoped_ce_rel = scoped.toOne['collectingevent']

        self.assertIsInstance(scoped_ce_rel, ScopedOneToOneTable)


    def test_embedded_paleocontext_in_collectionobject(self) -> None:
        self.collection.discipline.ispaleocontextembedded = True
        self.collection.discipline.paleocontextchildtable = 'collectionobject'
        self.collection.save()

        plan = UploadTable(
            name='Collectionobject',
            toOne={'paleocontext': UploadTable(
                name='Paleocontext',
                wbcols={},
                toOne={},
                toMany={},
                static={},
            )},
            wbcols={},
            static={},
            toMany={},
        ).apply_scoping(self.collection)[1]

        self.assertIsInstance(plan.toOne['paleocontext'], ScopedOneToOneTable)

    def test_caching_scoped_false(self) -> None:

        plan = parse_plan(self.collection, self.collection_rel_plan).apply_scoping(self.collection)

        self.assertFalse(plan[0], 'contains collection relationship, should never be cached')

    def test_caching_true(self):
        plan = self.example_plan.apply_scoping(self.collection)
        self.assertTrue(plan[0], 'caching is possible here, since no dynamic scope is being used')

    # TODO: Refactor this one too
    def deferred_scope_table_ignored_when_scoping_applied(self):
        scoped_upload_plan = parse_plan(self.collection_rel_plan).apply_scoping(self.collection)

        expected_scoping = ScopedUploadTable(
            name='Collectionrelationship', 
            wbcols={}, 
            static={}, 
            toOne={
            'leftside': UploadTable(
                name='Collectionobject', 
                wbcols={'catalognumber': ColumnOptions(column='Cat #', matchBehavior='ignoreNever', nullAllowed=True, default=None)}, 
                static={}, 
                toOne={}, 
                toMany={}, 
                overrideScope=None), 
            'rightside': DeferredScopeUploadTable(
                name='Collectionobject', 
                wbcols={'catalognumber': ColumnOptions(column='Cat # (2)', matchBehavior='ignoreNever', nullAllowed=True, default=None)}, 
                static={}, 
                toOne={}, 
                toMany={}, 
                related_key='collectionreltype', 
                relationship_name='rightsidecollection', 
                filter_field='name', 
                overrideScope=None), 
            'collectionreltype': ScopedUploadTable(
                name='Collectionreltype', 
                wbcols={'name': ExtendedColumnOptions(
                    column='Collection Rel Type', 
                    matchBehavior='ignoreNever', 
                    nullAllowed=True, 
                    default=None, 
                    uiformatter=None, 
                    schemaitem= models.Splocalecontaineritem.objects.get(name='name', container=models.Splocalecontainer.objects.get(name='collectionreltype', discipline_id=self.discipline.id)), 
                    picklist=None, 
                    dateformat='%m/%d/%Y')}, 
                static={}, 
                toOne={}, 
                toMany={}, 
                scopingAttrs={}, 
                disambiguation=None)}, 
            
            toMany={}, 
            scopingAttrs={}, 
            disambiguation=None)
        
        self.assertEqual(scoped_upload_plan, expected_scoping)

    def test_collection_rel_uploaded_in_correct_collection(self):
        scoped_plan = parse_plan(self.collection, self.collection_rel_plan)
        rows = [
            {'Collection Rel Type': self.rel_type_name, 'Cat # (2)': '999', 'Cat #': '23'}, 
            {'Collection Rel Type': self.rel_type_name, 'Cat # (2)': '888', 'Cat #': '32'}
        ]
        result = do_upload(self.collection, rows, scoped_plan, self.agent.id)
        left_side_cat_nums = [n.zfill(9) for n in '32 23'.split()]
        right_side_cat_nums = '999 888'.split()
        left_side_query = models.Collectionobject.objects.filter(collection_id=self.collection.id, catalognumber__in=left_side_cat_nums)
        right_side_query = models.Collectionobject.objects.filter(collection_id=self.right_side_collection.id, catalognumber__in=right_side_cat_nums)

        self.assertEqual(left_side_query.count(), 2)
        self.assertEqual(right_side_query.count(), 2)
