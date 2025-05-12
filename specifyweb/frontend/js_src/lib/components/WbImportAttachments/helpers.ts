import type { WritableArray } from '../../utils/types';
import type { SerializedResource } from "../DataModel/helperTypes";
import type {
  Attachment,
  SpDataSetAttachment,
  Tables,
} from "../DataModel/types";

type CellAttachment = {
  readonly id: number;
  readonly table: keyof Tables;
};

type CellAttachments = {
  readonly attachments: readonly CellAttachment[];
  readonly formatted: string;
};

export function attachmentsToCell(
  dataSetAttachments: readonly SerializedResource<SpDataSetAttachment>[],
  targetTable: keyof Tables
): string {
  const formattedAttachments: WritableArray<string> = [];
  const att: WritableArray<CellAttachment> = [];
  dataSetAttachments.forEach((dataSetAttachment) => {
    const attachment = dataSetAttachment.attachment as SerializedResource<Attachment>;
    att.push({
      id: dataSetAttachment.id,
      table: targetTable,
    } as CellAttachment);
    formattedAttachments.push(attachment.origFilename);
  });
  
  const data: CellAttachments = 
    {
      attachments: att,
      formatted: formattedAttachments.join("; "),
    }
  return JSON.stringify(data);
}

export function getAttachmentsFromCell(
  cellData: string,
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