import json
import logging
from typing import (
    Tuple,
    cast,
)

from .uploadable import (
    Row,
    Uploadable,
)
from specifyweb.businessrules.rules.attachment_rules import tables_with_attachments
from .column_options import ColumnOptions
from .upload_table import UploadTable
from ..models import Spdatasetattachment

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
                        
                    return supports_attachments
    return False

def add_attachments_to_plan(
    row: Row, upload_plan: UploadTable
) -> Tuple["Row", "Uploadable"]:
    attachments_data = get_attachments(row)
    assert attachments_data is not None, "Dataset does not actually have attachments"
    attachments = attachments_data.get("attachments", [])

    base_table = upload_plan.name

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

            if attachment_table not in new_upload_plan.toMany:
                new_upload_plan.toMany[attachment_table] = []

            if len(new_upload_plan.toMany[attachment_table]) <= index:
                new_upload_plan.toMany[attachment_table].append(
                    UploadTable(
                        name=attachment_field,
                        wbcols={
                            'ordinal': ColumnOptions(
                                column=f"_ATTACHMENT_ORDINAL_{index}",
                                matchBehavior='ignoreNever',
                                nullAllowed=True,
                                default='0'
                            )
                        },
                        static={},
                        toOne={
                            "attachment": UploadTable(
                                name="Attachment",
                                wbcols={
                                    'ispublic': ColumnOptions(
                                        column=f"_ATTACHMENT_ISPUBLIC_{index}",
                                        matchBehavior='ignoreNever',
                                        nullAllowed=True,
                                        default='FALSE'
                                    ),
                                    'origfilename': ColumnOptions(
                                        column=f"_ATTACHMENT_ORIGFILENAME_{index}",
                                        matchBehavior='ignoreNever',
                                        nullAllowed=True,
                                        default='0'
                                    ),
                                    'title': ColumnOptions(
                                        column=f"_ATTACHMENT_TITLE_{index}",
                                        matchBehavior='ignoreNever',
                                        nullAllowed=True,
                                        default='0'
                                    ),
                                    'attachmentlocation': ColumnOptions(
                                        column=f"_ATTACHMENT_ATTACHMENTLOCATION_{index}",
                                        matchBehavior='ignoreNever',
                                        nullAllowed=True,
                                        default='0'
                                    ),
                                },
                                static={},
                                toOne={},
                                toMany={},
                                overrideScope=None,
                            )
                        },
                        toMany={},
                        overrideScope=None,
                ))
    return new_row, new_upload_plan