import { Tables } from "../DataModel/types";
import { SerializedResource } from "../DataModel/helperTypes";
import { SpDataSetAttachment, Attachment } from "../DataModel/types";
import type { WritableArray } from '../../utils/types';

type cellAttachment = {
  id: number;
  table: keyof Tables;
};

type cellAttachments = {
  attachments: cellAttachment[];
  formatted: string;
};

export function attachmentsToCell(
  dataSetAttachments: SerializedResource<SpDataSetAttachment>[],
  targetTable: keyof Tables
): string {
  let formattedAttachments: WritableArray<string> = [];
  let att: WritableArray<cellAttachment> = [];
  dataSetAttachments.forEach((dataSetAttachment) => {
    const attachment = dataSetAttachment.attachment as SerializedResource<Attachment>;
    att.push({
      id: dataSetAttachment.id,
      table: targetTable,
    } as cellAttachment);
    formattedAttachments.push(attachment.origFilename);
  });
  
  const data: cellAttachments = 
    {
      attachments: att,
      formatted: formattedAttachments.join(", "),
    }
  return JSON.stringify(data);
}

export function getAttachmentsFromCell(
  cellData: string,
): cellAttachments | undefined {
  if (cellData.length === 0) {
    return undefined;
  }
  try {
    const data = JSON.parse(cellData) as cellAttachments;
    if (data.attachments.length > 0) {
      return data;
    }
  } catch (error) {
    console.error("Error parsing attachment data:", error);
  }
  return undefined;
}