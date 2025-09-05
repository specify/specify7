import type { RA, WritableArray } from '../../utils/types';
import type { SerializedResource } from '../DataModel/helperTypes';
import type {
  Attachment,
  SpDataSetAttachment,
  Tables,
} from '../DataModel/types';
import type { Dataset } from '../WbPlanView/Wrapped';

export const ATTACHMENTS_COLUMN = '_UPLOADED_ATTACHMENTS';
export const BASE_TABLE_NAME = 'baseTable' as const;

type AttachmentTargetTable = keyof Tables | typeof BASE_TABLE_NAME;

type CellAttachment = {
  readonly id: number;
  readonly table: AttachmentTargetTable;
};

type CellAttachments = {
  readonly attachments: RA<CellAttachment>;
  readonly formatted: string;
};

export function attachmentsToCell(
  dataSetAttachments: RA<SerializedResource<SpDataSetAttachment>>,
  targetTable: AttachmentTargetTable
): string {
  const formattedAttachments: WritableArray<string> = [];
  const att: WritableArray<CellAttachment> = [];
  dataSetAttachments.forEach((dataSetAttachment) => {
    const attachment =
      dataSetAttachment.attachment as SerializedResource<Attachment>;
    att.push({
      id: dataSetAttachment.id,
      table: targetTable,
    } as CellAttachment);
    formattedAttachments.push(attachment.origFilename);
  });

  const data: CellAttachments = {
    attachments: att,
    formatted: formattedAttachments.join('; '),
  };
  return JSON.stringify(data);
}

export function getAttachmentsFromCell(
  cellData: string
): CellAttachments | undefined {
  if (cellData.length === 0) {
    return undefined;
  }
  const data = JSON.parse(cellData) as CellAttachments;
  if (data.attachments.length > 0) {
    return data;
  }
  return undefined;
}

export function formatAttachmentsFromCell(value: any): string | undefined {
  return typeof value === 'string' && value.length > 0
    ? (JSON.parse(value) as CellAttachments | undefined)?.formatted
    : undefined;
}

/**
 * TODO: Use the attachment column name from the dataset's upload plan.
 * For now, it can be safely assumed attachment columns will always be named ATTACHMENTS_COLUMN.
 * If it needs to be changed for any reason, the upload plan can be referenced for backwards compatibility.
 */
export function usesAttachments(dataset: Dataset): boolean {
  return dataset.columns.includes(ATTACHMENTS_COLUMN);
}

export function getAttachmentsColumn(dataset: Dataset): number {
  if (!usesAttachments(dataset)) {
    return -1;
  }
  return dataset.columns.indexOf(ATTACHMENTS_COLUMN);
}

/**
 * In contexts where the dataset is not known, this function can be modified to
 * accept an uploadPlan to determine where the attachments column is.
 * Right now this function doesn't do anything different.
 */
export function getAttachmentsColumnFromHeaders(headers: RA<string>): number {
  if (!headers.includes(ATTACHMENTS_COLUMN)) {
    return -1;
  }
  return headers.indexOf(ATTACHMENTS_COLUMN);
}
