import { ajax } from '../../utils/ajax';
import type { RA, WritableArray } from '../../utils/types';
import { uploadFile } from '../Attachments/attachments';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { SerializedRecord } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import {
  deserializeResource,
  serializeResource,
} from '../DataModel/serializers';
import { tables } from '../DataModel/tables';
import type {
  Attachment,
  Spdataset,
  SpDataSetAttachment,
  Tables,
} from '../DataModel/types';
import type { Dataset } from '../WbPlanView/Wrapped';
import Handsontable from 'handsontable';
import { f } from '../../utils/functools';
import { raise } from '../Errors/Crash';

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

export function uploadFiles(
  files: RA<File>,
  handleProgress: (progress: (progress: number | undefined) => number) => void
): RA<Promise<SpecifyResource<Attachment>>> {
  return files.map(async (file) =>
    uploadFile(file)
      .then(async (attachment) =>
        attachment === undefined
          ? Promise.reject(`Upload failed for file ${file.name}`)
          : attachment
      )
      .finally(() =>
        handleProgress((progress) =>
          typeof progress === 'number' ? progress + 1 : 1
        )
      )
  );
}

export async function createDataSetAttachments(
  attachments: RA<SpecifyResource<Attachment>>,
  dataSet: SpecifyResource<Spdataset> | number
): Promise<RA<SpecifyResource<SpDataSetAttachment>>> {
  return Promise.all(
    attachments.map(
      (attachment) =>
        new tables.SpDataSetAttachment.Resource({
          attachment: attachment as never,
          spdataset:
            typeof dataSet === 'number'
              ? `/api/specify/spdataset/${dataSet}/`
              : dataSet.url(),
          ordinal: 0,
        })
    )
  );
}

export async function saveDataSetAttachments(
  dataSetAttachments: RA<SpecifyResource<SpDataSetAttachment>>
): Promise<RA<SpecifyResource<SpDataSetAttachment>>> {
  return ajax<RA<SerializedRecord<SpDataSetAttachment>>>(
    `/bulk_copy/bulk/${tables.SpDataSetAttachment.name.toLowerCase()}/`,
    {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: dataSetAttachments.map((dataSetAttachment) =>
        serializeResource(dataSetAttachment)
      ),
    }
  ).then(({ data }) =>
    data.map((resource) => deserializeResource(serializeResource(resource)))
  );
}

export async function uploadAttachmentsToRow(
  files: RA<File>,
  dataset: Dataset,
  hot: Handsontable,
  row: number,
  existingAttachments: RA<SerializedResource<SpDataSetAttachment>>,
  targetTable: AttachmentTargetTable,
  setFileUploadLength: React.Dispatch<React.SetStateAction<number>>,
  setFileUploadProgress: React.Dispatch<
    React.SetStateAction<number | undefined>
  >,
): Promise<void> {
  const attachmentColumn = getAttachmentsColumn(dataset);
  if (attachmentColumn === -1) return;
  setFileUploadProgress(0);
  setFileUploadLength(files.length);
  await Promise.all(uploadFiles(files, setFileUploadProgress))
    .then(async (attachments) =>
      // Create SpDataSetAttachments for each attachment
      f.all({
        dataSetAttachments: createDataSetAttachments(
          attachments,
          dataset.id
        ).then(async (unsavedDataSetAttachments) => {
          let ordinal = attachments.length;
          unsavedDataSetAttachments.forEach((dataSetAttachment) => {
            ordinal++;
            dataSetAttachment.set('ordinal', ordinal);
          });
          return saveDataSetAttachments(unsavedDataSetAttachments);
        }),
      })
    )
    .then(async ({ dataSetAttachments }) => {
      const allDataSetAttachments = [
        ...existingAttachments,
        ...dataSetAttachments.map((att) => serializeResource(att))
      ] as RA<SerializedResource<SpDataSetAttachment>>;

      const data = attachmentsToCell(allDataSetAttachments, targetTable);
      hot.setDataAtCell(row, attachmentColumn, data);

      setFileUploadProgress(undefined);
      // The dataset still needs to be saved after this.
    })
    .catch(async (error) => {
      setFileUploadProgress(undefined);
      raise(error);
    });
}