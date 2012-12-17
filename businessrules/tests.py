import datetime

from specify import models
from specify.api_tests import ApiTests
from businessrules.models import BusinessRuleException

class AccessionTests(ApiTests):
    def test_accession_number_unique_to_division(self):
        accession1 = models.Accession.objects.create(
            accessionnumber='a',
            division=self.division)

        with self.assertRaises(BusinessRuleException):
            accession2 = models.Accession.objects.create(
                accessionnumber='a',
                division=self.division)

        self.assertEqual(
            models.Accession.objects.filter(accessionnumber='a', division=self.division).count(),
            1)

        different_division = models.Division.objects.create(institution=self.institution)

        accession2 = models.Accession.objects.create(
            accessionnumber='a',
            division=different_division)

        accessions = models.Accession.objects.filter(accessionnumber='a')
        self.assertEqual(accessions.count(), 2)
        self.assertNotEqual(*[a.division for a in accessions])

    def test_no_delete_if_collection_objects_exist(self):
        accession = models.Accession.objects.create(
            accessionnumber='a',
            division=self.division)

        accession.collectionobjects.add(*self.collectionobjects)

        self.assertEqual(
            models.Collectionobject.objects.filter(
                id__in=[co.id for co in self.collectionobjects],
                accession=accession).count(),
            len(self.collectionobjects))

        with self.assertRaises(BusinessRuleException):
            accession.delete()

        accession.collectionobjects.clear()

        accession.delete()

        self.assertEqual(
            models.Collectionobject.objects.filter(id__in=[co.id for co in self.collectionobjects]).count(),
            len(self.collectionobjects))

class AccessionAgentTests(ApiTests):
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

class AgentTests(ApiTests):
    def test_agent_delete_cascades(self):
        agent = models.Agent.objects.create(
            agenttype=0,
            firstname="Test",
            lastname="Agent",
            division=self.division,)

        agent.addresses.create(address="somewhere")

        geography = models.Geography.objects.create(
            name="Earth",
            definition=self.geographytreedef,
            definitionitem=self.geographytreedef.treedefitems.all()[0]
            )
        agent.agentgeographies.create(geography=geography)

        agent.agentspecialties.create(
            ordernumber=0,
            specialtyname="testing")

        agent.delete()

    def test_specifyuser_blocks_delete(self):
        agent = models.Agent.objects.create(
            agenttype=0,
            firstname="Test",
            lastname="Agent",
            division=self.division,
            specifyuser=self.specifyuser)

        with self.assertRaises(BusinessRuleException):
            agent.delete()

        agent.specifyuser = None
        with self.assertRaises(BusinessRuleException):
            agent.delete()

        agent.save()
        agent.delete()

    def test_other_and_group_do_not_have_addresses(self):
        from specify.agent_types import agent_types
        agent = models.Agent.objects.create(
            agenttype=agent_types.index('Person'),
            firstname="Test",
            lastname="Agent",
            division=self.division)

        agent.addresses.create(address="somewhere")

        models.Address.objects.get(agent=agent)

        agent.agenttype = agent_types.index('Other')
        agent.save()

        with self.assertRaises(models.Address.DoesNotExist):
            models.Address.objects.get(agent=agent)

        agent.addresses.create(address="somewhere")

        models.Address.objects.get(agent=agent)

        agent.agenttype = agent_types.index('Group')
        agent.save()

        with self.assertRaises(models.Address.DoesNotExist):
            models.Address.objects.get(agent=agent)


class AppraisalTests(ApiTests):
    def test_appraisal_number_is_unique_in_accession(self):
        accession = models.Accession.objects.create(
            accessionnumber='a',
            division=self.division)

        accession.appraisals.create(
            appraisaldate=datetime.date.today(),
            appraisalnumber='1',
            agent=self.agent)

        with self.assertRaises(BusinessRuleException):
            accession.appraisals.create(
                appraisaldate=datetime.date.today(),
                appraisalnumber='1',
                agent=self.agent)

        accession.appraisals.create(
            appraisaldate=datetime.date.today(),
            appraisalnumber='2',
            agent=self.agent)

    def test_appraisal_number_can_be_duped_if_not_in_accession(self):
        models.Appraisal.objects.create(
            appraisaldate=datetime.date.today(),
            appraisalnumber='1',
            agent=self.agent)

        models.Appraisal.objects.create(
            appraisaldate=datetime.date.today(),
            appraisalnumber='2',
            agent=self.agent)

class AuthorTests(ApiTests):
    def test_agent_is_unique_in_referencework(self):
        referencework = models.Referencework.objects.create(
            referenceworktype=0)

        referencework.authors.create(
            ordernumber=0,
            agent=self.agent)

        with self.assertRaises(BusinessRuleException):
            referencework.authors.create(
                ordernumber=1,
                agent=self.agent)

        referencework.authors.create(
            ordernumber=1,
            agent=models.Agent.objects.create(
                agenttype=0,
                firstname="Test2",
                lastname="Agent",
                division=self.division))

class BrowseAgentTests(ApiTests):
    def test_is_unique_in_borrow(self):
        borrow = models.Borrow.objects.create(
            collectionmemberid=self.collection.id,
            invoicenumber='foo')

        borrow.borrowagents.create(
            agent=self.agent,
            collectionmemberid=self.collection.id,
            role='Borrower')

        with self.assertRaises(BusinessRuleException):
            borrow.borrowagents.create(
                agent=self.agent,
                collectionmemberid=self.collection.id,
                role='Borrower')

        borrow.borrowagents.create(
            agent=self.agent,
            collectionmemberid=self.collection.id,
            role='Lender')

class CollectionTests(ApiTests):
    def test_collection_name_unique_in_discipline(self):
        with self.assertRaises(BusinessRuleException):
            models.Collection.objects.create(
                catalognumformatname='test',
                collectionname=self.collection.collectionname,
                isembeddedcollectingevent=False,
                discipline=self.discipline)

        models.Collection.objects.create(
            catalognumformatname='test',
            collectionname=self.collection.collectionname + 'foo',
            isembeddedcollectingevent=False,
            discipline=self.discipline)

class CollectionObjectTests(ApiTests):
    def test_catalog_number_unique_in_collection(self):
        with self.assertRaises(BusinessRuleException):
            models.Collectionobject.objects.create(
                collection=self.collection,
                catalognumber=self.collectionobjects[0].catalognumber)

        models.Collectionobject.objects.create(
            collection=self.collection,
            catalognumber=self.collectionobjects[0].catalognumber + 'foo')

class CollectorTests(ApiTests):
    def test_agent_unique_in_collecting_event(self):
        collectingevent = models.Collectingevent.objects.create(
            discipline=self.discipline)

        collectingevent.collectors.create(
            isprimary=True,
            ordernumber=0,
            agent=self.agent)

        with self.assertRaises(BusinessRuleException):
            collectingevent.collectors.create(
                isprimary=False,
                ordernumber=1,
                agent=self.agent)

class DisciplineTests(ApiTests):
    def test_name_unique_in_division(self):
        models.Discipline.objects.create(
            name='foobar',
            geologictimeperiodtreedef=self.geologictimeperiodtreedef,
            geographytreedef=self.geographytreedef,
            division=self.division,
            datatype=self.datatype)

        with self.assertRaises(BusinessRuleException):
            models.Discipline.objects.create(
                name='foobar',
                geologictimeperiodtreedef=self.geologictimeperiodtreedef,
                geographytreedef=self.geographytreedef,
                division=self.division,
                datatype=self.datatype)

class DivisionTests(ApiTests):
    def test_name_unique_in_institution(self):
        models.Division.objects.create(
            institution=self.institution,
            name='foobar')

        with self.assertRaises(BusinessRuleException):
            models.Division.objects.create(
                institution=self.institution,
                name='foobar')

class GiftTests(ApiTests):
    def test_gift_number_unique_in_discipline(self):
        models.Gift.objects.create(
            giftnumber='1',
            discipline=self.discipline)

        with self.assertRaises(BusinessRuleException):
            models.Gift.objects.create(
                giftnumber='1',
                discipline=self.discipline)

        models.Gift.objects.create(
            giftnumber='2',
            discipline=self.discipline)

class LoanTests(ApiTests):
    def test_loan_number_unique_in_discipline(self):
        models.Loan.objects.create(
            loannumber='1',
            discipline=self.discipline)

        with self.assertRaises(BusinessRuleException):
            models.Loan.objects.create(
                loannumber='1',
                discipline=self.discipline)

        models.Loan.objects.create(
            loannumber='2',
            discipline=self.discipline)


class PicklistTests(ApiTests):
    def test_name_unique_in_collection(self):
        models.Picklist.objects.create(
            collection=self.collection,
            issystem=False,
            name='foobar',
            readonly=False,
            type=0)

        with self.assertRaises(BusinessRuleException):
            models.Picklist.objects.create(
                collection=self.collection,
                issystem=False,
                name='foobar',
                readonly=False,
                type=0)

        models.Picklist.objects.create(
            collection=self.collection,
            issystem=False,
            name='foobaz',
            readonly=False,
            type=0)

class PrepTypeTests(ApiTests):
    def test_name_unique_in_collection(self):
        models.Preptype.objects.create(
            collection=self.collection,
            name='foobar',
            isloanable=True)

        with self.assertRaises(BusinessRuleException):
            models.Preptype.objects.create(
                collection=self.collection,
                name='foobar',
                isloanable=True)

        models.Preptype.objects.create(
            collection=self.collection,
            name='foobaz',
            isloanable=True)

class RepositoryAgreementTests(ApiTests):
    def test_number_is_unique_in_division(self):
        models.Repositoryagreement.objects.create(
            repositoryagreementnumber='foobar',
            division=self.division,
            originator=self.agent)

        with self.assertRaises(BusinessRuleException):
            models.Repositoryagreement.objects.create(
                repositoryagreementnumber='foobar',
                division=self.division,
                originator=self.agent)

        models.Repositoryagreement.objects.create(
            repositoryagreementnumber='foobaz',
            division=self.division,
            originator=self.agent)
