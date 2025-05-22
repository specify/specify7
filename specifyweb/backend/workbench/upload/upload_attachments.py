import json
import logging
from typing import Tuple, cast

from .uploadable import Row, Uploadable
from specifyweb.businessrules.rules.attachment_rules import tables_with_attachments
from .column_options import ColumnOptions
from .upload_table import UploadTable
from ..models import Attachment, Spdataset, Spdatasetattachment

logger = logging.getLogger(__name__)

BASE_TABLE_NAME = "baseTable"
ATTACHMENTS_COLUMN = "UPLOADED_ATTACHMENTS"

def get_attachments(row: Row):
    if has_attachments(row):
        return json.loads(cast(str, row.get(ATTACHMENTS_COLUMN)))
    return None

def has_attachments(row: Row) -> bool:
    return row.get(ATTACHMENTS_COLUMN) is not None and row.get(ATTACHMENTS_COLUMN) != ""

def validate_attachment(
    row: Row, upload_plan: UploadTable
) -> bool:
    if has_attachments(row):
        data = get_attachments(row)
        if data and isinstance(data, dict):
            base_table = upload_plan.name
            for attachment in data.get("attachments", []):
                if attachment.get("id") and attachment.get("table"):
                    table_name = attachment["table"]
                    if table_name == BASE_TABLE_NAME:
                        table_name = base_table
                    # Check if table supports attachments (e.g. CollectionObject must have CollectionObjectAttachment)
                    supports_attachments = any(model.__name__.lower() == table_name.lower() for model in tables_with_attachments)
                    # TODO: When not uploading to the base table, make sure the target table exists in the upload plan.
                        
                    return supports_attachments
    return False

def add_attachments_to_plan(
    row: Row, upload_plan: UploadTable
) -> Tuple["Row", "Uploadable"]:
    attachments_data = get_attachments(row)
    assert attachments_data is not None, "Dataset does not actually have attachments"
    attachments = attachments_data.get("attachments", [])

    base_table = upload_plan.name

    # Create copy of upload plan and row for modification
    new_upload_plan = upload_plan._replace()
    new_row = row.copy()
    logger.debug("Attachments: %s", attachments)

    attachment_fields_to_copy = [
        "ispublic",
        "origfilename",
        "title",
        "attachmentlocation",
    ]

    for index, attachment in enumerate(attachments):
        # Add columns to row for this attachment
        spdatasetattachment = Spdatasetattachment.objects.get(id=attachment["id"])
        assert spdatasetattachment.attachment is not None, "Attachment does not exist"

        new_row[f"_ATTACHMENT_ORDINAL_{index}"] = str(spdatasetattachment.ordinal)
        for field in attachment_fields_to_copy:
            new_row[f"_ATTACHMENT_{field.upper()}_{index}"] = str(getattr(spdatasetattachment.attachment, field) or "")

        # Inject attachment tables into upload plan
        table_name = attachment["table"]
        logger.debug("Table name: %s", table_name)
        if table_name == BASE_TABLE_NAME:
            # Only base table attachments are supported for now
            table_name = base_table

            attachment_table = table_name.lower() + "attachments"
            attachment_field = (table_name + "attachment").capitalize()

            # Create plan for parent attachment table if its not already there
            if attachment_table not in new_upload_plan.toMany:
                new_upload_plan.toMany[attachment_table] = []
            attachment_table_plan = new_upload_plan.toMany[attachment_table]

            # Map newly created columns
            ordinal_column = ColumnOptions(
                column=f"_ATTACHMENT_ORDINAL_{index}",
                matchBehavior="ignoreNever",
                nullAllowed=True,
                default="0"
            )
            attackment_columns = {}
            for field in attachment_fields_to_copy:
                attackment_columns[field] = ColumnOptions(
                    column=f"_ATTACHMENT_{field.upper()}_{index}",
                    matchBehavior="ignoreNever",
                    nullAllowed=True,
                    default="0"
                )
            attachment_uploadable = UploadTable(
                name="Attachment",
                wbcols=attackment_columns,
                static={},
                toOne={},
                toMany={},
                overrideScope=None,
            )

            # Insert into upload plan
            if index >= len(attachment_table_plan):
                # Create new attachment parent record and match existing attachment
                attachment_table_plan.append(
                    UploadTable(
                        name=attachment_field,
                        wbcols={
                            "ordinal": ordinal_column,
                        },
                        static={},
                        toOne={
                            "attachment": attachment_uploadable
                        },
                        toMany={},
                        overrideScope=None,
                ))
            else:
                # We only want attachments to be matched. New attachment records should not be created.
                # Any attachment fields will be overwritten on purpose. Perhaps this should also result in an error?
                attachment_table_record_plan = cast(UploadTable, attachment_table_plan[index])
                if attachment_table_record_plan.toOne.get("attachment") is not None:
                    raise ValueError("There cannot be any Attachment fields in the upload plan when uploading attachments.")
                
                attachment_table_plan[index] = UploadTable(
                    name=attachment_table_record_plan.name,
                    wbcols={
                        "ordinal": ordinal_column,
                        **attachment_table_record_plan.wbcols,
                    },
                    static=attachment_table_record_plan.static,
                    toOne={
                        "attachment": attachment_uploadable
                    },
                    toMany=attachment_table_record_plan.toMany,
                    overrideScope=attachment_table_record_plan.overrideScope,
                )
    return new_row, new_upload_plan

def unlink_attachments(
    ds: Spdataset,
) -> None:
    spdatasetattachments = Spdatasetattachment.objects.filter(spdataset=ds.id)
    for spdatasetattachment in spdatasetattachments:
        attachment: Attachment = spdatasetattachment.attachment
        attachment.tableid = ds.specify_model.tableId  # type: ignore[union-attr]
        attachment.save()  # type: ignore[attr-defined]