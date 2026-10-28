from unittest import TestCase

from django.core.exceptions import BadRequest
from sqlalchemy import Column, Integer, MetaData, Table, create_engine, select

from specifyweb.backend.stored_queries.selection import (
    MAX_SELECTION_IDS,
    apply_selection,
    parse_selection,
)


class TestSelection(TestCase):
    def test_validation(self):
        self.assertIsNone(parse_selection(None))
        self.assertEqual(
            parse_selection({"mode": "exclude", "ids": [2, 2, 3]}),
            {"mode": "exclude", "ids": [2, 3]},
        )
        maximum_selection = parse_selection({
            "mode": "include", "ids": list(range(1, MAX_SELECTION_IDS + 1))
        })
        assert maximum_selection is not None
        self.assertEqual(len(maximum_selection["ids"]), MAX_SELECTION_IDS)
        for value in (
            {},
            [],
            {"mode": "all", "ids": []},
            {"mode": "include", "ids": None},
            {"mode": "include", "ids": [True]},
            {"mode": "include", "ids": ["1"]},
            {"mode": "include", "ids": [0]},
            {"mode": "include", "ids": [-1]},
            {"mode": "include", "ids": [1.5]},
            {"mode": "include", "ids": list(range(1, MAX_SELECTION_IDS + 2))},
        ):
            with self.subTest(value=str(value)[:100]), self.assertRaises(BadRequest):
                parse_selection(value)

    def test_selection_is_applied_before_pagination_and_preserves_duplicates(self):
        engine = create_engine("sqlite://")
        metadata = MetaData()
        rows = Table("rows", metadata, Column("record_id", Integer))
        metadata.create_all(engine)
        try:
            with engine.begin() as connection:
                connection.execute(rows.insert(), [
                    {"record_id": record_id} for record_id in [1, 2, 2, 3, 4]
                ])
                query = select(rows.c.record_id).order_by(rows.c.record_id)
                for selection, expected in (
                    (None, [1, 2, 2, 3, 4]),
                    ({"mode": "include", "ids": []}, []),
                    ({"mode": "exclude", "ids": []}, [1, 2, 2, 3, 4]),
                    ({"mode": "include", "ids": [2, 4]}, [2, 2, 4]),
                    ({"mode": "exclude", "ids": [2]}, [1, 3, 4]),
                ):
                    with self.subTest(selection=selection):
                        selected = apply_selection(query, rows.c.record_id, selection)
                        self.assertEqual(list(connection.execute(selected).scalars()), expected)
                        self.assertEqual(
                            list(connection.execute(selected.offset(1).limit(1)).scalars()),
                            expected[1:2],
                        )
        finally:
            engine.dispose()
