from django.test import Client
import json

from specifyweb.specify import models
from django.db import router
from django.test import TestCase
from specifyweb.backend.delete_blockers.views import _collect_delete_blockers
from specifyweb.backend.trees.tests.test_trees import GeographyTree

def _url(obj):
    return f"/delete_blockers/delete_blockers/{obj._meta.model_name}/{obj.id}/"

class TestDeleteBlockers(GeographyTree):

    def setUp(self):
        super().setUp()
        self._create_prep_type()
        c = Client()
        c.force_login(self.specifyuser)
        self.c = c

    def _assertSame(self, base, other):
        key = lambda obj: (obj['table'], obj['field'])

        sort_by_ids = lambda _blockers: [{**obj, 'ids': sorted(obj['ids'])} for obj in _blockers]
        base = sorted(base, key=key)
        other = sorted(other, key=key)

        base = sort_by_ids(base)
        other = sort_by_ids(other)

        self.assertEqual(base, other)

    def _get_blockers(self, obj):
        response = self.c.get(_url(obj))
        self.assertEqual(
            response.status_code,
            200,
            f"ERROR: {response.content.decode()}",
        )
        return json.loads(response.content.decode())

    def _assertContains(self, blockers, expected):
        normalized = [
            {**obj, 'ids': sorted(obj['ids'])}
            for obj in blockers
        ]
        self.assertIn({**expected, 'ids': sorted(expected['ids'])}, normalized)


    def test_simple_agent_delete_blockers(self):
        prep_list = []
        for co in self.collectionobjects:
            self._update(co, {'cataloger': self.agent, 'createdbyagent': self.agent})
            for _ in range(5):
                self._create_prep(co, prep_list, preparedbyagent=self.agent)

        delete_blockers = self._get_blockers(self.agent)
        
        expected =  [
            dict(table='Collectionobject', field='cataloger', ids=[co.id for co in self.collectionobjects]),
            dict(table='Collectionobject', field='createdbyagent', ids=[co.id for co in self.collectionobjects]),
            dict(table='Preparation', field='preparedbyagent', ids=[prep.id for prep in prep_list])
        ]

        self._assertSame(delete_blockers, expected)

    def test_to_many_dependents_not_in_blockers(self):
        prep_list = []
        for co in self.collectionobjects:
            for _ in range(5):
                self._create_prep(co, prep_list, preparedbyagent=self.agent)

        for co in self.collectionobjects:
            delete_blockers = self._get_blockers(co)
            self._assertSame(delete_blockers, [])

    def test_children_dont_block_deletion(self):
        
        for node in self._node_list:
            self._assertSame(self._get_blockers(node), [])

    def test_many_to_many_join_blockers_are_normalized(self):
        export_schema = models.Spexportschema.objects.create(
            discipline=self.discipline
        )
        export_mapping = models.Spexportschemamapping.objects.create(
            collectionmemberid=self.collection.id
        )
        export_schema.mappings.add(export_mapping)

        delete_blockers = self._get_blockers(export_schema)

        expected = [
            dict(
                table='SpExportSchemaMapping',
                field='spExportSchemas',
                ids=[export_mapping.id],
            )
        ]

        self._assertSame(delete_blockers, expected)

class TestDeleteBlockersCascade(TestCase):

    def _assertContains(self, blockers, expected):
        normalized = [
            {**obj, 'ids': sorted(obj['ids'])}
            for obj in blockers
        ]
        self.assertIn({**expected, 'ids': sorted(expected['ids'])}, normalized)

    def test_division_collects_normalized_cascaded_discipline_blockers(self):
        institution = models.Institution.objects.create(
            name='Test Institution',
            isaccessionsglobal=True,
            issecurityon=False,
            isserverbased=False,
            issharinglocalities=True,
            issinglegeographytree=True,
        )
        division = models.Division.objects.create(
            institution=institution,
            name='Test Division',
        )
        geologictimeperiodtreedef = models.Geologictimeperiodtreedef.objects.create(
            name='Test gtptd'
        )
        geographytreedef = models.Geographytreedef.objects.create(
            name='Test gtd'
        )
        datatype = models.Datatype.objects.create(name='Test datatype')
        discipline = models.Discipline.objects.create(
            geologictimeperiodtreedef=geologictimeperiodtreedef,
            geographytreedef=geographytreedef,
            division=division,
            datatype=datatype,
            type='paleobotany',
        )
        export_schema = models.Spexportschema.objects.create(
            discipline=discipline
        )
        export_mapping = models.Spexportschemamapping.objects.create(
            collectionmemberid=1
        )
        export_schema.mappings.add(export_mapping)

        using = router.db_for_write(division.__class__, instance=division)
        delete_blockers = _collect_delete_blockers(division, using)

        self._assertContains(
            delete_blockers,
            dict(
                table='SpExportSchemaMapping',
                field='spExportSchemas',
                ids=[export_mapping.id],
            ),
        )
        self.assertFalse(
            any(
                blocker['table'] == 'Spexportschema_exportmapping'
                for blocker in delete_blockers
            )
        )
from django.test import Client
import json

from specifyweb.specify import models
from django.db import router
from django.test import TestCase
from specifyweb.backend.delete_blockers.views import _collect_delete_blockers
from specifyweb.backend.trees.tests.test_trees import GeographyTree

def _url(obj):
    return f"/delete_blockers/delete_blockers/{obj._meta.model_name}/{obj.id}/"

class TestDeleteBlockers(GeographyTree):

    def setUp(self):
        super().setUp()
        self._create_prep_type()
        c = Client()
        c.force_login(self.specifyuser)
        self.c = c

    def _assertSame(self, base, other):
        key = lambda obj: (obj['table'], obj['field'])

        sort_by_ids = lambda _blockers: [{**obj, 'ids': sorted(obj['ids'])} for obj in _blockers]
        base = sorted(base, key=key)
        other = sorted(other, key=key)

        base = sort_by_ids(base)
        other = sort_by_ids(other)

        self.assertEqual(base, other)

    def _get_blockers(self, obj):
        response = self.c.get(_url(obj))
        self.assertEqual(
            response.status_code,
            200,
            f"ERROR: {response.content.decode()}",
        )
        return json.loads(response.content.decode())

    def _assertContains(self, blockers, expected):
        normalized = [
            {**obj, 'ids': sorted(obj['ids'])}
            for obj in blockers
        ]
        self.assertIn({**expected, 'ids': sorted(expected['ids'])}, normalized)


    def test_simple_agent_delete_blockers(self):
        prep_list = []
        for co in self.collectionobjects:
            self._update(co, {'cataloger': self.agent, 'createdbyagent': self.agent})
            for _ in range(5):
                self._create_prep(co, prep_list, preparedbyagent=self.agent)

        delete_blockers = self._get_blockers(self.agent)
        
        expected =  [
            dict(table='Collectionobject', field='cataloger', ids=[co.id for co in self.collectionobjects]),
            dict(table='Collectionobject', field='createdbyagent', ids=[co.id for co in self.collectionobjects]),
            dict(table='Preparation', field='preparedbyagent', ids=[prep.id for prep in prep_list])
        ]

        self._assertSame(delete_blockers, expected)

    def test_to_many_dependents_not_in_blockers(self):
        prep_list = []
        for co in self.collectionobjects:
            for _ in range(5):
                self._create_prep(co, prep_list, preparedbyagent=self.agent)

        for co in self.collectionobjects:
            delete_blockers = self._get_blockers(co)
            self._assertSame(delete_blockers, [])

    def test_children_dont_block_deletion(self):
        
        for node in self._node_list:
            self._assertSame(self._get_blockers(node), [])

    def test_many_to_many_join_blockers_are_normalized(self):
        export_schema = models.Spexportschema.objects.create(
            discipline=self.discipline
        )
        export_mapping = models.Spexportschemamapping.objects.create(
            collectionmemberid=self.collection.id
        )
        export_schema.mappings.add(export_mapping)

        delete_blockers = self._get_blockers(export_schema)

        expected = [
            dict(
                table='SpExportSchemaMapping',
                field='spExportSchemas',
                ids=[export_mapping.id],
            )
        ]

        self._assertSame(delete_blockers, expected)

class TestDeleteBlockersCascade(TestCase):

    def _assertContains(self, blockers, expected):
        normalized = [
            {**obj, 'ids': sorted(obj['ids'])}
            for obj in blockers
        ]
        self.assertIn({**expected, 'ids': sorted(expected['ids'])}, normalized)

    def test_division_collects_normalized_cascaded_discipline_blockers(self):
        institution = models.Institution.objects.create(
            name='Test Institution',
            isaccessionsglobal=True,
            issecurityon=False,
            isserverbased=False,
            issharinglocalities=True,
            issinglegeographytree=True,
        )
        division = models.Division.objects.create(
            institution=institution,
            name='Test Division',
        )
        geologictimeperiodtreedef = models.Geologictimeperiodtreedef.objects.create(
            name='Test gtptd'
        )
        geographytreedef = models.Geographytreedef.objects.create(
            name='Test gtd'
        )
        datatype = models.Datatype.objects.create(name='Test datatype')
        discipline = models.Discipline.objects.create(
            geologictimeperiodtreedef=geologictimeperiodtreedef,
            geographytreedef=geographytreedef,
            division=division,
            datatype=datatype,
            type='paleobotany',
        )
        export_schema = models.Spexportschema.objects.create(
            discipline=discipline
        )
        export_mapping = models.Spexportschemamapping.objects.create(
            collectionmemberid=1
        )
        export_schema.mappings.add(export_mapping)

        using = router.db_for_write(division.__class__, instance=division)
        delete_blockers = _collect_delete_blockers(division, using)

        self._assertContains(
            delete_blockers,
            dict(
                table='SpExportSchemaMapping',
                field='spExportSchemas',
                ids=[export_mapping.id],
            ),
        )
        self.assertFalse(
            any(
                blocker['table'] == 'Spexportschema_exportmapping'
                for blocker in delete_blockers
            )
        )
