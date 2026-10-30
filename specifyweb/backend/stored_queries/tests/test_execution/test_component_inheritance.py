from specifyweb.backend.stored_queries.execution import build_query
from specifyweb.backend.stored_queries.tests.tests import SQLAlchemySetup
from specifyweb.backend.stored_queries.tests.utils import make_query_fields_test
from specifyweb.specify.api.crud import create_obj
from specifyweb.specify.api.serializers import uri_for_model
from specifyweb.specify.models import (
    Collectionobjecttype, Component, Taxon, Taxontreedef, Taxontreedefitem,
)
from specifyweb.specify.tests.test_utils.test_collection_preference_context import (
    TestCollectionPreferenceContext,
)


class ComponentInheritanceQueryTests(SQLAlchemySetup, TestCollectionPreferenceContext):
    def setUp(self):
        super().setUp()
        self.parent = self.collectionobjects[0]
        # CO and Component IDs belong to separate tables. Deliberately collide
        # them so a CO ID mistakenly used as a Component ID returns a wrong row.
        self.unrelated = Component.objects.create(
            id=self.parent.id, collectionobject=self.collectionobjects[1],
            catalognumber='unrelated',
        )
        self.inherited = Component.objects.create(collectionobject=self.parent)
        self.explicit = Component.objects.create(
            collectionobject=self.collectionobjects[1], catalognumber=self.parent.catalognumber,
        )
        self.override = Component.objects.create(
            collectionobject=self.parent, catalognumber='override',
        )
        self.other_blank = Component.objects.create(collectionobject=self.collectionobjects[1])

    def query_catalog_number(self, inheritance, catalog_number):
        self._update_data({
            'catalogNumberParentInheritance': {'behavior': {'inheritance': inheritance}},
        })
        table, fields = make_query_fields_test('Component', [['catalognumber']])
        fields = [fields[0]._replace(op_num=1, value=catalog_number)]
        return {row[0] for row in self._get_results(table, fields)}

    def test_enabled_filter_returns_inherited_and_explicit_components_only(self):
        self.inherited.refresh_from_db()
        self.assertIsNone(self.inherited.catalognumber)
        self.assertEqual(
            self.query_catalog_number(True, self.parent.catalognumber),
            {self.inherited.id, self.explicit.id},
        )

    def test_disabled_filter_returns_only_explicit_catalog_number(self):
        self.assertEqual(
            self.query_catalog_number(False, self.parent.catalognumber),
            {self.explicit.id},
        )

    def test_explicit_override_remains_queryable_with_inheritance_enabled(self):
        self.assertEqual(self.query_catalog_number(True, 'override'), {self.override.id})

    def test_unknown_catalog_number_returns_no_components(self):
        self._update_data({
            'catalogNumberParentInheritance': {'behavior': {'inheritance': True}},
        })
        table, fields = make_query_fields_test('Component', [['catalognumber']])
        fields = [fields[0]._replace(op_num=1, value='missing')]
        # A count also works with the SQLAlchemy fixture's result replay when
        # there are no rows to replay.
        with self.__class__.test_session_context() as session:
            query, _ = build_query(session, self.collection, self.specifyuser, table.tableId, fields)
            self.assertEqual(query.count(), 0)


class ComponentTaxonQueryTests(SQLAlchemySetup):
    def setUp(self):
        super().setUp()
        self.taxa = []
        self.types = []
        for tree_name in ('Botany', 'Zoology'):
            definition = Taxontreedef.objects.create(name=tree_name, discipline=self.discipline)
            rank = Taxontreedefitem.objects.create(treedef=definition, rankid=0, name='Root')
            self.types.append(Collectionobjecttype.objects.create(
                name=tree_name, collection=self.collection, taxontreedef=definition,
            ))
            self.taxa.append(Taxon.objects.create(
                name='Life', fullname='Life', definition=definition, definitionitem=rank,
            ))

    def test_taxon_search_filters_identical_names_by_the_components_type_tree(self):
        table, fields = make_query_fields_test('Taxon', [['name'], ['definition', 'taxontreedefid']])
        for co_type, expected_taxon in zip(self.types, self.taxa):
            with self.subTest(type=co_type.name):
                filtered_fields = [
                    fields[0]._replace(op_num=1, value='Life'),
                    fields[1]._replace(op_num=1, value=str(co_type.taxontreedef_id)),
                ]
                self.assertEqual(
                    {row[0] for row in self._get_results(table, filtered_fields)},
                    {expected_taxon.id},
                )

    def test_selected_taxon_and_type_persist_on_the_component(self):
        component = create_obj(self.collection, self.agent, 'component', {
            'collectionobject': uri_for_model('collectionobject', self.collectionobjects[0].id),
            'type': uri_for_model('collectionobjecttype', self.types[0].id),
            'name': uri_for_model('taxon', self.taxa[0].id),
        })
        component.refresh_from_db()
        self.assertEqual(component.name_id, self.taxa[0].id)
        self.assertEqual(component.type.taxontreedef_id, component.name.definition_id)
