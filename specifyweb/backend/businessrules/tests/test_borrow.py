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
