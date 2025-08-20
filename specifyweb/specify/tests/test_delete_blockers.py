from django.test import Client
import json

from specifyweb.backend.trees.tests.test_trees import GeographyTree

def _url(obj):
    return f"/api/delete_blockers/{obj._meta.model_name}/{obj.id}/"

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
        return json.loads(response.content.decode())


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
