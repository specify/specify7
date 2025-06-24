from specifyweb.specify.tests.test_api import ApiTests
from specifyweb.specify.models import Collectionobject, Exchangeout, Exchangeoutprep, Giftpreparation, Loanpreparation, Recordset, Preptype, Loan, Gift
from django.test import Client

mapping = {
    "loan": dict(model=Loanpreparation, backref="loan"),
    "gift": dict(model=Giftpreparation, backref="gift"),
    "exchangeout": dict(model=Exchangeoutprep, backref="exchangeout")
}

def _create_interaction_prep(context, obj, prep, prep_list, **loan_prep_kwargs):
    mapped = mapping[obj._meta.model_name.lower()]
    loan_prep_kwargs[mapped["backref"]] = obj
    if obj._meta.model_name.lower() != "disposal":
        loan_prep_kwargs["discipline_id"] = context.collection.discipline.id
    else:
        del loan_prep_kwargs["quantityresolved"]

    lp = mapped["model"].objects.create(
        preparation=prep,
        **loan_prep_kwargs,
    )
    if prep_list is not None:
        prep_list.append(lp)

class TestPrepsAvailableContext(ApiTests):

    def setUp(self):
        super().setUp()
        c = Client()
        self._create_prep_type()
        c.force_login(self.specifyuser)
        self.client = c
        self.loan = Loan.objects.create(discipline_id=self.discipline.id)
        self.gift = Gift.objects.create(discipline_id=self.discipline.id)
        self.exchangeout = Exchangeout.objects.create(
            agentcatalogedby=self.agent, 
            agentsentto=self.agent, 
            division=self.division
        )
    
    def _preps_available_simple(self):
        prep_list = []
        for co in self.collectionobjects:
            self._create_prep(co, prep_list, countamt=5)

        expected_response = [
            ["num-0", self.collectionobjects[0].id, None, None, prep_list[0].id, "testPrepType", 5, None, None, None, "5"], 
            ["num-1", self.collectionobjects[1].id, None, None, prep_list[1].id, "testPrepType", 5, None, None, None, "5"], 
            ["num-2", self.collectionobjects[2].id, None, None, prep_list[2].id, "testPrepType", 5, None, None, None, "5"], 
            ["num-3", self.collectionobjects[3].id, None, None, prep_list[3].id, "testPrepType", 5, None, None, None, "5"], 
            ["num-4", self.collectionobjects[4].id, None, None, prep_list[4].id, "testPrepType", 5, None, None, None, "5"]
        ]

        return expected_response

    def _preps_available_interacted(self):
        prep_list = []

        test_prep_type = Preptype.objects.create(
                name="testPrepTypeDifferent",
                isloanable=True,
                collection=self.collection,
        )

        for co in self.collectionobjects:
            self._create_prep(co, prep_list, countamt=5)
            self._create_prep(co, prep_list, countamt=6, preptype=test_prep_type)
        
        # CO 1
        _create_interaction_prep(self, self.loan, prep_list[0], None, quantity=4, quantityresolved=2)
        _create_interaction_prep(self, self.gift, prep_list[1], None, quantity=1)
        
        # CO 2
        _create_interaction_prep(self, self.exchangeout, prep_list[2], None, quantity=3)
        _create_interaction_prep(self, self.loan, prep_list[2], None, quantity=3, quantityresolved=3)
        _create_interaction_prep(self, self.loan, prep_list[3], None, quantity=5, quantityresolved=5)

        # CO 3
        _create_interaction_prep(self, self.gift, prep_list[4], None, quantity=2)
        _create_interaction_prep(self, self.gift, prep_list[5], None, quantity=1)

        # CO 4
        _create_interaction_prep(self, self.exchangeout, prep_list[7], None, quantity=2)

        # CO 5
        _create_interaction_prep(self, self.loan, prep_list[8], None, quantity=3, quantityresolved=1)
        _create_interaction_prep(self, self.exchangeout, prep_list[8], None, quantity=1)
        _create_interaction_prep(self, self.gift, prep_list[9], None, quantity=1)

        co_id = lambda index: self.collectionobjects[index].id

        expected_counts = [
            ['num-0', co_id(0), None, None, prep_list[0].id, 'testPrepType', 5, None, None, None, '3'],
            ['num-0', co_id(0), None, None, prep_list[1].id, 'testPrepTypeDifferent', 6, None, '1', None, '5'],
            ['num-1', co_id(1), None, None, prep_list[2].id, 'testPrepType', 5, None, None, '3', '2'],
            ['num-1', co_id(1), None, None, prep_list[3].id, 'testPrepTypeDifferent', 6, None, None, None, '6'],
            ['num-2', co_id(2), None, None, prep_list[4].id, 'testPrepType', 5, None, '2', None, '3'],
            ['num-2', co_id(2), None, None, prep_list[5].id, 'testPrepTypeDifferent', 6, None, '1', None, '5'],
            ['num-3', co_id(3), None, None, prep_list[6].id, 'testPrepType', 5, None, None, None, '5'],
            ['num-3', co_id(3), None, None, prep_list[7].id, 'testPrepTypeDifferent', 6, None, None, '2', '4'],
            ['num-4', co_id(4), None, None, prep_list[8].id, 'testPrepType', 5, None, None, '1', '2'],
            ['num-4', co_id(4), None, None, prep_list[9].id, 'testPrepTypeDifferent', 6, None, '1', None, '5']
        ]

        return expected_counts