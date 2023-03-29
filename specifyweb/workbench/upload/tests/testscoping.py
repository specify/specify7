
from ..upload_plan_schema import schema, parse_plan, parse_plan_with_basetable
from ..upload_table import UploadTable, OneToOneTable, ScopedUploadTable, ScopedOneToOneTable, DeferredScopeUploadTable, ColumnOptions

from .base import UploadTestsBase, get_table
from . import example_plan


class ScopingTests(UploadTestsBase):

    def test_embedded_collectingevent(self) -> None:
        self.collection.isembeddedcollectingevent = True
        self.collection.save()

        plan = parse_plan(self.collection, example_plan.json)

        assert isinstance(plan, UploadTable)
        ce_rel = plan.toOne['collectingevent']

        self.assertNotIsInstance(ce_rel, OneToOneTable)

        scoped = plan.apply_scoping(self.collection)

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
        ).apply_scoping(self.collection)

        self.assertIsInstance(plan.toOne['paleocontext'], ScopedOneToOneTable)

    def collection_rel_type_being_deferred(self) -> None:

        unparsed_upload_plan = {
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
        table, parsed_plan = parse_plan_with_basetable(self.collection, unparsed_upload_plan)

        expected_plan = UploadTable(
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
                    overrideScope=None
                    ), 
                    
                'rightside': DeferredScopeUploadTable(
                    name='Collectionobject', 
                    wbcols={'catalognumber': ColumnOptions(column='Cat # (2)', matchBehavior='ignoreNever', nullAllowed=True, default=None)}, 
                    static={}, 
                    toOne={}, 
                    toMany={}, 
                    related_key='collectionreltype', 
                    relationship_name='rightsidecollection', 
                    filter_field='name', 
                    overrideScope=None
                    ), 
                    
                'collectionreltype': UploadTable(
                    name='Collectionreltype', 
                    wbcols={'name': ColumnOptions(column='Collection Rel Type', matchBehavior='ignoreNever', nullAllowed=True, default=None)}, 
                    static={}, 
                    toOne={}, 
                    toMany={}, 
                    overrideScope=None
                    )
                }, 
                toMany={}, 
                overrideScope=None)
        
        self.assertEqual(parsed_plan, expected_plan)
