from unittest import skip
from specifyweb.specify import models
from specifyweb.specify.tests.test_api import ApiTests
from ..exceptions import BusinessRuleException


class AccessionAgentTests(ApiTests):
    @skip("rule was removed in 17e82c6157")
    def test_no_duped_agents_in_accession(self):
        accession = models.Accession.objects.create(
            accessionnumber='a',
            division=self.division)

        accession.accessionagents.create(
            agent=self.agent,
            role='Collector')

        with self.assertRaises(BusinessRuleException):
            accession.accessionagents.create(
                agent=self.agent,
                role='Donor')

    @skip("rule was removed in 17e82c6157")
    def test_no_duped_roles_in_accession(self):
        accession = models.Accession.objects.create(
            accessionnumber='a',
            division=self.division)

        accession.accessionagents.create(
            agent=models.Agent.objects.create(
                agenttype=0,
                firstname="Test1",
                lastname="Agent",
                division=self.division),
            role="Collector")

        with self.assertRaises(BusinessRuleException):
            accession.accessionagents.create(
                agent=models.Agent.objects.create(
                    agenttype=0,
                    firstname="Test2",
                    lastname="Agent",
                    division=self.division),
                role="Collector")

        accession.accessionagents.create(
            agent=models.Agent.objects.create(
                agenttype=0,
                firstname="Test2",
                lastname="Agent",
                division=self.division),
            role="Donor")

    def test_agent_and_roles_can_be_duped_in_different_accessions(self):
        accession1 = models.Accession.objects.create(
            accessionnumber='a',
            division=self.division)

        accession2 = models.Accession.objects.create(
            accessionnumber='b',
            division=self.division)

        accession1.accessionagents.create(
            agent=self.agent,
            role="Collector")

        accession2.accessionagents.create(
            agent=self.agent,
            role="Collector")

    @skip("rule was removed in 17e82c6157")
    def test_no_duped_agents_in_repository_agreement(self):
        repository_agreement = models.Repositoryagreement.objects.create(
            repositoryagreementnumber='foo',
            division=self.division,
            originator=self.agent)

        repository_agreement.repositoryagreementagents.create(
            agent=self.agent,
            role='Collector')

        with self.assertRaises(BusinessRuleException):
            repository_agreement.repositoryagreementagents.create(
                agent=self.agent,
                role='Donor')

    @skip("rule was removed in 17e82c6157")
    def test_no_duped_roles_in_repository_agreement(self):
        repository_agreement = models.Repositoryagreement.objects.create(
            repositoryagreementnumber='foo',
            division=self.division,
            originator=self.agent)

        repository_agreement.repositoryagreementagents.create(
            agent=models.Agent.objects.create(
                agenttype=0,
                firstname="Test1",
                lastname="Agent",
                division=self.division),
            role="Collector")

        with self.assertRaises(BusinessRuleException):
            repository_agreement.repositoryagreementagents.create(
                agent=models.Agent.objects.create(
                    agenttype=0,
                    firstname="Test2",
                    lastname="Agent",
                    division=self.division),
                role="Collector")

        repository_agreement.repositoryagreementagents.create(
            agent=models.Agent.objects.create(
                agenttype=0,
                firstname="Test2",
                lastname="Agent",
                division=self.division),
            role="Donor")

    def test_agents_and_roles_can_be_duped_in_different_repository_agreements(self):
        repository_agreement1 = models.Repositoryagreement.objects.create(
            repositoryagreementnumber='1',
            division=self.division,
            originator=self.agent)

        repository_agreement2 = models.Repositoryagreement.objects.create(
            repositoryagreementnumber='2',
            division=self.division,
            originator=self.agent)

        repository_agreement1.repositoryagreementagents.create(
            agent=self.agent,
            role="Collector")

        repository_agreement2.repositoryagreementagents.create(
            agent=self.agent,
            role="Collector")

    def test_add_existing_agent_to_accession(self):
        accession = models.Accession.objects.create(
            accessionnumber='A-AGENT-001',
            division=self.division,
        )
        accession_agent = accession.accessionagents.create(
            agent=self.agent,
            role='Collector'
        )
        fetched = models.Accessionagent.objects.get(
            id=accession_agent.id
        )
        self.assertEqual(fetched.accession, accession)
        self.assertEqual(fetched.agent, self.agent)
        self.assertEqual(fetched.role, 'Collector')

    def test_create_new_agent_for_accession(self):
        accession = models.Accession.objects.create(
            accessionnumber='A-NEW-AGENT-001',
            division=self.division
        )

        new_agent = models.Agent.objects.create(
            agenttype=0, #means its a person
            firstname='New',
            lastname='Donor',
            division=self.division
        )

        accession_agent = accession.accessionagents.create(
            agent=new_agent,
            role='Donor'
        )

        fetched_link = models.Accessionagent.objects.get(
            id=accession_agent.id
        )
        fetched_agent = models.Agent.objects.get(
            id=new_agent.id
        )

        self.assertEqual(fetched_agent.firstname, 'New')
        self.assertEqual(fetched_agent.lastname, 'Donor')
        self.assertEqual(fetched_agent.agenttype, 0)
        self.assertEqual(fetched_link.accession, accession)
        self.assertEqual(fetched_link.agent, fetched_agent)
        self.assertEqual(fetched_link.role, 'Donor')
