from jsonschema import validate # type: ignore
from typing import Any, Dict, List, Tuple
from specifyweb.workbench.upload.tests.base import UploadTestsBase
from specifyweb.workbench.upload.upload import do_upload
from specifyweb.workbench.upload.upload_result import Matched, NullRecord, Uploaded
from ..upload_plan_schema import schema, parse_plan
from specifyweb.specify.tests.test_api import get_table

from django.conf import settings

class NestedToManyTests(UploadTestsBase):
    def plan(self) -> Dict:
        return dict(
            baseTableName = 'Collectingevent',
            uploadable = {
                'uploadTable': dict(
                    wbcols = {
                        'stationfieldnumber': 'sfn'
                    },
                    static = {},
                    toOne = {},
                    toMany = {
                        'collectors': [
                            dict(
                                wbcols = {},
                                static={'isprimary': True},
                                toOne = {
                                    'agent': {
                                        'uploadTable': dict(
                                            wbcols = {
                                                'firstname': 'coll_1_name'
                                            },
                                            static = {
                                                'agenttype': 1
                                            },
                                            toOne = {},
                                            toMany = {
                                                'agentspecialties': [
                                                    dict(
                                                        wbcols = {
                                                            'specialtyname': 'agent_1_specialty_1'
                                                        },
                                                        static = {},
                                                        toOne = {},
                                                        toMany = {}
                                                    ),
                                                    dict(
                                                        wbcols = {
                                                            'specialtyname': 'agent_1_specialty_2'
                                                        },
                                                        static = {},
                                                        toOne = {},
                                                        toMany = {}
                                                    ),
                                                    dict(
                                                        wbcols = {
                                                            'specialtyname': 'agent_1_specialty_3'
                                                        },
                                                        static = {},
                                                        toOne = {},
                                                        toMany = {}
                                                    ),
                                                    dict(
                                                        wbcols = {
                                                            'specialtyname': 'agent_1_specialty_4'
                                                        },
                                                        static = {},
                                                        toOne = {},
                                                        toMany = {}
                                                    )
                                                ]
                                            }
                                        ),

                                    }
                                }
                            ),
                            dict(
                                wbcols = {},
                                static={'isprimary': False},
                                toOne = {
                                    'agent': {
                                        'uploadTable': dict(
                                            wbcols = {
                                                'firstname': 'coll_2_name'
                                            },
                                            static = {
                                                'agenttype': 1
                                            },
                                            toOne = {},
                                            toMany = {
                                                'agentspecialties': [
                                                    dict(
                                                        wbcols = {
                                                            'specialtyname': 'agent_2_specialty_1'
                                                        },
                                                        static = {},
                                                        toOne = {},
                                                        toMany = {}
                                                    ),
                                                    dict(
                                                        wbcols = {
                                                            'specialtyname': 'agent_2_specialty_2'
                                                        },
                                                        static = {},
                                                        toOne = {},
                                                        toMany = {}
                                                    ),
                                                    dict(
                                                        wbcols = {
                                                            'specialtyname': 'agent_2_specialty_3'
                                                        },
                                                        static = {},
                                                        toOne = {},
                                                        toMany = {}
                                                    )
                                                ]
                                            }
                                        ),
                                        
                                    }
                                }
                            )
                        ]
                    }
                )
            }
        )
    def test_nested_to_many_parsing(self) -> None:
        json = self.plan()
        validate(json, schema)
    
    def test_basic_uploading(self) -> None:
        plan = parse_plan(self.plan())
        data = [
            dict(
                sfn='1', 
                coll_1_name='agent 1', 
                agent_1_specialty_1= 'speciality1', 
                agent_1_specialty_2= 'speciality2', 
                agent_1_specialty_3= 'speciality3', 
                agent_1_specialty_4= 'speciality4',
                coll_2_name='agent 2',
                agent_2_specialty_1='speciality5',
                agent_2_specialty_2='speciality6',
                agent_2_specialty_3='speciality7'
            ),
            dict(
                sfn='1', # this will be uploaded
                coll_1_name='agent 1', # this should be a new agent with 2 specialties
                agent_1_specialty_1= 'speciality1', 
                agent_1_specialty_2= '', 
                agent_1_specialty_3= 'speciality3', 
                agent_1_specialty_4= '',
                coll_2_name='agent 2', # this should be matched
                agent_2_specialty_1='speciality5',
                agent_2_specialty_2='speciality6',
                agent_2_specialty_3='speciality7'
            ),
            dict(
                sfn='1', # this will be uploaded
                coll_1_name='agent 1', # this should be a new agent with no specialties
                agent_1_specialty_1= '', 
                agent_1_specialty_2= '', 
                agent_1_specialty_3= '', 
                agent_1_specialty_4= '',
                coll_2_name='agent 2', # this will be a new agent
                agent_2_specialty_1='speciality5',
                agent_2_specialty_2='speciality6',
                agent_2_specialty_3=''
            ),  
            dict(
                sfn='1', # this will be matched
                coll_1_name='', # this should be a collecting event with just one collector
                agent_1_specialty_1= '', 
                agent_1_specialty_2= '', 
                agent_1_specialty_3= '', 
                agent_1_specialty_4= '',
                coll_2_name='agent 2', # this will be a matched
                agent_2_specialty_1='speciality5',
                agent_2_specialty_2='speciality6',
                agent_2_specialty_3=''
            ),
            dict(
                sfn='1', # this will be matched
                coll_1_name='', # this should be a collecting event with just one collector
                agent_1_specialty_1= '', 
                agent_1_specialty_2= '', 
                agent_1_specialty_3= '', 
                agent_1_specialty_4= '',
                coll_2_name='agent 2', # this will be a matched
                agent_2_specialty_1='speciality5',
                agent_2_specialty_2='speciality6',
                agent_2_specialty_3=''
            ),
            dict(
                sfn='1', # this will be matched
                coll_1_name='agent 1', # this should be a new agent with 2 specialties
                agent_1_specialty_1= 'speciality1', 
                agent_1_specialty_2= '', 
                agent_1_specialty_3= 'speciality3', 
                agent_1_specialty_4= '',
                coll_2_name='agent 2', # this should be matched
                agent_2_specialty_1='speciality5',
                agent_2_specialty_2='speciality6',
                agent_2_specialty_3='speciality7'
            )
        ]

        results = do_upload(self.collection, data, plan, self.agent.id)
        expected_results = [(Uploaded, -1), (Uploaded, -1), (Uploaded, -1), (Uploaded, -1), (Matched, 3), (Matched, 1)]
        for r, (e, check) in zip(results, expected_results):
            self.assertIsInstance(r.record_result, e)
            if isinstance(e, Matched):
                self.assertEqual(r.record_result.get_id(), results[check].record_result.get_id())
            
        
        agents_matching = [[(0, 1), (1, 1)], [(2, 1), (3, 1)]]
        for pair in agents_matching:
            agents_added = set()
            for idx, path in enumerate(pair):
                ce_idx, col_idx = path
                agent = (results[ce_idx].toMany['collectors'][col_idx].toOne['agent'].record_result)
                if idx == 0:
                    self.assertIsInstance(agent, Uploaded, f'record at idx {idx} was not uploaded')
                else:
                    self.assertIsInstance(agent, Matched, f'record at idx {idx} was not matched')
                agents_added.add(agent.get_id())
            self.assertEqual(len(agents_added), 1, f"Match was not successful for pair {pair}")
        
        self.assertIsInstance(results[3].toMany['collectors'][0].record_result, NullRecord)
        self.assertEqual(
            get_table('Collector').objects.filter(collectingevent_id=results[3].record_result.get_id()).count(),
            1
            )
        
        new_agents_created: Dict[Tuple[int, int], List[Any]] = {
            (0, 0): [Uploaded]*4,
            (0, 1): [Uploaded]*3,
            (1, 0): [Uploaded, NullRecord, Uploaded, NullRecord],
            (2, 0): [NullRecord]*4,
            (2, 1): [Uploaded, Uploaded, NullRecord]
        }

        for ((ce_idx, col_idx), spec_results) in new_agents_created.items():
            agent = (results[ce_idx].toMany['collectors'][col_idx].toOne['agent'])
            self.assertIsInstance(agent.record_result, Uploaded, f'failed at {(ce_idx, col_idx)}')
            self.assertTrue(get_table('Agent').objects.filter(id=agent.record_result.get_id()).exists())
            specialties = agent.toMany['agentspecialties']
            for result, expected in zip(specialties, spec_results):
                self.assertIsInstance(result.record_result, expected)
            specialty_created = spec_results.count(Uploaded)
            self.assertEqual(
                get_table('Agentspecialty').objects.filter(agent_id=agent.record_result.get_id()).count(),
                specialty_created
                )
        