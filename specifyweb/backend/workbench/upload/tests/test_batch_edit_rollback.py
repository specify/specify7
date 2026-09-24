import json
from specifyweb.backend.stored_queries.batch_edit import make_dataset, run_batch_edit_query # type: ignore
from specifyweb.backend.stored_queries.queryfield import QueryField
from specifyweb.backend.stored_queries.queryfieldspec import QueryFieldSpec
from specifyweb.backend.stored_queries.tests.test_batch_edit import props_builder
from specifyweb.backend.stored_queries.tests.tests import SQLAlchemySetup
from specifyweb.backend.workbench.models import Spdataset
from specifyweb.backend.workbench.upload.tests.base import UploadTestsBase
from specifyweb.backend.workbench.upload.upload import (
    do_upload_dataset, 
    rollback_batch_edit,
)
from specifyweb.backend.workbench.views import regularize_rows
from specifyweb.specify.models import Collectionobject

"""
Creating a batch edit data set also creates a backup through the make_dataset 
function. Rolling back (rollback_batch_edit) re-uploads the backed up values over 
the committed records, calling upon unupload to roll back the data set
"""

ORIGINAL_REMARKS = "Remarks before batch edit"
EDITED_REMARKS = "Remarks changed by batch edit"

class BatchEditRollbackTests(SQLAlchemySetup, UploadTestsBase):
    def setUp(self):
        super().setUp()
        self.build_props = props_builder(
            self, BatchEditRollbackTests.test_session_context
        )
        Collectionobject.objects.all().delete()
        self.co = Collectionobject.objects.create(
            catalognumber="7924".zfill(9),
            remarks=ORIGINAL_REMARKS,
            collection=self.collection,
        )

    def _query_field(self, path) -> QueryField:
        return QueryField(
            fieldspec=QueryFieldSpec.from_path(("Collectionobject", *path)),
            op_num=8,
            value=None,
            negate=False,
            display=True,
            format_name=None,
            sort_type=0,
        )

    def _commit_edit(self) -> Spdataset:
        props = self.build_props(
            [self._query_field(["catalognumber"]), self._query_field(["remarks"])],
            "Collectionobject",
        )
        headers, rows, packs, plan_json, visual_order = run_batch_edit_query(props)
        rows_with_packs = [
            [*row, json.dumps({"batch_edit": pack})] for row, pack in zip(rows, packs)
        ]
        original_rows = regularize_rows(len(headers), rows_with_packs, skip_empty=False)

        dataset_id, _ = make_dataset(
            user=self.specifyuser,
            collection=self.collection,
            name="rollback",
            headers=headers,
            regularized_rows=original_rows,
            agent=self.agent,
            json_upload_plan=plan_json,
            visual_order=visual_order,
        )
        dataset = Spdataset.objects.get(id=dataset_id)

        row_index = next(
            index
            for index, pack in enumerate(packs)
            if pack["self"]["id"] == self.co.id
        )
        remarks_column = next(
            index
            for index, header in enumerate(headers)
            if header.lower().endswith("remarks")
        )
        edited_rows = [list(row) for row in dataset.data]
        edited_rows[row_index][remarks_column] = EDITED_REMARKS
        dataset.data = edited_rows
        dataset.save()

        do_upload_dataset(
            self.collection,
            self.agent.id,
            dataset,
            no_commit=False,
            allow_partial=False,
        )
        dataset.refresh_from_db()
        return dataset

    def test_commit_applies_the_edit(self):
        self._commit_edit()
        self.co.refresh_from_db()
        self.assertEqual(self.co.remarks, EDITED_REMARKS)

    def test_rollback_restores_the_original_values(self):
        dataset = self._commit_edit()
        rollback_batch_edit(dataset, self.collection, self.agent)
        self.co.refresh_from_db()
        self.assertEqual(self.co.remarks, ORIGINAL_REMARKS)

    def test_rollback_does_not_delete_edited_records(self):
        dataset = self._commit_edit()
        rollback_batch_edit(dataset, self.collection, self.agent)
        self.assertTrue(Collectionobject.objects.filter(id=self.co.id).exists())