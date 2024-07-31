
from unittest import skip
from specifyweb.specify import models
from specifyweb.specify.tests.test_api import ApiTests
from ..exceptions import BusinessRuleException

class BorrowAgentTests(ApiTests):
    @skip('this rule was removed in 49ed2b30')
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
