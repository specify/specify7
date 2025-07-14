from specifyweb.interactions.tests.test_preps_available_context import (
    TestPrepsAvailableContext,
)
from specifyweb.specify.api import obj_to_data
from specifyweb.specify.calculated_fields import calculate_extra_fields as _cef
from copy import deepcopy

from specifyweb.specify.models import Determination


def compact(simple_dict):
    args = [f"{key}={value}" for (key, value) in simple_dict.items()]
    return f"dict({','.join(args)})"


# NOTE: These tests are a bit iffy, since they require _understanding_ how the "calculate_extra_fields"
# function works. This is because the first argument (data) needs to be determined carefully, by looking
# at the code. We cannot set data to be "obj_to_data(obj)" because that itself calls calculate_extra_fields.
class TestCalculateExtraFields(TestPrepsAvailableContext):

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

    # Specifyuser case
    def test_specifyuser(self):
        extra = self.calculate_extra_fields(self.specifyuser, {})
        self.assertEqual(extra, dict(isadmin=True))

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
        self._preps_available_interacted()
        print(
            compact(
                self.calculate_extra_fields(
                    self.collectionobjects[0], dict(determinations=[])
                )
            )
        )
