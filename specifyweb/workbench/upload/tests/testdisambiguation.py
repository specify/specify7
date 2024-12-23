from typing import List, Optional

from ..uploadable import Disambiguation
from ..upload_result import Matched, MatchedMultiple
from ..upload_table import UploadTable
from ..upload import do_upload, validate_row, get_disambiguation_from_row
from ..upload_plan_schema import parse_column_options, parse_plan
from ..disambiguation import DisambiguationInfo

from .base import UploadTestsBase
from specifyweb.specify.tests.test_api import get_table

from django.conf import settings

class DisambiguationTests(UploadTestsBase):

    def test_disambiguation(self) -> None:
        senior = get_table('Agent').objects.create(
            lastname="Mungophilius",
            suffix="Sr.",
            agenttype=1,
            division=self.division,
        )

        junior = get_table('Agent').objects.create(
            lastname="Mungophilius",
            suffix="Jr.",
            agenttype=1,
            division=self.division,
        )

        plan = UploadTable(
            name='Referencework',
            wbcols={'title': parse_column_options('title')},
            overrideScope=None,
            static={'referenceworktype': 0},
            toOne={},
            toMany={'authors': [
                UploadTable(
                    name='Author',
                    wbcols={},
                    static={},
                    toOne={'agent': UploadTable(
                        name='Agent',
                        wbcols={
                            'lastname': parse_column_options('author1')
                        },
                        overrideScope=None,
                        static={},
                        toOne={},
                        toMany={}
                    )},
                    toMany={}
                    ),
                UploadTable(
                    name='Author',
                    wbcols={},
                    static={},
                    toOne={'agent': UploadTable(
                        name='Agent',
                        wbcols={
                            'lastname': parse_column_options('author2')
                        },
                        overrideScope=None,
                        static={},
                        toOne={},
                        toMany={}
                    )},
                    toMany={}
                    ),
            ]}
        )

        data = [
            {'title': "A Natural History of Mung Beans 1", 'author1': "Philomungus", 'author2': "Mungophilius"},
            {'title': "A Natural History of Mung Beans 2", 'author1': "Mungophilius", 'author2': "Philomungus"},
            {'title': "A Natural History of Mung Beans 3", 'author1': "Mungophilius", 'author2': "Mungophilius"},
        ]

        results = do_upload(self.collection, data, plan, self.agent.id)
        for result in results:
            assert result.contains_failure()

        disambiguations: Optional[List[Disambiguation]] = [
            DisambiguationInfo({("authors", "#2", "agent"): senior.id}),
            DisambiguationInfo({("authors", "#1", "agent"): junior.id}),
            DisambiguationInfo({("authors", "#1", "agent"): senior.id, ("authors", "#2", "agent"): junior.id}),
        ]

        results = do_upload(self.collection, data, plan, self.agent.id, disambiguations)
        for result in results:
            assert not result.contains_failure()

        self.assertEqual(get_table('Author').objects.get(referencework_id=results[0].get_id(), ordernumber=1).agent, senior)
        self.assertEqual(get_table('Author').objects.get(referencework_id=results[1].get_id(), ordernumber=0).agent, junior)

        self.assertEqual(get_table('Author').objects.get(referencework_id=results[2].get_id(), ordernumber=0).agent, senior)
        self.assertEqual(get_table('Author').objects.get(referencework_id=results[2].get_id(), ordernumber=1).agent, junior)

    def test_disambiguate_taxon(self) -> None:
        Taxon = get_table('Taxon')
        life = Taxon.objects.create(name='Life', definitionitem=self.taxontreedef.treedefitems.get(name='Taxonomy Root'))
        funduloidea = Taxon.objects.create(name='Funduloidea', definitionitem=self.taxontreedef.treedefitems.get(name='Family'), parent=life)
        profunduloidea = Taxon.objects.create(name='Profunduloidea', definitionitem=self.taxontreedef.treedefitems.get(name='Family'), parent=life)
        fundulus1 = Taxon.objects.create(name='Fundulus', definitionitem=self.taxontreedef.treedefitems.get(name='Genus'), parent=funduloidea)
        fundulus2 = Taxon.objects.create(name='Fundulus', definitionitem=self.taxontreedef.treedefitems.get(name='Genus'), parent=profunduloidea)

        plan = {
            "baseTableName": "collectionobject",
            "uploadable": {
                "uploadTable": {
                    "wbcols": {"catalognumber": "Cat #",},
                    "static": {},
                    "toOne": {},
                    "toMany": {
                        "determinations": [{
                            "wbcols": {},
                            "static": {},
                            "toOne": {
                                "taxon": {"treeRecord": {
                                    "ranks": {
                                        "Genus": {"treeNodeCols": {"name": "Genus"}},
                                        "Species": {"treeNodeCols": {"name": "Species"}}}}},}}],}}}}

        cols = ["Cat #", "Genus", "Species"]
        row = ["123", "Fundulus", "olivaceus"]

        up = parse_plan(plan).apply_scoping(self.collection)

        result = validate_row(self.collection, up, self.agent.id, dict(zip(cols, row)), None)
        taxon_result = result.toMany['determinations'][0].toOne['taxon'].record_result
        assert isinstance(taxon_result, MatchedMultiple)
        self.assertEqual(set(taxon_result.ids), {fundulus1.id, fundulus2.id})

        da_row = ["123", "Fundulus", "olivaceus", "{\"disambiguation\":{\"determinations.#1.taxon.$Genus\":%d}}" % fundulus1.id]
        da = get_disambiguation_from_row(len(cols), da_row)

        result = validate_row(self.collection, up, self.agent.id, dict(zip(cols, row)), da)
        taxon_result = result.toMany['determinations'][0].toOne['taxon'].toOne['parent'].record_result
        assert isinstance(taxon_result, Matched)
        self.assertEqual(fundulus1.id, taxon_result.id)

    def test_disambiguate_taxon_deleted(self) -> None:
        Taxon = get_table('Taxon')
        life = Taxon.objects.create(name='Life', definitionitem=self.taxontreedef.treedefitems.get(name='Taxonomy Root'))
        funduloidea = Taxon.objects.create(name='Funduloidea', definitionitem=self.taxontreedef.treedefitems.get(name='Family'), parent=life)
        profunduloidea = Taxon.objects.create(name='Profunduloidea', definitionitem=self.taxontreedef.treedefitems.get(name='Family'), parent=life)
        fundulus1 = Taxon.objects.create(name='Fundulus', definitionitem=self.taxontreedef.treedefitems.get(name='Genus'), parent=funduloidea)
        fundulus2 = Taxon.objects.create(name='Fundulus', definitionitem=self.taxontreedef.treedefitems.get(name='Genus'), parent=profunduloidea)

        plan = {
            "baseTableName": "collectionobject",
            "uploadable": {
                "uploadTable": {
                    "wbcols": {"catalognumber": "Cat #",},
                    "static": {},
                    "toOne": {},
                    "toMany": {
                        "determinations": [{
                            "wbcols": {},
                            "static": {},
                            "toOne": {
                                "taxon": {"treeRecord": {
                                    "ranks": {
                                        "Genus": {"treeNodeCols": {"name": "Genus"}},
                                        "Species": {"treeNodeCols": {"name": "Species"}}}}},}}],}}}}

        cols = ["Cat #", "Genus", "Species"]
        row = ["123", "Fundulus", "olivaceus"]

        up = parse_plan(plan).apply_scoping(self.collection)

        result = validate_row(self.collection, up, self.agent.id, dict(zip(cols, row)), None)
        taxon_result = result.toMany['determinations'][0].toOne['taxon'].record_result
        assert isinstance(taxon_result, MatchedMultiple)
        self.assertEqual(set(taxon_result.ids), {fundulus1.id, fundulus2.id})

        da_row = ["123", "Fundulus", "olivaceus", "{\"disambiguation\":{\"determinations.#1.taxon.$Genus\":%d}}" % fundulus1.id]

        fundulus1.delete()

        da = get_disambiguation_from_row(len(cols), da_row)

        result = validate_row(self.collection, up, self.agent.id, dict(zip(cols, row)), da)
        taxon_result = result.toMany['determinations'][0].toOne['taxon'].toOne['parent'].record_result
        assert isinstance(taxon_result, Matched)
        self.assertEqual(fundulus2.id, taxon_result.id)

    def test_disambiguate_agent_deleted(self) -> None:
        Agent = get_table('Agent')
        andy = Agent.objects.create(lastname='Bentley', firstname='Andrew', agenttype=1, division=self.division)
        bogus = Agent.objects.create(lastname='Bentley', firstname='Bogus', agenttype=1, division=self.division)

        plan = {
            "baseTableName": "collectionobject",
            "uploadable": {
                "uploadTable": {
                    "wbcols": {"catalognumber": "Cat #"},
                    "static": {},
                    "toOne": {
                        "cataloger": {
                            "uploadTable": {
                                "wbcols": {"lastname": "Cat last"},
                                "static": {},
                                "toOne": {},
                                "toMany": {}}}},
                    "toMany": {}}}}

        cols = ["Cat #", "Cat last"]
        row = ["123", "Bentley"]

        up = parse_plan(plan).apply_scoping(self.collection)

        result = validate_row(self.collection, up, self.agent.id, dict(zip(cols, row)), None)
        agent_result = result.toOne['cataloger'].record_result
        assert isinstance(agent_result, MatchedMultiple)
        self.assertEqual(set(agent_result.ids), {andy.id, bogus.id})

        da_row = ["123", "Bentley", "{\"disambiguation\":{\"cataloger\":%d}}" % bogus.id]

        da = get_disambiguation_from_row(len(cols), da_row)

        result = validate_row(self.collection, up, self.agent.id, dict(zip(cols, row)), da)
        agent_result = result.toOne['cataloger'].record_result
        assert isinstance(agent_result, Matched)
        self.assertEqual(bogus.id, agent_result.id)

        bogus.delete()

        result = validate_row(self.collection, up, self.agent.id, dict(zip(cols, row)), da)
        assert not result.contains_failure()

        agent_result = result.toOne['cataloger'].record_result
        assert isinstance(agent_result, Matched)
        self.assertEqual(andy.id, agent_result.id)
