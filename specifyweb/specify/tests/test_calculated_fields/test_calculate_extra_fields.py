from specifyweb.backend.interactions.tests.test_preps_available_context import (
    TestPrepsAvailableContext,
)
from specifyweb.specify.serializers import obj_to_data
from specifyweb.specify.calculated_fields import calculate_extra_fields as _cef
from copy import deepcopy

from specifyweb.specify.models import (
    Accession,
    Collectionobjectgroup,
    Collectionobjectgroupjoin,
    Collectionobjectgrouptype,
    Deaccession,
    Determination,
    Disposalpreparation,
    Loanpreparation,
)
from specifyweb.specify.tests.test_api import DefaultsSetup


def compact(simple_dict):
    args = [f"{key}={value}" for (key, value) in simple_dict.items()]
    return f"dict({','.join(args)})"


class TestPrepsAvailableDefaults(TestPrepsAvailableContext, DefaultsSetup): ...


# NOTE: These tests are a bit iffy, since they require _understanding_ how the "calculate_extra_fields"
# function works. This is because the first argument (data) needs to be determined carefully, by looking
# at the code. We cannot set data to be "obj_to_data(obj)" because that itself calls calculate_extra_fields.
class TestCalculateExtraFields(TestPrepsAvailableDefaults):

    # Like the original calculate_extra_fields, but makes an assert to make sure data is unchanged
    def calculate_extra_fields(self, obj, data):
        copied = deepcopy(data)
        extras = _cef(obj, copied)
        self.assertEqual(copied, data)
        return extras

    def _make_determination(self, collectionobject):
        det1 = Determination.objects.create(
            collectionobject=collectionobject,
            iscurrent=True,
            remarks="Example1",
        )

        det2 = Determination.objects.create(
            collectionobject=collectionobject,
            iscurrent=False,
            remarks="Example2",
        )

        return [det1, det2]

    def _create_disposal_preps(self):
        prep_1 = self._create_prep(self.collectionobjects[0], None, countamt=5)
        prep_2 = self._create_prep(self.collectionobjects[1], None, countamt=5)
        prep_3 = self._create_prep(self.collectionobjects[2], None, countamt=5)

        Disposalpreparation.objects.create(
            preparation=prep_1, quantity=2, disposal=self.disposal
        )
        Disposalpreparation.objects.create(
            preparation=prep_2, quantity=3, disposal=self.disposal
        )
        Disposalpreparation.objects.create(
            preparation=prep_3, quantity=4, disposal=self.disposal
        )

    # Preparation case
    def test_preparation_no_interaction(self):
        prep = self._create_prep(self.collectionobjects[0], None, countamt=5)
        extra = self.calculate_extra_fields(prep, {})
        self.assertEqual(
            extra,
            dict(
                actualCountAmt=5,
                isonloan=False,
                isongift=False,
                isondisposal=False,
                isonexchangeout=False,
                isonexchangein=False,
            ),
        )

    def test_preparation_interacted(self):
        self._preps_available_interacted()

        expected = [
            # 0
            dict(
                actualCountAmt=5,
                isonloan=True,
                isongift=False,
                isondisposal=False,
                isonexchangeout=False,
                isonexchangein=False,
            ),
            # 1
            dict(
                actualCountAmt=5,
                isonloan=False,
                isongift=True,
                isondisposal=False,
                isonexchangeout=False,
                isonexchangein=False,
            ),
            # 2
            dict(
                actualCountAmt=2,
                isonloan=False,
                isongift=False,
                isondisposal=False,
                isonexchangeout=True,
                isonexchangein=False,
            ),
            # 3
            dict(
                actualCountAmt=6,
                isonloan=False,
                isongift=False,
                isondisposal=False,
                isonexchangeout=False,
                isonexchangein=False,
            ),
            # 4
            dict(
                actualCountAmt=3,
                isonloan=False,
                isongift=True,
                isondisposal=False,
                isonexchangeout=False,
                isonexchangein=False,
            ),
            # 5
            dict(
                actualCountAmt=5,
                isonloan=False,
                isongift=True,
                isondisposal=False,
                isonexchangeout=False,
                isonexchangein=False,
            ),
            # 6
            dict(
                actualCountAmt=5,
                isonloan=False,
                isongift=False,
                isondisposal=False,
                isonexchangeout=False,
                isonexchangein=False,
            ),
            # 7
            dict(
                actualCountAmt=4,
                isonloan=False,
                isongift=False,
                isondisposal=False,
                isonexchangeout=True,
                isonexchangein=False,
            ),
            # 8
            dict(
                actualCountAmt=4,
                isonloan=True,
                isongift=False,
                isondisposal=False,
                isonexchangeout=True,
                isonexchangein=False,
            ),
            # 9
            dict(
                actualCountAmt=5,
                isonloan=False,
                isongift=True,
                isondisposal=False,
                isonexchangeout=False,
                isonexchangein=False,
            ),
        ]

        self.assertEqual(len(self._prep_list), len(expected))

        for prep, expected_extras in zip(self._prep_list, expected):
            extra = self.calculate_extra_fields(prep, {})
            self.assertEqual(expected_extras, extra)

    # Specifyuser case
    def test_specifyuser(self):
        extra = self.calculate_extra_fields(self.specifyuser, {})
        self.assertEqual(extra, dict(isadmin=True))

    # Collectionobject case
    def test_collection_object_simple(self):

        extras = self.calculate_extra_fields(
            self.collectionobjects[0], dict(determinations=[])
        )

        self.assertEqual(
            extras,
            dict(
                actualTotalCountAmt=0,
                totalCountAmt=0,
                currentdetermination=None,
                isMemberOfCOG=False,
            ),
        )

    def test_collection_object_current_determination(self):
        dets = self._make_determination(self.collectionobjects[0])
        dets_as_data = [obj_to_data(det) for det in dets]
        extras = self.calculate_extra_fields(
            self.collectionobjects[0], dict(determinations=dets_as_data)
        )
        extra_expected = dict(
            actualTotalCountAmt=0,
            totalCountAmt=0,
            currentdetermination=f"/api/specify/determination/{dets[0].id}/",
            isMemberOfCOG=False,
        )
        self.assertEqual(extra_expected, extras)

    def test_collection_object_simple_preparations(self):
        # In this case, the collection objects have simple preparations.
        self._preps_available_simple()
        for co in self.collectionobjects:
            extra = self.calculate_extra_fields(co, dict(determinations=[]))
            extra_expected = dict(
                actualTotalCountAmt=5,
                totalCountAmt=5,
                currentdetermination=None,
                isMemberOfCOG=False,
            )
            self.assertEqual(extra_expected, extra)

    def test_collection_object_interacted_preps(self):
        prep_count = self._preps_available_interacted()
        expected_actual_total_count_amt = {}
        for _prep_count in prep_count:
            expected_actual_total_count_amt[_prep_count[1]] = (
                expected_actual_total_count_amt.get(_prep_count[1], 0)
                + int(_prep_count[6] or 0)
                - int(_prep_count[7] or 0)
                - int(_prep_count[8] or 0)
                - int(_prep_count[9] or 0)
                # I think the below is a bug in the extra fields calculation code
                # - (_prep_count[10] or 0)
            )

        expected_results = [
            # CO 0
            dict(
                actualTotalCountAmt=10,
                totalCountAmt=11,
                currentdetermination=None,
                isMemberOfCOG=False,
            ),
            # CO 1
            dict(
                actualTotalCountAmt=8,
                totalCountAmt=11,
                currentdetermination=None,
                isMemberOfCOG=False,
            ),
            # CO 2
            dict(
                actualTotalCountAmt=8,
                totalCountAmt=11,
                currentdetermination=None,
                isMemberOfCOG=False,
            ),
            # CO 3
            dict(
                actualTotalCountAmt=9,
                totalCountAmt=11,
                currentdetermination=None,
                isMemberOfCOG=False,
            ),
            # CO 4
            dict(
                actualTotalCountAmt=9,
                totalCountAmt=11,
                currentdetermination=None,
                isMemberOfCOG=False,
            ),
        ]

        results = [
            self.calculate_extra_fields(co, dict(determinations=[]))
            for co in self.collectionobjects
        ]

        for expected, result, co in zip(
            expected_results, results, self.collectionobjects
        ):
            self.assertEqual(result, expected)
            self.assertEqual(
                result["actualTotalCountAmt"], expected_actual_total_count_amt[co.id]
            )

    def test_collection_object_cog(self):
        cog_type = Collectionobjectgrouptype.objects.create(
            name="microscope slide", type="Discrete", collection=self.collection
        )
        cog = Collectionobjectgroup.objects.create(
            collection=self.collection, cogtype=cog_type
        )
        co = self.collectionobjects[0]
        Collectionobjectgroupjoin.objects.create(
            parentcog=cog, childco=co, isprimary=True, issubstrate=True
        )

        extras = self.calculate_extra_fields(co, dict(determinations=[]))
        self.assertEqual(
            extras,
            dict(
                actualTotalCountAmt=0,
                totalCountAmt=0,
                currentdetermination=None,
                isMemberOfCOG=True,
            ),
        )

    # Loan case
    def test_loan_no_preps(self):
        extras = self.calculate_extra_fields(self.loan, dict(loanpreparations=[]))
        self.assertEqual(
            dict(
                totalPreps=0,
                totalItems=0,
                unresolvedPreps=0,
                unresolvedItems=0,
                resolvedPreps=0,
                resolvedItems=0,
            ),
            extras,
        )

    def test_loan_with_preps(self):
        self._preps_available_interacted()
        loan_preps = [
            obj_to_data(l_prep)
            for l_prep in list(Loanpreparation.objects.filter(loan=self.loan))
        ]

        extras = self.calculate_extra_fields(
            self.loan, dict(loanpreparations=loan_preps)
        )

        self.assertEqual(
            extras,
            dict(
                totalPreps=4,
                totalItems=15,
                unresolvedPreps=2,
                unresolvedItems=4,
                resolvedPreps=2,
                resolvedItems=11,
            ),
        )

    # Accession case
    def test_accession_simple(self):
        obj = Accession.objects.create(division_id=self.division.id)
        extras = self.calculate_extra_fields(obj, dict())
        self.assertEqual(
            extras,
            dict(
                actualTotalCountAmt=0,
                totalCountAmt=0,
                preparationCount=0,
                collectionObjectCount=0,
            ),
        )

    def test_accession_with_co_no_prep(self):
        obj = Accession.objects.create(division_id=self.division.id)

        for co in self.collectionobjects[:3]:
            self._update(co, dict(accession=obj))

        extras = self.calculate_extra_fields(obj, dict())
        self.assertEqual(
            extras,
            dict(
                actualTotalCountAmt=0,
                totalCountAmt=0,
                preparationCount=0,
                collectionObjectCount=3,
            ),
        )

    def test_accession_with_co_simple_preps(self):
        obj = Accession.objects.create(division_id=self.division.id)

        self._preps_available_simple()

        for co in self.collectionobjects[:3]:
            self._update(co, dict(accession=obj))

        extras = self.calculate_extra_fields(obj, dict())

        self.assertEqual(
            extras,
            dict(
                actualTotalCountAmt=15,
                totalCountAmt=15,
                preparationCount=3,
                collectionObjectCount=3,
            ),
        )

    def test_accession_with_interacted_preps(self):
        obj = Accession.objects.create(division_id=self.division.id)

        self._preps_available_interacted()

        for co in self.collectionobjects[:3]:
            self._update(co, dict(accession=obj))

        extras = self.calculate_extra_fields(obj, dict())

        self.assertEqual(
            extras,
            dict(
                actualTotalCountAmt=26,
                totalCountAmt=33,
                preparationCount=6,
                collectionObjectCount=3,
            ),
        )

    def test_gift_no_prep(self):
        self.assertEqual(
            self.calculate_extra_fields(self.gift, dict()),
            dict(totalPreps=0, totalItems=0),
        )

    def test_exchangeout_no_prep(self):
        self.assertEqual(
            self.calculate_extra_fields(self.exchangeout, dict()),
            dict(totalPreps=0, totalItems=0),
        )

    def test_disposal_no_prep(self):
        self.assertEqual(
            self.calculate_extra_fields(self.disposal, dict()),
            dict(totalPreps=0, totalItems=0),
        )

    def test_gift_with_preps(self):
        self._preps_available_interacted()

        self.assertEqual(
            self.calculate_extra_fields(self.gift, dict()),
            dict(totalPreps=4, totalItems=5),
        )

    def test_exchangeout_with_preps(self):
        self._preps_available_interacted()

        self.assertEqual(
            self.calculate_extra_fields(self.exchangeout, dict()),
            dict(totalPreps=3, totalItems=6),
        )

    def test_disposal_with_preps(self):

        self._create_disposal_preps()

        self.assertEqual(
            self.calculate_extra_fields(self.disposal, dict()),
            dict(totalPreps=3, totalItems=9),
        )

    def test_deaccession_no_preps(self):
        obj = Deaccession.objects.create()

        extra = self.calculate_extra_fields(obj, dict())

        self.assertEqual(extra, dict(totalPreps=0, totalItems=0))

    def test_deaccession_preps(self):
        obj = Deaccession.objects.create()

        self._create_disposal_preps()

        self._update(self.disposal, dict(deaccession=obj))
        self._update(self.gift, dict(deaccession=obj))
        self._update(self.exchangeout, dict(deaccession=obj))

        self._preps_available_interacted()

        extra = self.calculate_extra_fields(obj, dict())

        self.assertEqual(extra, dict(totalPreps=10, totalItems=20))
