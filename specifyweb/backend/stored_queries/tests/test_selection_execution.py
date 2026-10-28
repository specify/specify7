from unittest import TestCase
from unittest.mock import Mock, patch
from types import SimpleNamespace

from django.core.exceptions import BadRequest
from django.test import RequestFactory
from sqlalchemy import Column, Integer, MetaData, Table, create_engine
from sqlalchemy.orm import Session

from specifyweb.backend.stored_queries import execution, views
from specifyweb.backend.stored_queries.query_construct import QueryConstruct


class TestSelectionExecution(TestCase):
    def test_query_builder_filters_selection_before_counting_or_paginating(self):
        engine = create_engine("sqlite://")
        metadata = MetaData()
        rows = Table("rows", metadata, Column("record_id", Integer))
        metadata.create_all(engine)
        try:
            with Session(engine) as session:
                session.execute(rows.insert(), [
                    {"record_id": record_id} for record_id in [1, 2, 2, 3, 4]
                ])
                base = QueryConstruct(
                    collection=None,
                    objectformatter=None,
                    query=session.query(rows.c.record_id),
                )
                with (
                    patch.dict(execution.models.models_by_tableid, {1: SimpleNamespace(_id=rows.c.record_id)}),
                    patch.object(execution, "build_query_construct_base", return_value=base),
                    patch.object(execution, "filter_by_collection", side_effect=lambda _model, query, _collection: query),
                    patch.object(execution, "add_fields_to_query", side_effect=lambda **kwargs: (kwargs["query"], [], [])),
                ):
                    for selection, expected in (
                        ({"mode": "include", "ids": []}, []),
                        ({"mode": "exclude", "ids": []}, [1, 2, 2, 3, 4]),
                        ({"mode": "exclude", "ids": [2]}, [1, 3, 4]),
                        ({"mode": "include", "ids": [2]}, [2, 2]),
                    ):
                        with self.subTest(selection=selection):
                            query, _ = execution.build_query(
                                session, Mock(), Mock(), 1, [],
                                execution.BuildQueryProps(selection=selection),
                            )
                            self.assertEqual(query.count(), len(expected))
                            self.assertEqual(
                                [row[0] for row in query.order_by(rows.c.record_id).offset(1).limit(2)],
                                expected[1:3],
                            )
        finally:
            engine.dispose()

    @patch.object(execution.models, "session_context")
    @patch.object(execution, "fields_from_json", return_value=[])
    @patch.object(execution, "execute")
    def test_ephemeral_preserves_selection_and_query_context(self, execute, _fields, session_context):
        selection = {"mode": "exclude", "ids": [2, 3]}
        collection, user = Mock(), Mock()
        execution.run_ephemeral_query(collection, user, {
            "contexttableid": 1,
            "selectdistinct": False,
            "countonly": False,
            "searchsynonymy": True,
            "fields": [],
            "recordsetid": 42,
            "selection": selection,
            "limit": 40,
            "offset": 80,
        })
        self.assertEqual(execute.call_args.kwargs, {
            "session": session_context.return_value.__enter__.return_value,
            "collection": collection,
            "user": user,
            "tableid": 1,
            "distinct": False,
            "series": None,
            "search_synonymy": True,
            "count_only": False,
            "query_fields": [],
            "limit": 40,
            "offset": 80,
            "recordsetid": 42,
            "formatauditobjs": False,
            "selection": selection,
        })

    @patch.object(views, "check_permission_targets")
    def test_invalid_selection_is_rejected_before_execution(self, _permissions):
        request = RequestFactory().post(
            "/stored_query/ephemeral/",
            {"selection": {"mode": "exclude", "ids": ["2"]}},
            content_type="application/json",
        )
        request.specify_collection = Mock(id=1)
        request.specify_user = Mock(id=2)
        with self.assertRaises(BadRequest):
            views.get_query(request)

    @patch.object(execution.models, "session_context")
    @patch.object(execution, "fields_from_json", return_value=[])
    @patch.object(execution, "Message")
    @patch.object(execution, "query_to_csv")
    @patch.object(execution, "query_to_kml")
    def test_exports_forward_selection_including_empty_include(
        self, kml, csv, _message, _fields, _session
    ):
        for export_type, exporter in (("csv", csv), ("kml", kml)):
            for selection in (
                {"mode": "include", "ids": []},
                {"mode": "include", "ids": [2]},
                {"mode": "exclude", "ids": [3]},
            ):
                with self.subTest(export_type=export_type, selection=selection):
                    execution.do_export({
                        "contexttableid": 1,
                        "selectdistinct": False,
                        "fields": [],
                        "captions": [],
                        "delimiter": ",",
                        "bom": False,
                        "recordsetid": 42,
                        "searchsynonymy": True,
                        "selection": selection,
                    }, Mock(), Mock(), "selection.csv", export_type, None)
                    self.assertEqual(exporter.call_args.kwargs["selection"], selection)
                    self.assertEqual(exporter.call_args.kwargs["recordsetid"], 42)
                    self.assertTrue(exporter.call_args.kwargs["search_synonymy"])

    @patch.object(execution.models, "session_context")
    @patch.object(execution.models, "RecordSet")
    @patch.object(execution, "fields_from_json", return_value=[])
    @patch.object(execution, "build_query")
    @patch.object(execution, "insert")
    def test_recordset_uses_selection_in_insert_select(
        self, insert, build_query, _fields, recordset, _session
    ):
        recordset.return_value.recordSetId = 5
        query = Mock()
        build_query.return_value = (query, [])
        for selection in (
            {"mode": "include", "ids": []},
            {"mode": "exclude", "ids": [2]},
        ):
            with self.subTest(selection=selection):
                execution.recordset(Mock(id=1), Mock(id=2), Mock(id=3), {
                    "name": "Selection",
                    "fromquery": {
                        "contexttableid": 1,
                        "fields": [],
                        "recordsetid": 42,
                        "searchsynonymy": True,
                        "selection": selection,
                    },
                })
                props = build_query.call_args.args[-1]
                self.assertEqual(props.selection, selection)
                self.assertEqual(props.recordsetid, 42)
                self.assertTrue(props.search_synonymy)
                self.assertEqual(
                    insert.return_value.from_select.call_args.args[1],
                    query.with_entities.return_value.distinct.return_value,
                )
