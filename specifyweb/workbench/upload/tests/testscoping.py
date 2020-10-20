
from ..upload_plan_schema import schema, parse_plan
from ..upload_table import UploadTable, OneToOneTable

from .base import UploadTestsBase
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

        assert isinstance(scoped, UploadTable)
        scoped_ce_rel = scoped.toOne['collectingevent']

        self.assertIsInstance(scoped_ce_rel, OneToOneTable)

    def test_scoping_idempotency(self) -> None:
        self.collection.isembeddedcollectingevent = True
        self.collection.save()

        plan = parse_plan(self.collection, example_plan.json)

        scoped = plan.apply_scoping(self.collection)

        self.assertEqual(scoped, scoped.apply_scoping(self.collection))

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

        self.assertIsInstance(plan.toOne['paleocontext'], OneToOneTable)
