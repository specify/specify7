import json
from datetime import datetime
from .test_api import ApiTests
from django.test import Client
from specifyweb.specify.record_merging import fix_record_data
from specifyweb.specify import models
from unittest.mock import patch

class ReplaceRecordTests(ApiTests):
    def test_replace_agents(self):
        c = Client()
        c.force_login(self.specifyuser)

        # Create agents and a collector relationship
        agent_1 = models.Agent.objects.create(
            id=7,
            agenttype=0,
            firstname="agent",
            lastname="007",
            specifyuser=None)
        agent_2 = models.Agent.objects.create(
            id=6,
            agenttype=0,
            firstname="agent",
            lastname="006",
            specifyuser=None)
        collecting_event = models.Collectingevent.objects.create(
            discipline=self.discipline
        )
        collector = models.Collector.objects.create(
            id=7,
            isprimary=True,
            ordernumber=1,
            agent=agent_1,
            collectingevent=collecting_event
        )

        self.collectionobjects[0].cataloger = agent_1
        self.collectionobjects[0].save()

        det_1 = models.Determination.objects.create(
            collectionobject=self.collectionobjects[0],
            iscurrent=True,
            determiner=agent_1
        )
        det_2 = models.Determination.objects.create(
            collectionobject=self.collectionobjects[0],
            iscurrent=False,
            determiner=agent_1
        )
        # Assert that the api request ran successfully
        response = c.post(
            f'/api/specify/agent/replace/{agent_2.id}/',
            data=json.dumps({
                'old_record_ids': [agent_1.id],
                'background': False
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 204)

        # Assert that the collector relationship was updated correctly to the new agent
        collector = models.Collector.objects.get(id=agent_1.id)
        self.assertEqual(collector.agent.id, 6)

        # Assert that the old agent was deleted
        with self.assertRaises(models.Agent.DoesNotExist):
            models.Agent.objects.get(id=7)

        # Assert that a new api request will not find the old agent
        response = c.post(
            f'/api/specify/agent/replace/{agent_2.id}/',
            data=json.dumps({
                'old_record_ids': [agent_1.id],
                'background': False
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 404)
        co_fetched = models.Collectionobject.objects.get(id=self.collectionobjects[0].id)
        self.assertEqual(co_fetched.cataloger_id, agent_2.id)

        self.assertTrue(models.Determination.objects.filter(iscurrent=True, id=det_1.id).exists())
        self.assertTrue(models.Determination.objects.filter(iscurrent=False, id=det_2.id).exists())

    def test_record_recursive_merge(self):
        c = Client()
        c.force_login(self.specifyuser)

        # Create agents and a collector relationship
        agent_1 = models.Agent.objects.create(
            id=4462,
            agenttype=0,
            firstname="old_agent",
            lastname="007",
            specifyuser=None)
        agent_2 = models.Agent.objects.create(
            id=4458,
            agenttype=0,
            firstname="new_agent",
            lastname="006",
            specifyuser=None)
        insitution_1 = models.Institution.objects.get(name='Test Institution')
        reference_work_1 = models.Referencework.objects.create(
            id=875,
            timestampcreated=datetime.strptime("2022-11-30 14:36:56.000", '%Y-%m-%d %H:%M:%S.%f'),
            referenceworktype=2,
            institution=insitution_1
        )

        # Create authors such that a duplication will result from the agent merge
        models.Author.objects.create(
            id=2550,
            ordernumber=7,
            agent=agent_1,
            referencework=reference_work_1,
            timestampcreated=datetime.strptime("2022-11-30 14:34:51.000", '%Y-%m-%d %H:%M:%S.%f'),
            timestampmodified=datetime.strptime("2022-11-30 14:33:30.000", '%Y-%m-%d %H:%M:%S.%f')
        )
        models.Author.objects.create(
            id=2554,
            ordernumber=2,
            agent=agent_2,
            referencework=reference_work_1,
            timestampcreated=datetime.strptime("2022-11-30 14:33:30.000", '%Y-%m-%d %H:%M:%S.%f'),
            timestampmodified=datetime.strptime("2022-11-30 14:36:56.000", '%Y-%m-%d %H:%M:%S.%f')
        )

        # Assert that the api request ran successfully
        response = c.post(
            f'/api/specify/agent/replace/{agent_2.id}/',
            data=json.dumps({
                'old_record_ids': [agent_1.id],
                'new_record_data': None,
                'background': False
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 204)

        # Assert that only one of the Authors remains
        self.assertEqual(models.Author.objects.filter(id=2550).exists(), False)
        self.assertEqual(models.Author.objects.filter(id=2554).exists(), True)

        # Asser that only one of the Agents remains
        self.assertEqual(models.Agent.objects.filter(id=4462).exists(), False)
        self.assertEqual(models.Agent.objects.filter(id=4458).exists(), True)

    def test_agent_address_replacement(self):
        c = Client()
        c.force_login(self.specifyuser)

        # Create agents and a collector relationship
        agent_1 = models.Agent.objects.create(
            id=7,
            agenttype=0,
            firstname="agent",
            lastname="007",
            specifyuser=None)
        agent_2 = models.Agent.objects.create(
            id=6,
            agenttype=0,
            firstname="agent",
            lastname="006",
            specifyuser=None)

        # Create mock addresses
        models.Address.objects.create(
            id=1,
            timestampcreated=datetime.strptime("2022-11-30 14:34:51.000", '%Y-%m-%d %H:%M:%S.%f'),
            address="1234 Main St.",
            agent=agent_1
        )
        models.Address.objects.create(
            id=2,
            timestampcreated=datetime.strptime("2022-11-30 14:33:30.000", '%Y-%m-%d %H:%M:%S.%f'),
            address="5678 Rainbow Rd.",
            agent=agent_2
        )

        # Assert that the api request ran successfully
        response = c.post(
            f'/api/specify/agent/replace/{agent_1.id}/',
            data=json.dumps({
                'old_record_ids': [agent_2.id],
                'new_record_data': None,
                'background': False
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 204)

        # Assert there is only one address the points to agent_1
        self.assertEqual(models.Address.objects.filter(agent_id=7).count(), 1)
        self.assertEqual(models.Address.objects.filter(agent_id=6).exists(), False)

    def test_agent_address_multiple_replacement(self):
        c = Client()
        c.force_login(self.specifyuser)

        # Create agents and a collector relationship
        agent_1 = models.Agent.objects.create(
            id=7,
            agenttype=0,
            firstname="agent",
            lastname="007",
            specifyuser=None)
        agent_2 = models.Agent.objects.create(
            id=6,
            agenttype=0,
            firstname="agent",
            lastname="006",
            specifyuser=None)
        agent_3 = models.Agent.objects.create(
            id=5,
            agenttype=0,
            firstname="agent",
            lastname="005",
            specifyuser=None)

        # Create mock addresses
        models.Address.objects.create(
            id=1,
            timestampcreated=datetime.strptime("2022-11-30 14:34:51.000", '%Y-%m-%d %H:%M:%S.%f'),
            address="1234 Main St.",
            agent=agent_1
        )
        models.Address.objects.create(
            id=2,
            timestampcreated=datetime.strptime("2022-11-30 14:33:30.000", '%Y-%m-%d %H:%M:%S.%f'),
            address="5678 Rainbow Rd.",
            agent=agent_2
        )
        models.Address.objects.create(
            id=3,
            timestampcreated=datetime.strptime("2022-11-30 14:32:30.000", '%Y-%m-%d %H:%M:%S.%f'),
            address="2468 Mass St.",
            agent=agent_3
        )

        # Assert that the api request ran successfully
        response = c.post(
            f'/api/specify/agent/replace/{agent_1.id}/',
            data=json.dumps({
                'old_record_ids': [
                    agent_2.id,
                    agent_3.id
                ],
                'new_record_data': {
                    'addresses': [
                        {
                            'address': '1234 Main St.',
                            'timestampcreated': '2022-11-30 14:34:51.000',
                            'agent': agent_1.id
                        },
                        {
                            'address': '5678 Rainbow Rd.',
                            'timestampcreated': '2022-11-30 14:33:30.000',
                            'agent': agent_1.id
                        },
                        {
                            'address': '2468 Mass St.',
                            'timestampcreated': '2022-11-30 14:32:30.000',
                            'agent': agent_1.id
                        },
                        {
                            'address': '1345 Jayhawk Blvd.',
                            'timestampcreated': '2022-11-30 14:34:51.000',
                            'agent': agent_1.id
                        }
                    ],
                    'jobtitle': 'shardbearer'
                },
                'background': False
            }),
            content_type='application/json')
        self.assertEqual(response.status_code, 204)

        # Assert there is only one address the points to agent_1
        self.assertEqual(models.Address.objects.filter(agent_id=7).count(), 4)
        self.assertEqual(models.Address.objects.filter(agent_id=6).exists(), False)
        self.assertEqual(models.Address.objects.filter(agent_id=5).exists(), False)

        # Assert that the new_record_data was updated in the db
        self.assertEqual(models.Agent.objects.get(id=7).jobtitle, 'shardbearer')

    def test_agents_replaced_within_collecting_event(self):
        c = Client()
        c.force_login(self.specifyuser)

        # Create agents and a collector relationship
        agent_1 = models.Agent.objects.create(
            id=7,
            agenttype=0,
            firstname="agent",
            lastname="007",
            specifyuser=None)
        agent_2 = models.Agent.objects.create(
            id=6,
            agenttype=0,
            firstname="agent",
            lastname="006",
            specifyuser=None)

        collecting_event_1 = models.Collectingevent.objects.create(
            discipline=self.discipline,
        )

        collecting_event_2 = models.Collectingevent.objects.create(
            discipline=self.discipline
        )

        collecting_event_3 = models.Collectingevent.objects.create(
            discipline=self.discipline
        )

        collector_1 = models.Collector.objects.create(
            id=10,
            isprimary=True,
            ordernumber=1,
            agent=agent_1,
            collectingevent=collecting_event_1,
            timestampcreated=datetime.strptime("2022-11-30 14:36:56.000",
                                               '%Y-%m-%d %H:%M:%S.%f'),
            timestampmodified=datetime.strptime("2022-11-30 14:36:56.000",
                                                '%Y-%m-%d %H:%M:%S.%f'),
        )

        collector_2 = models.Collector.objects.create(
            id=11,
            isprimary=False,
            ordernumber=2,
            agent=agent_2,
            collectingevent=collecting_event_1,
            timestampcreated=datetime.strptime("2022-11-30 14:39:56.000",
                                               '%Y-%m-%d %H:%M:%S.%f'),
            timestampmodified=datetime.strptime("2022-11-30 14:39:56.000",
                                                '%Y-%m-%d %H:%M:%S.%f')
        )

        collector_3 = models.Collector.objects.create(
            id=12,
            isprimary=True,
            ordernumber=1,
            agent=agent_1,
            collectingevent=collecting_event_2
        )

        collector_4 = models.Collector.objects.create(
            id=13,
            isprimary=True,
            ordernumber=1,
            agent=agent_2,
            collectingevent=collecting_event_3
        )

        # Assert that the api request ran successfully
        response = c.post(
            f'/api/specify/agent/replace/{agent_2.id}/',
            data=json.dumps({
                'old_record_ids': [agent_1.id],
                'new_record_data': None,
                'background': False
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 204)

        self.assertEqual(models.Collector.objects.filter(id=10).exists(), True)
        self.assertEqual(models.Collector.objects.filter(id=11).exists(), False)

        self.assertCountEqual(models.Collector.objects.filter(agent_id=6).
                              values_list('id', flat=True),
                              [10, 12, 13])

        # Assert that only one of the Agents remains
        self.assertEqual(models.Agent.objects.filter(id=6).exists(), True)
        self.assertEqual(models.Agent.objects.filter(id=7).exists(), False)

    def test_rollback_on_exception(self):
        c = Client()
        c.force_login(self.specifyuser)

        agent_1 = models.Agent.objects.create(
            id=7,
            agenttype=0,
            firstname="agent",
            lastname="007",
            specifyuser=self.specifyuser)
        agent_2 = models.Agent.objects.create(
            id=6,
            agenttype=0,
            firstname="agent",
            lastname="006",
            specifyuser=None)

        collecting_event_1 = models.Collectingevent.objects.create(
            discipline=self.discipline
        )

        collecting_event_2 = models.Collectingevent.objects.create(
            discipline=self.discipline
        )
        collector_1 = models.Collector.objects.create(
            id=10,
            isprimary=True,
            ordernumber=2,  # Giving higher order number because
            # higher gets deleted in dedup
            agent=agent_1,
            collectingevent=collecting_event_1
        )

        collector_2 = models.Collector.objects.create(
            id=11,
            isprimary=True,
            ordernumber=1,
            agent=agent_2,
            collectingevent=collecting_event_1,
            createdbyagent=agent_1
        )

        collector_3 = models.Collector.objects.create(
            id=12,
            isprimary=True,
            ordernumber=1,
            agent=agent_1,
            collectingevent=collecting_event_2
        )

        # Create dependent resource for testing deletion
        models.Address.objects.create(
            id=1,
            timestampcreated=datetime.strptime("2022-11-30 14:34:51.000",
                                               '%Y-%m-%d %H:%M:%S.%f'),
            address="1234 Main St.",
            agent=agent_1
        )

        # Business rule exception would be raised here.
        # Agent cannot be deleted while associated to
        # specify user
        response = c.post(
            f'/api/specify/agent/replace/{agent_2.id}/',
            data=json.dumps({
                'old_record_ids': [agent_1.id],
                'new_record_data': None,
                'background': False
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 500)

        # Assert that error happened due to agent related to specifyuser
        response_specify_user = 'agent cannot be deleted while associated with a specifyuser' in str(
            response.content.decode())
        self.assertEqual(response_specify_user, True)

        # Agent should not be deleted
        self.assertEqual(models.Agent.objects.filter(id=7).exists(), True)

        # Dependent address should not be deleted
        self.assertEqual(models.Address.objects.filter(id=1, agent_id=7).exists(), True)

        # All collectors for deleting from before should exist
        self.assertCountEqual(models.Collector.objects.filter(agent_id=7).
                              values_list('id', flat=True), [10, 12])

        # Relationship to agent should not be saved
        self.assertEqual(models.Collector.objects.filter(id=11,
                                                         createdbyagent_id=7).exists(), True)

    def test_ordering_fix_on_agent_specialty(self):
        c = Client()
        c.force_login(self.specifyuser)

        agent_1 = models.Agent.objects.create(
            id=7,
            agenttype=0,
            firstname="agent",
            lastname="007",
            specifyuser=None)
        agent_2 = models.Agent.objects.create(
            id=6,
            agenttype=0,
            firstname="agent",
            lastname="006",
            specifyuser=None)

        agent_1_speciality_1 = models.Agentspecialty.objects.create(
            id=1,
            ordernumber=0,
            agent=agent_1,
            specialtyname='agent_1_speciality_1'
        )
        agent_1_speciality_2 = models.Agentspecialty.objects.create(
            id=2,
            ordernumber=1,
            agent=agent_1,
            specialtyname='agent_1_speciality_2'
        )
        agent_2_speciality_1 = models.Agentspecialty.objects.create(
            id=3,
            ordernumber=0,
            agent=agent_2,
            specialtyname="agent_2_specialty_1",
            version=0
        )
        agent_2_speciality_2 = models.Agentspecialty.objects.create(
            id=4,
            ordernumber=1,
            agent=agent_2,
            specialtyname="agent_2_specialty_2",
            version=0
        )
        response = c.post(f'/api/specify/agent/replace/{agent_2.id}/',
                          data=json.dumps({
                              'old_record_ids': [agent_1.id],
                              'new_record_data': {
                                  'agentspecialties': [
                                      {
                                          'specialtyname': 'test_name_1',
                                          'ordernumber': 0,
                                      },
                                      {
                                          'id': 4,
                                          'specialtyname': 'test_name_0',
                                          'ordernumber': 1,
                                          'version': 0
                                      },
                                      {
                                          'id': 3,
                                          'specialtyname': 'test_name_2',
                                          'ordernumber': 0,
                                          'version': 0
                                      },
                                      {
                                          'specialtyname': 'test_name_3',
                                          'ordernumber': 0
                                      }
                                  ]
                              },
                              'background': False
                          }), content_type='application/json')

        self.assertEqual(response.status_code, 204)

        self.assertEqual(models.Agentspecialty.objects.filter(id__in=[1, 2]).count(), 0)

        # Assert whatver front-end sent is preserved
        self.assertEqual(models.Agentspecialty.objects.get(id=4).ordernumber, 1)
        self.assertEqual(models.Agentspecialty.objects.get(id=4).specialtyname,
                         'test_name_0')

        self.assertEqual(models.Agentspecialty.objects.get(id=3).ordernumber, 0)
        self.assertEqual(models.Agentspecialty.objects.get(id=3).specialtyname,
                         'test_name_2')

        # Assert correct count specialties created
        self.assertEqual(models.Agentspecialty.objects.filter(agent_id=6).count(), 4)
        self.assertEqual(models.Agentspecialty.objects.filter(specialtyname__in=['test_name_1', 'test_name_3']).count(),
                         2)
    
    @patch('specifyweb.attachment_gw.views.delete_attachment_file')
    def test_attachment_preserved(self, delete_attachment_mock):
        c = Client()
        c.force_login(self.specifyuser)
        agent_0 = models.Agent.objects.create(
        agenttype=0
        )
        agent_1 = models.Agent.objects.create(
            agenttype=0
        )
        attachment_0 = models.Attachment.objects.create(
            attachmentlocation="place1.jpg" 
        )
        attachment_1 = models.Attachment.objects.create(
            attachmentlocation="place2.jpg" 
        )
        agent_attachment_0 = models.Agentattachment.objects.create(
            agent=agent_0,
            ordinal=0,
            attachment=attachment_0
        )
        agent_attachment_1 = models.Agentattachment.objects.create(
            agent=agent_1,
            ordinal=0,
            attachment=attachment_1
        )
        response = c.post(
            f'/api/specify/agent/replace/{agent_0.id}/',
            data=json.dumps({
                'old_record_ids': [
                    agent_1.id
                ],
                'new_record_data': {
                    'agentattachments': []
                },
                'background': False
            }),
            content_type='application/json'
        )
        # wouldnt' delete the other attachment file for now (an edge case)
        self.assertEqual(response.status_code, 204)
        delete_attachment_mock.assert_called_once_with(attachment_0.attachmentlocation)
    
    def test_fix_record_data(self):
        """
            The merging endpoint requries the (JSON) serialized attributes of the "target"
            record to be included in the body of the POST request.

            This JSON data needs to be processed and all occurences of
            /api/specify/<model>/<id> need to be replaced to
            /api/specify/<model>/<id> if the <id> is the id of one
            of the agents which are going to be deleted.

            This is accomplished via the fix_record_data function
        """

        target_model = models.datamodel.get_table("agent")
        old_record_ids = [8680, 1754]
        new_record_id = 47290

        def _get_record_data(pre_merge=False):
            return {
                "id": new_record_id,
                "abbreviation": None,
                "agenttype": 1,
                "datetype": None,
                "email": None,
                "firstname": "Agent",
                "guid": "f6ab4408-524c-4582-b5ac-d6768962b65b",
                "lastname": "Test",
                "timestampcreated": "2023-09-22T01:42:42",
                "timestampmodified": "2023-09-22T01:42:42",
                "title": "dr",
                "version": 0,
                "collcontentcontact": {"invalid_dict": True},
                "invalid_field": "some value",
                "createdbyagent": f"/api/specify/agent/{old_record_ids[0] if pre_merge else new_record_id}/",
                "division": "/api/specify/division/2/",
                "instcontentcontact": None,
                "specifyuser": "/api/specify/specifyuser/47290/",
                "addresses": [
                    {
                        "id": 6949,
                        "address": "1234 Agent Rd",
                        "city": "Lawrence",
                        "state": "KS",
                        "timestampcreated": "2023-09-22T01:42:42",
                        "timestampmodified": "2023-09-22T01:42:42",
                        "typeofaddr": None,
                        "version": 0,
                        "agent": f"/api/specify/agent/{new_record_id}/",
                        "createdbyagent": f"/api/specify/agent/{old_record_ids[0] if pre_merge else new_record_id}/",
                        "modifiedbyagent": None,
                        "divisions": "/api/specify/division/?address=6949",
                        "insitutions": "/api/specify/institution/?address=6949",
                        "resource_uri": "/api/specify/address/6949/"
                    }
                ],
                "orgmembers": f"/api/specify/agent/?organization={new_record_id}",
                "agentattachments": [],
                "agentgeographies": [],
                "identifiers": [],
                "agentspecialties": [
                    {
                        "id": 55,
                        "ordernumber": 0,
                        "specialtyname": "TestSpec",
                        "timestampcreated": "2023-09-22T01:42:42",
                        "timestampmodified": "2023-09-22T01:42:42",
                        "version": 0,
                        # Fields like this don't matter since they are reset while putting by put_resource
                        "agent": f"/api/specify/agent/{new_record_id}/",
                        "createdbyagent": f"/api/specify/agent/{old_record_ids[1] if pre_merge else new_record_id}/",
                        "modifiedbyagent": f"/api/specify/agent/{old_record_ids[0] if pre_merge else new_record_id}/",
                        "resource_uri": "/api/specify/agentspecialty/55/"
                    },
                ],
                "variants": [
                    {
                        "id": 31390,
                        "country": None,
                        "language": None,
                        "name": None,
                        "timestampcreated": "2023-09-22T01:42:42",
                        "timestampmodified": "2023-09-22T01:42:42",
                        "vartype": 7,
                        "variant": "Dr",
                        "version": 0,
                        "agent": f"/api/specify/agent/{new_record_id}/",
                        "createdbyagent": "/api/specify/agent/28754/",
                        "modifiedbyagent": None,
                        "resource_uri": "/api/specify/agentvariant/31390/"
                    }
                ],
                "collectors": f"/api/specify/collector/?agent={new_record_id}",
                "groups": [
                    {
                        "id": 2510,
                        "ordernumber": 0,
                        "remarks": None,
                        "timestampcreated": "2023-09-22T01:42:42",
                        "timestampmodified": "2023-09-22T01:42:42",
                        "version": 0,
                        "createdbyagent": f"/api/specify/agent/{new_record_id}/",
                        "division": "/api/specify/division/2/",
                        "group": f"/api/specify/agent/{old_record_ids[1] if pre_merge else new_record_id}/",
                        "member": f"/api/specify/agent/{old_record_ids[0] if pre_merge else new_record_id}/",
                        "modifiedbyagent": None,
                        "resource_uri": "/api/specify/groupperson/2510/"
                    },
                    {
                        "id": 2511,
                        "ordernumber": 1,
                        "remarks": None,
                        "timestampcreated": "2023-09-22T01:42:42",
                        "timestampmodified": "2023-09-22T01:42:42",
                        "version": 0,
                        "createdbyagent": f"/api/specify/agent/{old_record_ids[0] if pre_merge else new_record_id}/",
                        "division": "/api/specify/division/2/",
                        "group": f"/api/specify/agent/{new_record_id}/",
                        "member": "/api/specify/agent/1739/",
                        "modifiedbyagent": f"/api/specify/agent/{old_record_ids[1] if pre_merge else new_record_id}/",
                        "resource_uri": "/api/specify/groupperson/2511/"
                    },
                    {
                        "id": 2512,
                        "ordernumber": 2,
                        "remarks": None,
                        "timestampcreated": "2023-09-22T01:42:42",
                        "timestampmodified": "2023-09-22T01:42:42",
                        "version": 0,
                        "createdbyagent": "/api/specify/agent/28754/",
                        "division": "/api/specify/division/2/",
                        "group": f"/api/specify/agent/{old_record_ids[1] if pre_merge else new_record_id}/",
                        "member": f"/api/specify/agent/{old_record_ids[1] if pre_merge else new_record_id}/",
                        "modifiedbyagent": None,
                        "resource_uri": "/api/specify/groupperson/2512/"
                    }
                ],
                "members": f"/api/specify/groupperson/?member={old_record_ids[0]}",
                "resource_uri": f"/api/specify/agent/{new_record_id}/",
                "text1": f"/api/specify/{old_record_ids[0]}"
            }

        merged_data = fix_record_data(_get_record_data(True), target_model, target_model.name.lower(), new_record_id,
                                      old_record_ids)

        self.assertDictEqual(merged_data, _get_record_data())

    def test_replace_localities(self):
        c = Client()
        c.force_login(self.specifyuser)

        # Create localities
        locality_1 = models.Locality.objects.create(
            id=1,
            localityname="locality_1",
            discipline=self.discipline
        )
        locality_2 = models.Locality.objects.create(
            id=2,
            localityname="locality_2",
            discipline=self.discipline
        )
        localitydetail = models.Localitydetail.objects.create(id=1, locality=locality_1, island='karate island')
        geocoorddetail = models.Geocoorddetail.objects.create(id=1, locality=locality_1)
        collectingevent = models.Collectingevent.objects.create(discipline=self.discipline, locality=locality_1)
        paleocontext = models.Paleocontext.objects.create(discipline=self.discipline)
        locality_1.localitydetail = localitydetail
        locality_1.paleocontext = paleocontext
        locality_1.save()

        # Assert that the api request ran successfully
        response = c.post(
            f'/api/specify/locality/replace/{locality_2.id}/',
            data=json.dumps({
                'old_record_ids': [locality_1.id],
                'background': False
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 204)

        # Assert that the old locality was deleted
        with self.assertRaises(models.Locality.DoesNotExist):
            models.Locality.objects.get(id=locality_1.id)

        # Assert that the dependent records of locality were deleted. (localitydetail, geocoorddetail)
        self.assertFalse(models.Localitydetail.objects.filter(id=localitydetail.id).exists())
        self.assertFalse(models.Geocoorddetail.objects.filter(id=geocoorddetail.id).exists())

        # Assert that the locality's independent relationships, with a corresponding real database column,
        # were updated correctly to the new locality. (collectingevent, geography)
        collectingevent = models.Collectingevent.objects.get(id=collectingevent.id)
        self.assertEqual(collectingevent.locality.id, locality_2.id)

        # Assert that the old locality's independent relationships, without a corresponding real database column,
        # were not deleted. (paleocontext)
        self.assertTrue(models.Paleocontext.objects.filter(id=paleocontext.id).exists())

        # Assert that a new api request will not find the old locality
        response = c.post(
            f'/api/specify/locality/replace/{locality_2.id}/',
            data=json.dumps({
                'old_record_ids': [locality_1.id],
                'background': False
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 404)

    def test_replace_collecting_events(self):
        c = Client()
        c.force_login(self.specifyuser)

        # Create collecting events
        collecting_event_1 = models.Collectingevent.objects.create(discipline=self.discipline)
        collecting_event_2 = models.Collectingevent.objects.create(discipline=self.discipline)
        collecting_event_3 = models.Collectingevent.objects.create(discipline=self.discipline)
        collecting_event_attribute = models.Collectingeventattribute.objects.create(discipline=self.discipline)
        collecting_trip = models.Collectingtrip.objects.create(discipline=self.discipline)
        locality = models.Locality.objects.create(discipline=self.discipline)
        paleo_context = models.Paleocontext.objects.create(discipline=self.discipline)
        collection_object = self.collectionobjects[0]
        collection_object.collectingevent = collecting_event_1
        collection_object.save()
        collecting_event_1.collectingeventattribute = collecting_event_attribute
        collecting_event_1.collectingtrip = collecting_trip
        collecting_event_1.paleocontext = paleo_context
        collecting_event_1.save()
        collecting_event_3.collectingtrip = collecting_trip
        collecting_event_3.paleocontext = paleo_context
        collecting_event_3.save()
        collector_1 = models.Collector.objects.create(
            isprimary=True, ordernumber=1, agent=self.agent, collectingevent=collecting_event_1)
        collector_2 = models.Collector.objects.create(
            isprimary=True, ordernumber=1, agent=self.agent, collectingevent=collecting_event_2)
        collector_3 = models.Collector.objects.create(
            isprimary=True, ordernumber=1, agent=self.agent, collectingevent=collecting_event_3)

        # Assert that the api request ran successfully
        response = c.post(
            f'/api/specify/collectingevent/replace/{collecting_event_2.id}/',
            data=json.dumps({
                'old_record_ids': [collecting_event_1.id, collecting_event_3.id],
                'background': False
            }),
            content_type='application/json'
        )
        print(response.content.decode())
        self.assertEqual(response.status_code, 204)

        # Assert that the old collecting event was deleted
        with self.assertRaises(models.Collectingevent.DoesNotExist):
            models.Collectingevent.objects.get(id=collecting_event_1.id)

        # Assert that the dependent records of the old collecting event were deleted. (collectingeventattribute)
        self.assertFalse(models.Collectingeventattribute.objects.filter(id=collecting_event_attribute.id).exists())

        # Assert that the old collecting event's independent relationships, with a corresponding real database column,
        # were updated correctly to the new collecting event. (collectingtrip, locality, paleocontext)
        self.assertEqual(collecting_trip.collectingevents.filter(id=collecting_event_2.id).count(), 0)
        self.assertEqual(locality.collectingevents.filter(id=collecting_event_2.id).count(), 0)
        self.assertEqual(paleo_context.collectingevents.filter(id=collecting_event_2.id).count(), 0)
        collecting_event_2 = models.Collectingevent.objects.get(id=collecting_event_2.id)
        collecting_event_2.collectingtrip = collecting_trip
        collecting_event_2.locality = locality
        collecting_event_2.paleocontext = paleo_context
        collecting_event_2.save()
        collecting_trip = models.Collectingtrip.objects.get(id=collecting_trip.id)
        locality = models.Locality.objects.get(id=locality.id)
        paleo_context = models.Paleocontext.objects.get(id=paleo_context.id)
        self.assertEqual(collecting_trip.collectingevents.filter(id=collecting_event_2.id).count(), 1)
        self.assertEqual(locality.collectingevents.filter(id=collecting_event_2.id).count(), 1)
        self.assertEqual(paleo_context.collectingevents.filter(id=collecting_event_2.id).count(), 1)

        # Assert that the collecting event's independent relationships, without a corresponding real database column,
        # were not deleted. (collectingobjects)
        self.assertTrue(models.Collectionobject.objects.filter(id=collection_object.id).exists())

        # Assert that the collectors were updated correctly to the new collecting event.
        # Also, assert that remove duplicate collector records with the same agent were deleted.
        self.assertEqual(models.Collector.objects.filter(agent=self.agent).count(), 1)
        self.assertEqual(models.Collector.objects.filter(id=collector_1.id).count(), 0)
        self.assertEqual(models.Collector.objects.filter(id=collector_2.id).count(), 1)
        self.assertEqual(models.Collector.objects.filter(id=collector_3.id).count(), 0)

        # Assert that a new api request will not find the old collection event
        response = c.post(
            f'/api/specify/collectingevent/replace/{collecting_event_2.id}/',
            data=json.dumps({
                'old_record_ids': [collecting_event_1.id],
                'background': False
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 404)

    def test_replace_paleo_contexts(self):
        c = Client()
        c.force_login(self.specifyuser)

        # Create paleo contexts
        paleo_context_1 = models.Paleocontext.objects.create(discipline=self.discipline)
        paleo_context_2 = models.Paleocontext.objects.create(discipline=self.discipline)
        biostrat = models.Geologictimeperiod.objects.create(
            isaccepted=True, isbiostrat=True, name='biostrat', rankid=1000,
            definition=self.geologictimeperiodtreedef,
            definitionitem=self.geologictimeperiodtreedef.treedefitems.create(name='biostrat', rankid=1000),
            parent=None)
        locality = models.Locality.objects.create(discipline=self.discipline, paleocontext=paleo_context_1)
        collecting_event = models.Collectingevent.objects.create(
            discipline=self.discipline,
            paleocontext=paleo_context_1)
        collection_object = self.collectionobjects[0]
        collection_object.paleocontext = paleo_context_1
        collection_object.save()
        paleo_context_1.biostrat = biostrat
        paleo_context_1.save()

        # Assert that the api request ran successfully
        response = c.post(
            f'/api/specify/paleocontext/replace/{paleo_context_2.id}/',
            data=json.dumps({
                'old_record_ids': [paleo_context_1.id],
                'background': False
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 204)

        # Assert that the old paleo context was deleted
        with self.assertRaises(models.Paleocontext.DoesNotExist):
            models.Paleocontext.objects.get(id=paleo_context_1.id)

        # NOTE: There are no dependent relcations of paleo context to test.

        # Assert that the old paleo context's independent relationships, with a corresponding real database column,
        # were updated correctly to the new paleo context. (biostrat, chronosstrat, lithostrat)
        biostrat = models.Geologictimeperiod.objects.get(id=biostrat.id)
        paleo_context_2.biostrat = biostrat
        paleo_context_2.save()
        biostrat = models.Geologictimeperiod.objects.get(id=biostrat.id)
        self.assertEqual(paleo_context_2.biostrat.id, biostrat.id)
        self.assertTrue(biostrat.biostratspaleocontext.filter(id=paleo_context_2.id).exists())

        # Assert that the paleo context's independent relationships, without a corresponding real database column,
        # were not deleted. (localities, collectingevents, collectionobjects)
        self.assertTrue(models.Locality.objects.filter(id=locality.id).exists())
        self.assertTrue(models.Collectingevent.objects.filter(id=collecting_event.id).exists())
        self.assertTrue(models.Collectionobject.objects.filter(id=collection_object.id).exists())

        # Assert that a new api request will not find the old paleo context
        response = c.post(
            f'/api/specify/paleocontext/replace/{paleo_context_2.id}/',
            data=json.dumps({
                'old_record_ids': [paleo_context_1.id],
                'background': False
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 404)