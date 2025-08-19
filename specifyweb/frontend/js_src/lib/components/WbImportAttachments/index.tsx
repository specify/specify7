/**
 * Workbench Attachment import page
 *
 * @module
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';

import { useBooleanState } from '../../hooks/useBooleanState';
import { attachmentsText } from '../../localization/attachments';
import { commonText } from '../../localization/common';
import { ajax } from '../../utils/ajax';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { Container, H2 } from '../Atoms';
import { Progress } from '../Atoms';
import { Button } from '../Atoms/Button';
import { uploadFile } from '../Attachments/attachments';
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
} from '../DataModel/types';
import { raise } from '../Errors/Crash';
import { useMenuItem } from '../Header/MenuContext';
import { userInformation } from '../InitialContext/userInformation';
import { loadingBar } from '../Molecules';
import { Dialog } from '../Molecules/Dialog';
import { FilePicker } from '../Molecules/FilePicker';
import { Preview } from '../Molecules/FilePicker';
import { uniquifyDataSetName } from '../WbImport/helpers';
import { ChooseName } from '../WbImport/index';

export const ATTACHMENTS_COLUMN = 'UPLOADED_ATTACHMENTS';

export function WbImportAttachmentsView(): JSX.Element {
  useMenuItem('workBench');
  const [files, setFiles] = React.useState<RA<File> | undefined>();

  return (
    <Container.Full>
      <H2>{commonText.multipleFilePickerMessage()}</H2>
      <div className="w-96">
        <FilePicker
          acceptedFormats={undefined}
          showFileNames
          onFilesSelected={(selectedFiles) => {
            setFiles(Array.from(selectedFiles));
          }}
        />
      </div>
      {files !== undefined && files.length > 0 && <FilesPicked files={files} />}
    </Container.Full>
  );
}

function uploadFiles(
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

async function createDataSetAttachments(
  attachments: RA<SpecifyResource<Attachment>>,
  dataSet: SpecifyResource<Spdataset>
): Promise<RA<SpecifyResource<SpDataSetAttachment>>> {
  return Promise.all(
    attachments.map(
      (attachment) =>
        new tables.SpDataSetAttachment.Resource({
          attachment: attachment as never,
          spdataset: dataSet.url(),
          ordinal: 0,
        })
    )
  );
}

async function saveDataSetAttachments(
  dataSetAttachments: RA<SpecifyResource<SpDataSetAttachment>>
): Promise<RA<SpecifyResource<SpDataSetAttachment>>> {
  return ajax<RA<SerializedRecord<SpDataSetAttachment>>>(
    `/api/specify/bulk/${tables.SpDataSetAttachment.name.toLowerCase()}/`,
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

function FilesPicked({ files }: { readonly files: RA<File> }): JSX.Element {
  const navigate = useNavigate();
  const [fileUploadProgress, setFileUploadProgress] = React.useState<
    number | undefined
  >(undefined);
  const [isFailed, setFailed] = useBooleanState(false);

  const handleFilesSelected = async (
    files: RA<File>,
    dataSetName: string
  ): Promise<void> => {
    setFileUploadProgress(0);

    return Promise.all(uploadFiles(files, setFileUploadProgress)) // Upload all selected files/attachments
      .then(async (attachments) =>
        f
          .all({
            // Create an empty data set
            dataSet: new tables.Spdataset.Resource({
              name: dataSetName,
              importedfilename: 'attachments',
              columns: [ATTACHMENTS_COLUMN] as never,
              data: [[]] as never,
              specifyuser: userInformation.resource_uri,
            }).save(),
            attachments,
          })
          .then(async ({ dataSet, attachments }) =>
            // Create SpDataSetAttachments for each attachment
            f.all({
              dataSetAttachments: createDataSetAttachments(
                attachments,
                dataSet
              ).then(async (unsavedDataSetAttachments) =>
                saveDataSetAttachments(unsavedDataSetAttachments)
              ),
              dataSet,
            })
          )
      )
      .then(async ({ dataSet, dataSetAttachments }) => {
        // Put all SpDataSetAttachments IDs into the data set
        const data = dataSetAttachments.map((dataSetAttachment) => [
          dataSetAttachment.id.toString(),
        ]);
        dataSet.set('data', data as never);
        dataSet.set('spDataSetAttachments', dataSetAttachments);
        return dataSet.save();
      })
      .then((dataSet) => navigate(`/specify/workbench/plan/${dataSet.id}/`))
      .catch(async (error) => {
        setFileUploadProgress(undefined);
        setFailed();
        raise(error);
      });
  };

  const [dataSetName, setDataSetName] = React.useState<string>(
    attachmentsText.attachments()
  );
  return isFailed ? (
    <p>{attachmentsText.attachmentServerUnavailable()}</p>
  ) : (
    <>
      {fileUploadProgress !== undefined && (
        <Dialog
          buttons={undefined}
          header={attachmentsText.uploadingInline()}
          onClose={undefined}
        >
          <div aria-live="polite">
            {fileUploadProgress === files.length ? (
              loadingBar
            ) : (
              <Progress max={files.length} value={fileUploadProgress} />
            )}
          </div>
        </Dialog>
      )}
      <div className="grid w-96 grid-cols-2 items-center gap-2 mt-2">
        <ChooseName name={dataSetName} onChange={setDataSetName} />
        <Button.Secondary
          className="col-span-full justify-center text-center"
          onClick={async (): Promise<void> =>
            uniquifyDataSetName(dataSetName).then(async (uniqueDataSetName) =>
              handleFilesSelected(files, uniqueDataSetName)
            )
          }
        >
          {attachmentsText.importAttachments()}
        </Button.Secondary>
      </div>
      <FilesPreview files={files} header={attachmentsText.attachments()} />
    </>
  );
}

function FilesPreview({
  header,
  files,
}: {
  readonly header: string;
  readonly files: RA<File>;
}): JSX.Element {
  const previewData = React.useMemo(() => {
    const preview: RA<RA<string>> = [
      [header],
      ...Array.from(files, (file) => [file.name]),
    ];
    return preview.length > 0 ? preview : undefined;
  }, [files]);

  return (
    <>
      {previewData !== undefined && <Preview hasHeader preview={previewData} />}
    </>
  );
}
