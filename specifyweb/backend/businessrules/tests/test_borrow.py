from django.utils import timezone

from specifyweb.specify import models
from specifyweb.specify.tests.test_api import ApiTests


class BorrowTests(ApiTests):
    def test_fill_invoice_number_and_date(self):
        borrow_date = timezone.now()

        borrow = models.Borrow.objects.create(
            collectionmemberid=self.collection.id,
            invoicenumber='BORROW-8524-001',
            borrowdate=borrow_date,
        )

        fetched_borrow = models.Borrow.objects.get(id=borrow.id)

        self.assertEqual(
            fetched_borrow.invoicenumber,
            'BORROW-8524-001',
        )
        self.assertEqual(
            fetched_borrow.borrowdate,
            borrow_date,
        )

    def test_add_existing_agent_to_borrow(self):
        borrow = models.Borrow.objects.create(
            collectionmemberid=self.collection.id,
            invoicenumber='BORROW-AGENT-001',
        )

        borrow_agent = borrow.borrowagents.create(
            agent=self.agent,
            collectionmemberid=self.collection.id,
            role='Borrower',
        )

        fetched_borrow_agent = models.Borrowagent.objects.get(
            id=borrow_agent.id,
        )

        self.assertEqual(
            fetched_borrow_agent.borrow.id,
            borrow.id,
        )
        self.assertEqual(
            fetched_borrow_agent.agent.id,
            self.agent.id,
        )
        self.assertEqual(
            fetched_borrow_agent.role,
            'Borrower',
        )

    def test_create_new_agent_for_borrow(self):
        borrow = models.Borrow.objects.create(
            collectionmemberid=self.collection.id,
            invoicenumber='BORROW-NEW-AGENT-001',
        )

        new_agent = models.Agent.objects.create(
            agenttype=0,
            firstname='New',
            lastname='Borrow Agent',
            division=self.division,
        )

        borrow_agent = models.Borrowagent.objects.create(
            borrow=borrow,
            agent=new_agent,
            collectionmemberid=self.collection.id,
            role='Borrower',
        )

        fetched_agent = models.Agent.objects.get(id=new_agent.id)
        fetched_borrow_agent = models.Borrowagent.objects.get(
            id=borrow_agent.id,
        )

        self.assertEqual(
            fetched_agent.firstname,
            'New',
        )
        self.assertEqual(
            fetched_agent.lastname,
            'Borrow Agent',
        )
        self.assertEqual(
            fetched_agent.agenttype,
            0,
        )
        self.assertEqual(
            fetched_agent.division,
            self.division,
        )
        self.assertEqual(
            fetched_borrow_agent.borrow,
            borrow,
        )
        self.assertEqual(
            fetched_borrow_agent.agent,
            new_agent,
        )
        self.assertEqual(
            fetched_borrow_agent.role,
            'Borrower',
        )
