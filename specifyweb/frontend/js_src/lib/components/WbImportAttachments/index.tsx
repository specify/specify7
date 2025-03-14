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
import type { RA } from '../../utils/types';
import { Container, H2 } from '../Atoms';
import { Progress } from '../Atoms';
import { Button } from '../Atoms/Button';
import { uploadFile } from '../Attachments/attachments';
import { LoadingContext } from '../Core/Contexts';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { serializeResource } from '../DataModel/serializers';
import { tables } from '../DataModel/tables';
import type { Attachment, SpDataSetAttachment } from '../DataModel/types';
import { raise } from '../Errors/Crash';
import { useMenuItem } from '../Header/MenuContext';
import { userInformation } from '../InitialContext/userInformation';
import { loadingBar } from '../Molecules';
import { Dialog } from '../Molecules/Dialog';
import { FilePicker } from '../Molecules/FilePicker';
import { uniquifyDataSetName } from '../WbImport/helpers';
import { ChooseName } from '../WbImport/index';

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
      {files !== undefined && files.length > 0 && <FilesPicked files={files} />}
    </Container.Full>
  );
}

function FilesPicked({
  files,
}: {
  readonly files: readonly File[];
}): JSX.Element {
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
    dataSetName = await uniquifyDataSetName(dataSetName);
    const dataSet = new tables.Spdataset.Resource({
      name: dataSetName,
      importedfilename: 'attachments',
      columns: ['Attachment'] as never,
      data: [[]] as never,
      specifyuser: userInformation.resource_uri,
    });
    await dataSet.save();
    const dataSetUrl = dataSet.url();

    const dataSetAttachments: readonly SpecifyResource<SpDataSetAttachment>[] = [];
    async function handleUploaded(
      attachment: SpecifyResource<Attachment>
    ): Promise<void> {
      // Create SpDataSetAttachment Record for each uploaded attachment
      const dataSetAttachment: SpecifyResource<SpDataSetAttachment> =
        new tables.SpDataSetAttachment.Resource({
          attachment: attachment as never,
          spdataset: dataSetUrl,
          ordinal: 0,
        });
      attachment.set('tableID', dataSetAttachment.specifyTable.tableId);
      dataSetAttachments.push(await dataSetAttachment.save());
    }

    const uploads = files.map(async (file) =>
      uploadFile(file, setUploadProgress)
        .then(async (attachment) =>
          attachment === undefined ? handleFailed() : handleUploaded(attachment)
        )
        .catch((error) => {
          handleFailed();
          raise(error);
        })
        .finally(() => setUploadProgress(undefined))
    );

    loading(Promise.all(uploads));
    await Promise.all(uploads);

    // Data set will contain the ids to the SpDataSetAttachment records
    const data: RA<RA<string>> = Array.from(
      Array.from(dataSetAttachments, (dataSetAttachment) => [
        dataSetAttachment.id.toString(),
      ])
    );
    dataSet.set('data', data as never);
    dataSet.set(
      'spDataSetAttachments',
      dataSetAttachments.map(serializeResource)
    );
    loading(
      dataSet.save().then(() => {
        navigate(`/specify/workbench/plan/${dataSet.id}/`);
      })
    );
  };

  const [dataSetName, setDataSetName] = React.useState<string>(
    attachmentsText.attachments()
  );

  // TODO: Preview files, progress bar
  return isFailed ? (
    <p>{attachmentsText.attachmentServerUnavailable()}</p>
  ) : typeof uploadProgress === 'object' ? (
    <Dialog
      buttons={undefined}
      header={attachmentsText.uploadingInline()}
      onClose={undefined}
    >
      <div aria-live="polite">
        {typeof uploadProgress === 'number' ? (
          <Progress value={uploadProgress} />
        ) : (
          loadingBar
        )}
      </div>
    </Dialog>
  ) : (
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
