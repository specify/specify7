import json
from django.test import Client

from specifyweb.backend.trees.tests.test_trees import GeographyTree
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

        sort_by_ids = lambda _blockers: [{**obj, 'ids': sorted(obj['ids'])} for obj in _blockers]
        base = sorted(base, key=key)
        other = sorted(other, key=key)

        base = sort_by_ids(base)
        other = sort_by_ids(other)

        self.assertEqual(base, other)

    def _get_blockers(self, obj):
        response = self.c.get(_url(obj))
        return json.loads(response.content.decode())

    def _create_discipline_with_owned_export_schema(
        self,
        discipline,
        name='Disposable Export Schema',
    ):
        schema = models.Spexportschema.objects.create(
            discipline=discipline,
            schemaname=name,
        )
        mapping = models.Spexportschemamapping.objects.create(
            collectionmemberid=self.collection.id,
            mappingname=f'{name} Mapping',
        )
        models.Spexportschema_exportmapping.objects.create(
            spexportschema=schema,
            spexportschemamapping=mapping,
        )

    def _create_discipline_with_owned_trees(
        self,
        name='Disposable Discipline',
        division=None,
    ):
        placeholder_geo = models.Geographytreedef.objects.create(
            name=f'{name} placeholder geo'
        )
        placeholder_geo_time = models.Geologictimeperiodtreedef.objects.create(
            name=f'{name} placeholder geotime'
        )

        discipline = models.Discipline.objects.create(
            name=name,
            type='paleobotany',
            division=self.division if division is None else division,
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

    def test_division_delete_blockers_ignore_cascaded_discipline_setup_rows(self):
        division = models.Division.objects.create(
            name='Disposable Division',
            institution=self.institution,
        )
        discipline = self._create_discipline_with_owned_trees(
            'Division Discipline',
            division=division,
        )
        self._create_discipline_with_owned_export_schema(discipline)

        blockers = self._get_blockers(division)
        self._assertSame(blockers, [])

    def test_delete_division_removes_owned_setup_from_cascaded_discipline(self):
        division = models.Division.objects.create(
            name='Deletable Division',
            institution=self.institution,
        )
        discipline = self._create_discipline_with_owned_trees(
            'Division Delete Discipline',
            division=division,
        )
        self._create_discipline_with_owned_export_schema(discipline)

        delete_resource(
            self.collection, self.agent, 'division', division.id, division.version
        )
        self.assertFalse(models.Division.objects.filter(id=division.id).exists())
        self.assertFalse(models.Discipline.objects.filter(id=discipline.id).exists())
