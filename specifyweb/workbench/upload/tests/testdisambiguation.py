from typing import List, Optional

from ..uploadable import Disambiguation
from ..upload_result import Uploaded, UploadResult, Matched, MatchedMultiple, FailedBusinessRule, ReportInfo, TreeInfo
from ..upload_table import UploadTable, ScopedUploadTable, _to_many_filters_and_excludes, BoundUploadTable
from ..tomany import ToManyRecord
from ..treerecord import TreeRecord, BoundTreeRecord, TreeDefItemWithParseResults
from ..upload import do_upload, do_upload_csv
from ..upload_plan_schema import parse_column_options
from ..disambiguation import DisambiguationInfo

from .base import UploadTestsBase, get_table

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
            static={'referenceworktype': 0},
            toOne={},
            toMany={'authors': [
                ToManyRecord(
                    name='Author',
                    wbcols={},
                    static={},
                    toOne={'agent': UploadTable(
                        name='Agent',
                        wbcols={
                            'lastname': parse_column_options('author1')
                        },
                        static={},
                        toOne={},
                        toMany={}
                    )}),
                ToManyRecord(
                    name='Author',
                    wbcols={},
                    static={},
                    toOne={'agent': UploadTable(
                        name='Agent',
                        wbcols={
                            'lastname': parse_column_options('author2')
                        },
                        static={},
                        toOne={},
                        toMany={}
                    )}),
            ]}
        ).apply_scoping(self.collection)

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
