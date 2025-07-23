from specifyweb.specify.models import Collectionobject
from specifyweb.stored_queries.execution import (
    BuildQueryProps,
    build_query,
    series_post_query,
)
from specifyweb.stored_queries.tests.tests import SQLAlchemySetup
from specifyweb.stored_queries.tests.utils import make_query_fields_test
from unittest import expectedFailure


class TestSeriesPostQuery(SQLAlchemySetup):

    def _get_id(self, co_list):
        def _getter(index):
            return co_list[index].id

        return _getter

    def _make_numeric_cos(self):
        Collectionobject.objects.all().delete()

        collectionobjects = self.make_co(10)

        for _id, co in enumerate(collectionobjects):
            self._update(co, dict(catalognumber=str(_id + 1).rjust(3, "0")))
            co.refresh_from_db()

        collectionobjects[3].delete()  # 004
        collectionobjects[7].delete()  # 008

        return collectionobjects

    def _make_co_with_groups(self):
        collectionobjects = self._make_numeric_cos()

        self._update(collectionobjects[0], dict(text1="Group1"))
        self._update(collectionobjects[1], dict(text1="Group1"))

        self._update(collectionobjects[2], dict(text1="Group2"))

        self._update(collectionobjects[4], dict(text1="Group3"))
        self._update(collectionobjects[5], dict(text1="Group3"))
        self._update(collectionobjects[6], dict(text1="Group3"))

        self._update(collectionobjects[8], dict(text1="Group4"))
        self._update(collectionobjects[9], dict(text1="Group4"))
        return collectionobjects

    def _make_numeric_numeric_cos(self):
        Collectionobject.objects.all().delete()

        collectionobjects = self.make_co(10)

        self._update(collectionobjects[0], dict(catalognumber="000-090"))
        self._update(collectionobjects[2], dict(catalognumber="000-091"))
        self._update(collectionobjects[1], dict(catalognumber="000-092"))

        self._update(collectionobjects[4], dict(catalognumber="001-001"))
        self._update(collectionobjects[3], dict(catalognumber="001-002"))

        self._update(collectionobjects[6], dict(catalognumber="003-001"))
        self._update(collectionobjects[5], dict(catalognumber="003-002"))

        self._update(collectionobjects[7], dict(catalognumber="003-004"))

        self._update(collectionobjects[8], dict(catalognumber="090-002"))

        self._update(collectionobjects[9], dict(catalognumber="100-004"))
        return collectionobjects

    def _make_string_numeric_cos(self):
        Collectionobject.objects.all().delete()

        collectionobjects = self.make_co(10)

        self._update(collectionobjects[0], dict(catalognumber="AAA-090"))
        self._update(collectionobjects[2], dict(catalognumber="AAA-091"))
        self._update(collectionobjects[1], dict(catalognumber="AAA-092"))

        self._update(collectionobjects[4], dict(catalognumber="AAB-001"))
        self._update(collectionobjects[3], dict(catalognumber="AAB-002"))

        self._update(collectionobjects[6], dict(catalognumber="CAT-001"))
        self._update(collectionobjects[5], dict(catalognumber="CAT-002"))

        self._update(collectionobjects[7], dict(catalognumber="LAP-004"))

        self._update(collectionobjects[8], dict(catalognumber="PAL-002"))

        self._update(collectionobjects[9], dict(catalognumber="APL-004"))
        return collectionobjects

    def _make_string_numeric_string_cos(self):
        Collectionobject.objects.all().delete()

        collectionobjects = self.make_co(10)

        self._update(collectionobjects[0], dict(catalognumber="AAA-090-AAA"))
        self._update(collectionobjects[2], dict(catalognumber="AAA-091-AAA"))
        # This CO is not part of the series
        self._update(collectionobjects[1], dict(catalognumber="AAA-092-AAB"))

        # These two also are not part of the series
        self._update(collectionobjects[4], dict(catalognumber="AAB-001-XYZ"))
        self._update(collectionobjects[3], dict(catalognumber="AAB-002-YZX"))

        self._update(collectionobjects[6], dict(catalognumber="CAT-001-PAL"))
        self._update(collectionobjects[5], dict(catalognumber="CAT-002-PAL"))

        self._update(collectionobjects[7], dict(catalognumber="LAP-004-AAZ"))

        self._update(collectionobjects[8], dict(catalognumber="PAL-002-AAZ"))

        self._update(collectionobjects[9], dict(catalognumber="APL-004-AAZ"))
        return collectionobjects


def _numeric_series_just_cn_field(self: TestSeriesPostQuery, is_count=False):

    collectionobjects = self._make_numeric_cos()

    table, query_fields = make_query_fields_test(
        "Collectionobject", [["catalognumber"]]
    )

    with TestSeriesPostQuery.test_session_context() as session:
        query, _ = build_query(
            session,
            self.collection,
            self.specifyuser,
            table.tableId,
            query_fields,
            BuildQueryProps(series=True),
        )

        results = series_post_query(query)

    id_getter = self._get_id(collectionobjects)

    self.assertEqual(
        [
            [f"{id_getter(0)},{id_getter(1)},{id_getter(2)}", "001 - 003"],
            [f"{id_getter(4)},{id_getter(5)},{id_getter(6)}", "005 - 007"],
            [f"{id_getter(8)},{id_getter(9)}", "009 - 010"],
        ],
        results,
    )


def _numeric_series_with_same_fields(self: TestSeriesPostQuery, is_count=False):
    collectionobjects = self._make_numeric_cos()

    table, query_fields = make_query_fields_test(
        "Collectionobject",
        [["catalognumber"], ["text1"], ["collection", "collectionname"]],
    )

    with TestSeriesPostQuery.test_session_context() as session:
        query, _ = build_query(
            session,
            self.collection,
            self.specifyuser,
            table.tableId,
            query_fields,
            BuildQueryProps(series=True),
        )

        results = series_post_query(query)

    id_getter = self._get_id(collectionobjects)

    self.assertEqual(
        [
            [
                f"{id_getter(0)},{id_getter(1)},{id_getter(2)}",
                "001 - 003",
                None,
                "TestCollection",
            ],
            [
                f"{id_getter(4)},{id_getter(5)},{id_getter(6)}",
                "005 - 007",
                None,
                "TestCollection",
            ],
            [f"{id_getter(8)},{id_getter(9)}", "009 - 010", None, "TestCollection"],
        ],
        results,
    )


def _series_unique_distinct_field(self: TestSeriesPostQuery, is_count=False):
    self.maxDiff = None
    collectionobjects = self._make_numeric_cos()

    table, query_fields = make_query_fields_test(
        "Collectionobject",
        [["catalognumber"], ["text1"], ["collection", "collectionname"], ["guid"]],
    )

    with TestSeriesPostQuery.test_session_context() as session:
        query, _ = build_query(
            session,
            self.collection,
            self.specifyuser,
            table.tableId,
            query_fields,
            BuildQueryProps(series=True),
        )

        results = series_post_query(query)

    expected = [
        [
            str(co.id),
            co.catalognumber,
            co.text1,
            co.collection.collectionname,
            co.guid,
        ]
        for co in collectionobjects
        if co.id is not None
    ]

    self.assertCountEqual(expected, results)


# Tests for 1234-5678
def _numeric_numeric_just_cn_field(self: TestSeriesPostQuery, is_count=False):

    collectionobjects = self._make_numeric_numeric_cos()

    table, query_fields = make_query_fields_test(
        "Collectionobject",
        [["catalognumber"]],
    )

    with TestSeriesPostQuery.test_session_context() as session:
        query, _ = build_query(
            session,
            self.collection,
            self.specifyuser,
            table.tableId,
            query_fields,
            BuildQueryProps(series=True),
        )

        results = series_post_query(query)

    id_getter = self._get_id(collectionobjects)

    expected = [
        [f"{id_getter(0)},{id_getter(2)},{id_getter(1)}", "000-090 - 000-092"],
        [f"{id_getter(4)},{id_getter(3)}", "001-001 - 001-002"],
        [f"{id_getter(6)},{id_getter(5)}", "003-001 - 003-002"],
        [f"{id_getter(7)}", "003-004"],
        [f"{id_getter(8)}", "090-002"],
        [f"{id_getter(9)}", "100-004"],
    ]

    self.assertEqual(expected, results)


# Tests for 1234-5678
def _numeric_numeric_with_same_fields(self: TestSeriesPostQuery, is_count=False):

    collectionobjects = self._make_numeric_numeric_cos()

    table, query_fields = make_query_fields_test(
        "Collectionobject",
        [["catalognumber"], ["text1"], ["collection", "collectionname"]],
    )

    with TestSeriesPostQuery.test_session_context() as session:
        query, _ = build_query(
            session,
            self.collection,
            self.specifyuser,
            table.tableId,
            query_fields,
            BuildQueryProps(series=True),
        )

        results = series_post_query(query)

    id_getter = self._get_id(collectionobjects)

    expected = [
        [
            f"{id_getter(0)},{id_getter(2)},{id_getter(1)}",
            "000-090 - 000-092",
            None,
            "TestCollection",
        ],
        [
            f"{id_getter(4)},{id_getter(3)}",
            "001-001 - 001-002",
            None,
            "TestCollection",
        ],
        [
            f"{id_getter(6)},{id_getter(5)}",
            "003-001 - 003-002",
            None,
            "TestCollection",
        ],
        [f"{id_getter(7)}", "003-004", None, "TestCollection"],
        [f"{id_getter(8)}", "090-002", None, "TestCollection"],
        [f"{id_getter(9)}", "100-004", None, "TestCollection"],
    ]

    self.assertEqual(expected, results)


def _numeric_numeric_unique_distinct_fields(self: TestSeriesPostQuery, is_count=False):

    collectionobjects = self._make_numeric_numeric_cos()

    table, query_fields = make_query_fields_test(
        "Collectionobject",
        [["catalognumber"], ["guid"], ["text1"], ["collection", "collectionname"]],
    )

    with TestSeriesPostQuery.test_session_context() as session:
        query, _ = build_query(
            session,
            self.collection,
            self.specifyuser,
            table.tableId,
            query_fields,
            BuildQueryProps(series=True),
        )

        results = series_post_query(query)

    expected = [
        [
            str(co.id),
            co.catalognumber,
            co.guid,
            co.text1,
            co.collection.collectionname,
        ]
        for co in collectionobjects
        if co.id is not None
    ]

    self.assertCountEqual(expected, results)


def _string_integer_just_cn_field(self: TestSeriesPostQuery, is_count=False):
    collectionobjects = self._make_string_numeric_cos()
    table, query_fields = make_query_fields_test(
        "Collectionobject", [["catalognumber"]]
    )

    with TestSeriesPostQuery.test_session_context() as session:
        query, _ = build_query(
            session,
            self.collection,
            self.specifyuser,
            table.tableId,
            query_fields,
            BuildQueryProps(series=True),
        )

        results = series_post_query(query)

    id_getter = self._get_id(collectionobjects)

    expected = [
        [f"{id_getter(0)},{id_getter(2)},{id_getter(1)}", "AAA-090 - AAA-092"],
        [f"{id_getter(4)},{id_getter(3)}", "AAB-001 - AAB-002"],
        [f"{id_getter(9)}", "APL-004"],
        [f"{id_getter(6)},{id_getter(5)}", "CAT-001 - CAT-002"],
        [f"{id_getter(7)}", "LAP-004"],
        [f"{id_getter(8)}", "PAL-002"],
    ]

    self.assertEqual(expected, results)


def _string_integer_with_same_fields(self: TestSeriesPostQuery, is_count=False):
    collectionobjects = self._make_string_numeric_cos()
    table, query_fields = make_query_fields_test(
        "Collectionobject",
        [["catalognumber"], ["text1"], ["collection", "collectionname"]],
    )

    with TestSeriesPostQuery.test_session_context() as session:
        query, _ = build_query(
            session,
            self.collection,
            self.specifyuser,
            table.tableId,
            query_fields,
            BuildQueryProps(series=True),
        )

        results = series_post_query(query)

    id_getter = self._get_id(collectionobjects)

    expected = [
        [
            f"{id_getter(0)},{id_getter(2)},{id_getter(1)}",
            "AAA-090 - AAA-092",
            None,
            "TestCollection",
        ],
        [
            f"{id_getter(4)},{id_getter(3)}",
            "AAB-001 - AAB-002",
            None,
            "TestCollection",
        ],
        [
            f"{id_getter(9)}",
            "APL-004",
            None,
            "TestCollection",
        ],
        [
            f"{id_getter(6)},{id_getter(5)}",
            "CAT-001 - CAT-002",
            None,
            "TestCollection",
        ],
        [
            f"{id_getter(7)}",
            "LAP-004",
            None,
            "TestCollection",
        ],
        [
            f"{id_getter(8)}",
            "PAL-002",
            None,
            "TestCollection",
        ],
    ]

    self.assertEqual(expected, results)


def _string_integer_unique_distinct_fields(self: TestSeriesPostQuery, is_count=False):
    collectionobjects = self._make_string_numeric_cos()
    table, query_fields = make_query_fields_test(
        "Collectionobject",
        [["catalognumber"], ["guid"], ["text1"], ["collection", "collectionname"]],
    )

    with TestSeriesPostQuery.test_session_context() as session:
        query, _ = build_query(
            session,
            self.collection,
            self.specifyuser,
            table.tableId,
            query_fields,
            BuildQueryProps(series=True),
        )

        results = series_post_query(query)

    expected = [
        [
            str(co.id),
            co.catalognumber,
            co.guid,
            co.text1,
            co.collection.collectionname,
        ]
        for co in collectionobjects
        if co.id is not None
    ]

    self.assertCountEqual(expected, results)


def _catalog_number_sort(self: TestSeriesPostQuery, is_count=False):
    collectionobjects = self._make_numeric_cos()
    table, query_fields = make_query_fields_test(
        "Collectionobject", [["catalognumber"]]
    )

    query_fields_ascending = [query_fields[0]._replace(sort_type=1)]
    with TestSeriesPostQuery.test_session_context() as session:
        query, _ = build_query(
            session,
            self.collection,
            self.specifyuser,
            table.tableId,
            query_fields_ascending,
            BuildQueryProps(series=True),
        )

        results_ascending = series_post_query(query, sort_type=1)

    id_getter = self._get_id(collectionobjects)
    self.assertEqual(
        [
            [f"{id_getter(0)},{id_getter(1)},{id_getter(2)}", "001 - 003"],
            [f"{id_getter(4)},{id_getter(5)},{id_getter(6)}", "005 - 007"],
            [f"{id_getter(8)},{id_getter(9)}", "009 - 010"],
        ],
        results_ascending,
    )

    query_fields_descending = [query_fields[0]._replace(sort_type=2)]
    with TestSeriesPostQuery.test_session_context() as session:
        query, _ = build_query(
            session,
            self.collection,
            self.specifyuser,
            table.tableId,
            query_fields_descending,
            BuildQueryProps(series=True),
        )

        results_descending = series_post_query(query, sort_type=2)

    id_getter = self._get_id(collectionobjects)
    self.assertEqual(
        [
            [f"{id_getter(8)},{id_getter(9)}", "009 - 010"],
            [f"{id_getter(4)},{id_getter(5)},{id_getter(6)}", "005 - 007"],
            [f"{id_getter(0)},{id_getter(1)},{id_getter(2)}", "001 - 003"],
        ],
        results_descending,
    )


@expectedFailure
def _string_integer_postfix_preserved(self: TestSeriesPostQuery, is_count=False):
    # Currently, the code does not correctly handle postfixes.
    # That is, they are currenty stripped
    collectionobjects = self._make_string_numeric_string_cos()
    table, query_fields = make_query_fields_test(
        "Collectionobject", [["catalognumber"]]
    )

    with TestSeriesPostQuery.test_session_context() as session:
        query, _ = build_query(
            session,
            self.collection,
            self.specifyuser,
            table.tableId,
            query_fields,
            BuildQueryProps(series=True),
        )

        results = series_post_query(query)

    id_getter = self._get_id(collectionobjects)

    expected = [
        [f"{id_getter(0)},{id_getter(2)}", "AAA-090-AAA - AAA-091-AAA"],
        [f"{id_getter(1)}", "AAA-092-AAB"],
        [f"{id_getter(4)}", "AAB-001-XYZ"],
        [f"{id_getter(3)}", "AAB-002-YZX"],
        [f"{id_getter(9)}", "APL-004-AAZ"],
        [f"{id_getter(6)},{id_getter(5)}", "CAT-001-PAL - CAT-002-PAL"],
        [f"{id_getter(7)}", "LAP-004-AAZ"],
        [f"{id_getter(8)}", "PAL-002-AAZ"],
    ]

    self.assertEqual(results, expected)


@expectedFailure
def _column_ordering_invalid(self: TestSeriesPostQuery, is_count=False):

    collectionobjects = self._make_co_with_groups()

    table, query_fields = make_query_fields_test(
        "Collectionobject", [["text1"], ["catalognumber"]]
    )

    with TestSeriesPostQuery.test_session_context() as session:
        query, _ = build_query(
            session,
            self.collection,
            self.specifyuser,
            table.tableId,
            query_fields,
            BuildQueryProps(series=True),
        )

        results = series_post_query(query)

    id_getter = self._get_id(collectionobjects)

    expected = [
        [f"{id_getter(0)},{id_getter(1)}", "Group1", "001 - 002"],
        [f"{id_getter(2)}", "Group2", "003"],
        [f"{id_getter(4)},{id_getter(5)},{id_getter(6)}", "Group3", "005 - 007"],
        [f"{id_getter(8)},{id_getter(9)}", "Group4", "009 - 010"],
    ]

    self.assertEqual(expected, results)


@expectedFailure
def _row_ordering_invalid(self: TestSeriesPostQuery, is_count=False):

    collectionobjects = self._make_co_with_groups()

    table, query_fields = make_query_fields_test(
        "Collectionobject", [["text1"], ["catalognumber"]]
    )

    query_fields = [query_fields[0]._replace(sort_type=1), query_fields[1]]

    with TestSeriesPostQuery.test_session_context() as session:
        query, _ = build_query(
            session,
            self.collection,
            self.specifyuser,
            table.tableId,
            query_fields,
            BuildQueryProps(series=True),
        )

        results_ascending = series_post_query(query)

    id_getter = self._get_id(collectionobjects)

    expected_ascending_order = [
        [f"{id_getter(0)},{id_getter(1)}", "001 - 002", "Group1"],
        [f"{id_getter(2)}", "003", "Group2"],
        [f"{id_getter(4)},{id_getter(5)},{id_getter(6)}", "005 - 007", "Group3"],
        [f"{id_getter(8)},{id_getter(9)}", "009 - 010", "Group4"],
    ]

    self.assertEqual(expected_ascending_order, results_ascending)

    query_fields = [query_fields[0]._replace(sort_type=2), query_fields[1]]

    with TestSeriesPostQuery.test_session_context() as session:
        query, _ = build_query(
            session,
            self.collection,
            self.specifyuser,
            table.tableId,
            query_fields,
            BuildQueryProps(series=True),
        )

        results_descending = series_post_query(query)

    id_getter = self._get_id(collectionobjects)

    expected_descendening_order = [
        [f"{id_getter(8)},{id_getter(9)}", "009 - 010", "Group4"],
        [f"{id_getter(4)},{id_getter(5)},{id_getter(6)}", "005 - 007", "Group3"],
        [f"{id_getter(2)}", "003", "Group2"],
        [f"{id_getter(0)},{id_getter(1)}", "001 - 002", "Group1"],
    ]

    self.assertEqual(results_descending, expected_descendening_order)


tests = [
    ("_numeric_series_just_cn_field", _numeric_series_just_cn_field),
    ("_numeric_series_with_same_fields", _numeric_series_with_same_fields),
    ("_series_unique_distinct_field", _series_unique_distinct_field),
    ("_numeric_numeric_just_cn_field", _numeric_numeric_just_cn_field),
    ("_numeric_numeric_with_same_fields", _numeric_numeric_with_same_fields),
    (
        "_numeric_numeric_unique_distinct_fields",
        _numeric_numeric_unique_distinct_fields,
    ),
    ("_string_integer_just_cn_field", _string_integer_just_cn_field),
    ("_string_integer_with_same_fields", _string_integer_with_same_fields),
    ("_string_integer_unique_distinct_fields", _string_integer_unique_distinct_fields),
    ("_catalog_number_sort", _catalog_number_sort),
    ("_string_integer_postfix_preserved", _string_integer_postfix_preserved),
    ("_column_ordering_invalid", _column_ordering_invalid),
    ("_row_ordering_invalid", _row_ordering_invalid),
]


def make_test(test_fn, is_count=False):

    @expectedFailure
    def test_expected_failure(self: TestSeriesPostQuery):
        test_fn(self, is_count)

    def test(self: TestSeriesPostQuery):
        test_fn(self, is_count)

    return test if test_fn not in expected_failures else test_expected_failure


expected_failures = [
    _row_ordering_invalid,
    _string_integer_postfix_preserved,
    _column_ordering_invalid,
]

for attr, test in tests:
    setattr(TestSeriesPostQuery, f"test{attr}", make_test(test, False))
    setattr(TestSeriesPostQuery, f"test_count{attr}", make_test(test, True))
