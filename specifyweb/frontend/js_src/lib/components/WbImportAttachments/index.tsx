/**
 * Workbench Attachment import page
 *
 * @module
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';

import { attachmentsText } from '../../localization/attachments';
import {
  attachmentSettingsPromise,
  fetchAssetToken,
  uploadFile,
} from '../Attachments/attachments';
import { commonText } from '../../localization/common';
import type { RA } from '../../utils/types';
import { Container, H2 } from '../Atoms';
import { Button } from '../Atoms/Button';
import { useMenuItem } from '../Header/MenuContext';
import { FilePicker } from '../Molecules/FilePicker';
import { createDataSet } from '../WbImport/helpers';
import { ChooseName } from '../WbImport/index';
import { LoadingContext } from '../Core/Contexts';
import { useBooleanState } from '../../hooks/useBooleanState';
import { raise } from '../Errors/Crash';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { tables } from '../DataModel/tables';
import type { Attachment } from '../DataModel/types';
// import { useErrorContext } from '../../hooks/useErrorContext';

export function WbImportAttachmentsView(): JSX.Element {
  useMenuItem('workBench');
  const [files, setFiles] = React.useState<readonly File[] | undefined>();
  
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
      {files !== undefined && files.length > 0 && (
        <FilesPicked files={files} />
      )}
    </Container.Full>
  );
}

function FilesPicked({ files }: { readonly files: readonly File[] }): JSX.Element {
  const navigate = useNavigate();
  const [uploadProgress, setUploadProgress] = React.useState<
  number | true | undefined
  >(undefined);
  const [isFailed, handleFailed] = useBooleanState();
  const loading = React.useContext(LoadingContext);

  const handleFilesSelected = async (
    files: readonly File[],
    dataSetName: string
  ): Promise<void> => {
    /*
     * TODO: Upload attachments to spdatasetAttachments
     * Then this attachment column will be set to the ID of the attachment
     * For multiple attachments either use new columns (a bit wasteful) or separate each ID with a comma (unconventional for the WB)
     */

    // go through all files in "files"

    let attachments: SpecifyResource<Attachment>[] = [];
    let attachmentIds: number[] = []; // TODO: These should be SpDataSetAttachments, not Attachments (For the DataSet -> SpDataSetAttachment -> Attachment relationship)

    async function handleUploaded(attachment: SpecifyResource<Attachment>): Promise<void> {
      await attachment.save();
      console.log(attachment);
      attachments.push(attachment);
      attachmentIds.push(attachment.id);
      console.log(attachment.id, "done");
    }
    console.log("uploading files");

    // TODO Add loading bar
    const uploads = files.map((file) =>
      uploadFile(file, setUploadProgress)
        .then((attachment) =>
          attachment === undefined
            ? handleFailed()
            : handleUploaded(attachment)
        )
        .catch((error) => {
          handleFailed();
          raise(error);
        })
        .finally(() => setUploadProgress(undefined))
    );

    await Promise.all(uploads); // Wait for all uploads to be complete
    console.log("probably done uploading files");

    // TODO: Create SpDataSetAttachment Record, then link Attachments to SpDataSetAttachment

    const data: RA<RA<string>> = [
      ['Attachment'],
      ...Array.from(attachmentIds, (id) => [id.toString()]),
    ];

    const { id } = await createDataSet({
      dataSetName,
      fileName: 'attachments',
      hasHeader: true,
      data,
    });
    navigate(`/specify/workbench/${id}/`);
  };

  const [dataSetName, setDataSetName] = React.useState<string>(
    attachmentsText.attachments()
  );

  // TODO: Preview files
  return (
    <div className="grid w-96 grid-cols-2 items-center gap-2 mt-2">
      <ChooseName name={dataSetName} onChange={setDataSetName} />
      <Button.Secondary
        className="col-span-full justify-center text-center"
        onClick={async (): Promise<void> =>
          handleFilesSelected(files, dataSetName)
        }
      >
        {attachmentsText.importAttachments()}
      </Button.Secondary>
    </div>
  );
}

// const createWorkbenchDataSet = async () =>
//   createEmptyDataSet<Dataset>(
//     '/api/workbench/dataset/',
//     wbText.newDataSetName({ date: new Date().toDateString() }),
//     {
//       importedfilename: '',
//       columns: [],
//     }
//   );

// export const createEmptyDataSet = async <
//   DATASET extends AttachmentDataSet | Dataset,
// >(
//   datasetUrl: string,
//   name: LocalizedString,
//   props?: Partial<DATASET>
// ): Promise<DATASET> =>
//   ajax<DATASET>(datasetUrl, {
//     method: 'POST',
//     body: {
//       name: await uniquifyDataSetName(name, undefined, datasetUrl),
//       rows: [],
//       ...props,
//     },
//     headers: {
//       // eslint-disable-next-line @typescript-eslint/naming-convention
//       Accept: 'application/json',
//     },
//   }).then(({ data }) => data);