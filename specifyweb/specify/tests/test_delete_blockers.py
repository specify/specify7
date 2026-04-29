from django.test import Client
import json

from specifyweb.backend.permissions.models import UserPolicy
from specifyweb.backend.trees.tests.test_trees import GeographyTree
from specifyweb.backend.businessrules.exceptions import BusinessRuleException
from specifyweb.specify import models
from specifyweb.specify.api.crud import delete_resource

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

        sort_by_ids = lambda _blockers: [
            {
                **obj,
                'ids': sorted(obj['ids']),
                'total_count': obj.get('total_count', len(obj['ids'])),
            }
            for obj in _blockers
        ]
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

    def _create_discipline_with_owned_trees(self, name='Disposable Discipline'):
        placeholder_geo = models.Geographytreedef.objects.create(name=f'{name} placeholder geo')
        placeholder_geo_time = models.Geologictimeperiodtreedef.objects.create(
            name=f'{name} placeholder geotime'
        )

        discipline = models.Discipline.objects.create(
            name=name,
            type='paleobotany',
            division=self.division,
            datatype=self.datatype,
            geographytreedef=placeholder_geo,
            geologictimeperiodtreedef=placeholder_geo_time,
        )

        geography_tree = models.Geographytreedef.objects.create(
            name=f'{name} geography',
            discipline=discipline,
        )
        geography_rank = models.Geographytreedefitem.objects.create(
            name='Planet',
            rankid=0,
            treedef=geography_tree,
        )
        models.Geography.objects.create(
            name='Earth',
            rankid=0,
            definition=geography_tree,
            definitionitem=geography_rank,
        )

        geotime_tree = models.Geologictimeperiodtreedef.objects.create(
            name=f'{name} geotime',
            discipline=discipline,
        )
        geotime_rank = models.Geologictimeperiodtreedefitem.objects.create(
            name='Root',
            rankid=0,
            treedef=geotime_tree,
        )
        models.Geologictimeperiod.objects.create(
            name='Root',
            rankid=0,
            definition=geotime_tree,
            definitionitem=geotime_rank,
        )

        taxon_tree = models.Taxontreedef.objects.create(
            name=f'{name} taxon',
            discipline=discipline,
        )
        taxon_rank = models.Taxontreedefitem.objects.create(
            name='Life',
            rankid=0,
            treedef=taxon_tree,
        )
        models.Taxon.objects.create(
            name='Life',
            rankid=0,
            definition=taxon_tree,
            definitionitem=taxon_rank,
        )

        discipline.geographytreedef = geography_tree
        discipline.geologictimeperiodtreedef = geotime_tree
        discipline.taxontreedef = taxon_tree
        discipline.save()
        return discipline

    def test_discipline_blocked_when_has_collections(self):
        blockers = self._get_blockers(self.discipline)
        self._assertSame(
            blockers,
            [dict(table='Collection', field='discipline', ids=[self.collection.id])],
        )

    def test_discipline_blocked_when_has_users(self):
        discipline = self._create_discipline_with_owned_trees('User Blocked Discipline')
        resource_dir = models.Spappresourcedir.objects.create(
            discipline=discipline,
            specifyuser=self.specifyuser,
            ispersonal=False,
        )

        blockers = self._get_blockers(discipline)
        self._assertSame(
            blockers,
            [dict(table='Spappresourcedir', field='specifyuser', ids=[resource_dir.id])],
        )

        with self.assertRaises(BusinessRuleException):
            delete_resource(
                self.collection, self.agent, 'discipline', discipline.id, discipline.version
            )

    def test_discipline_without_users_or_collections_can_be_deleted(self):
        discipline = self._create_discipline_with_owned_trees('Deletable Discipline')
        blockers = self._get_blockers(discipline)
        self._assertSame(blockers, [])

        delete_resource(
            self.collection, self.agent, 'discipline', discipline.id, discipline.version
        )
        self.assertFalse(models.Discipline.objects.filter(id=discipline.id).exists())
