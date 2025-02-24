
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
