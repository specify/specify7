from specifyweb.backend.stored_queries.execution import query_to_csv
from specifyweb.backend.stored_queries.tests.tests import SQLAlchemySetup
from specifyweb.backend.stored_queries.tests.utils import make_query_fields_test
from unittest.mock import patch
from specifyweb.specify.models import Recordset, Recordsetitem, datamodel

# Making this a separate dict in case defaults get changed
default_options = dict(
    recordsetid=None,
    captions=False,
    strip_id=False,
    row_filter=None,
    distinct=False,
    delimiter=",",
    bom=False,
)


def noop(*args, **kwargs): ...


class TestQueryToCsv(SQLAlchemySetup):

    def setUp(self):
        super().setUp()
        self._path_mapping = {}

    def _get_path(self, prefix="test"):
        # Done this way to guarantee a unique file for the runtime of a test.
        self._path_mapping[prefix] = self._path_mapping.get(prefix, 0) + 1
        return f"{prefix}_{self._path_mapping[prefix]}.csv"

    def _simple_co_query(self, **extra_args):
        base_table, fields = make_query_fields_test(
            "Collectionobject", [["catalognumber"]]
        )

        path = self._get_path()
        with TestQueryToCsv.test_session_context() as session:
            query_to_csv(
                session,
                self.collection,
                self.specifyuser,
                base_table.tableId,
                fields,
                path,
                **{**default_options, **extra_args},
            )
        return path

    def assert_file_matches(self, path, expected_lines):
        with open(path) as f:
            read_str = f.read()

        self.assertEqual(
            "\n".join(
                [",".join([str(cell) for cell in row]) for row in expected_lines]
            ),
            read_str,
        )


def _simple_co_query_no_strip_id(self: TestQueryToCsv):

    path = self._simple_co_query()

    expected_lines = [
        [self.collectionobjects[0].id, self.collectionobjects[0].catalognumber],
        [self.collectionobjects[1].id, self.collectionobjects[1].catalognumber],
        [self.collectionobjects[2].id, self.collectionobjects[2].catalognumber],
        [self.collectionobjects[3].id, self.collectionobjects[3].catalognumber],
        [self.collectionobjects[4].id, self.collectionobjects[4].catalognumber],
        [],
    ]

    self.assert_file_matches(path, expected_lines)


def _simple_co_query_strip_id(self: TestQueryToCsv):

    path = self._simple_co_query(strip_id=True)

    expected_lines = [
        [self.collectionobjects[0].catalognumber],
        [self.collectionobjects[1].catalognumber],
        [self.collectionobjects[2].catalognumber],
        [self.collectionobjects[3].catalognumber],
        [self.collectionobjects[4].catalognumber],
        [],
    ]

    self.assert_file_matches(path, expected_lines)


def _simple_co_query_recordset(self: TestQueryToCsv):

    co_table = datamodel.get_table("Collectionobject")

    test_rs = Recordset.objects.create(
        collectionmemberid=self.collection.id,
        dbtableid=co_table.tableId,
        name="TestCoRS",
        specifyuser=self.specifyuser,
        type=0,
    )

    for i, co in enumerate(self.collectionobjects[:3]):
        Recordsetitem.objects.create(recordset=test_rs, recordid=co.id)

    path = self._simple_co_query(strip_id=True, recordsetid=test_rs.id)

    expected_lines = [
        [self.collectionobjects[0].catalognumber],
        [self.collectionobjects[1].catalognumber],
        [self.collectionobjects[2].catalognumber],
        [],
    ]

    self.assert_file_matches(path, expected_lines)


def _simple_co_query_recordset_captions(self: TestQueryToCsv):

    co_table = datamodel.get_table("Collectionobject")

    test_rs = Recordset.objects.create(
        collectionmemberid=self.collection.id,
        dbtableid=co_table.tableId,
        name="TestCoRS",
        specifyuser=self.specifyuser,
        type=0,
    )

    captions = ["Collectionobject Catalognumber"]
    for i, co in enumerate(self.collectionobjects[:3]):
        Recordsetitem.objects.create(recordset=test_rs, recordid=co.id)

    path = self._simple_co_query(
        strip_id=False, recordsetid=test_rs.id, captions=captions
    )

    expected_lines = [
        ["id", *captions],
        [self.collectionobjects[0].id, self.collectionobjects[0].catalognumber],
        [self.collectionobjects[1].id, self.collectionobjects[1].catalognumber],
        [self.collectionobjects[2].id, self.collectionobjects[2].catalognumber],
        [],
    ]

    self.assert_file_matches(path, expected_lines)


def _simple_co_query_row_filter(self: TestQueryToCsv):

    def _filter(row):
        return row[1] in [
            self.collectionobjects[0].catalognumber,
            self.collectionobjects[2].catalognumber,
        ]

    captions = ["Collectionobject Catalognumber"]

    path = self._simple_co_query(captions=captions, row_filter=_filter)

    expected_lines = [
        ["id", *captions],
        [self.collectionobjects[0].id, self.collectionobjects[0].catalognumber],
        [self.collectionobjects[2].id, self.collectionobjects[2].catalognumber],
        [],
    ]

    self.assert_file_matches(path, expected_lines)


tests = [
    ("_simple_co_query_no_strip_id", _simple_co_query_no_strip_id),
    ("_simple_co_query_strip_id", _simple_co_query_strip_id),
    ("_simple_co_query_recordset", _simple_co_query_recordset),
    ("_simple_co_query_recordset_captions", _simple_co_query_recordset_captions),
    ("_simple_co_query_row_filter", _simple_co_query_row_filter),
]


def return_first(first, *args, **kwargs):
    return first


def make_test(test_fn, mock_post_processing):

    if not mock_post_processing:

        @patch("specifyweb.backend.stored_queries.execution.set_group_concat_max_len", noop)
        def test(self):
            test_fn(self)

        return test

    @patch(
        "specifyweb.backend.stored_queries.execution.apply_special_post_query_processing",
        return_first,
    )
    @patch("specifyweb.backend.stored_queries.execution.set_group_concat_max_len", noop)
    def test(self):
        test_fn(self)

    return test


for attr, test_fn in tests:
    setattr(TestQueryToCsv, f"test{attr}", make_test(test_fn, False))
    setattr(TestQueryToCsv, f"test_raw_query{attr}", make_test(test_fn, True))
