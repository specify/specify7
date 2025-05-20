import json
import logging
from typing import cast

from .uploadable import (
    Row,
    Uploadable,
)
from specifyweb.businessrules.rules.attachment_rules import tables_with_attachments
from .column_options import ColumnOptions
from .upload_table import UploadTable

logger = logging.getLogger(__name__)

ATTACHMENTS_COLUMN = "UPLOADED_ATTACHMENTS"

def get_attachments(
    row: Row,
):
    if has_attachments(row):
        return json.loads(cast(str, row.get(ATTACHMENTS_COLUMN)))
    return None

def has_attachments(
    row: Row,
):
    return row.get(ATTACHMENTS_COLUMN) is not None and row.get(ATTACHMENTS_COLUMN) != ""

def validate_attachment(
    row: Row,
):
    # Example row: Row: {'Attachments': '{'attachments':[{'id':123,'table':CollectionObject}]}', 'Catalog #': '', 'OK For Online': ''}
    if has_attachments(row):
        data = get_attachments(row)
        if data and isinstance(data, dict):
            for attachment in data.get("attachments", []):
                logger.debug("Attachment: %s", attachment)
                if attachment.get("id") and attachment.get("table"):
                    table_name = attachment["table"]
                    # Check if table supports attachments (e.g. CollectionObject must have CollectionObjectAttachment)
                    supports_attachments = any(model.__name__.lower() == table_name.lower() for model in tables_with_attachments)
                    logger.debug(
                        "Table %s supports attachments: %s",
                        table_name,
                        supports_attachments,
                    )
                        
                    return supports_attachments
    return False

def add_attachments_to_plan(upload_plan: Uploadable, attachments: list) -> "UploadTable":
    copy = upload_plan._replace()
    logger.debug("Attachments: %s", attachments)
    for index, attachment in enumerate(attachments):
        attachment_table = attachment["table"].lower() + "attachments"
        attachment_field = (attachment["table"].lower() + "attachment").capitalize()
        if attachment_table not in copy.toMany:
            copy.toMany[attachment_table] = []
        # inject new attachment
        if len(copy.toMany[attachment_table]) <= index:
            copy.toMany[attachment_table].append(
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
    return copy