/**
 * Workbench Attachment import page
 *
 * @module
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';

import { commonText } from '../../localization/common';
import { attachmentsText } from '../../localization/attachments';
import { Container, H2 } from '../Atoms';
import { useMenuItem } from '../Header/MenuContext';
import { FilePicker } from '../Molecules/FilePicker';
import { createDataSet } from '../WbImport/helpers';
import { ChooseName } from '../WbImport/index';
import { Button } from '../Atoms/Button';
import type { RA } from '../../utils/types';

export function WbImportAttachmentsView(): JSX.Element {
  useMenuItem('workBench');
  const [files, setFiles] = React.useState<FileList | undefined>();

  // TODO: Preview files and a separate "Import Attachments" button
  return (
    <>
      <Container.Full>
        <H2>{commonText.multipleFilePickerMessage()}</H2>
        <div className="w-96">
          <FilePicker
            acceptedFormats={undefined}
            showFileNames={true}
            onFilesSelected={(selectedFiles) => setFiles(selectedFiles)}
          />
          {files !== undefined && files.length > 0 && <FilePicked files={files} />}
        </div>
      </Container.Full>
    </>
  );
}

function FilePicked({ files }: { readonly files: FileList }): JSX.Element {
  const navigate = useNavigate();

  const handleFilesSelected = async (
    files: FileList,
    dataSetName: string
  ): Promise<void> => {
    // TODO: Remove
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(file);
    }
  
    // TODO: Upload attachments to spdatasetAttachments
    // Then this attachment column will be set to the ID of the attachment
    // For multiple attachments either use new columns (a bit wasteful) or separate each ID with a comma (unconventional for the WB)
    const data: RA<RA<string>> = [
      ["Attachment"],
      ...Array.from(files).map(file => [file.name] as RA<string>)
    ];
  
    const { id } = await createDataSet({
      dataSetName: dataSetName,
      fileName: "attachments",
      hasHeader: true,
      data,
    });
    navigate(`/specify/workbench/${id}/`);
  };

  const [dataSetName, setDataSetName] = React.useState<string>(
    attachmentsText.attachments()
  );

  return (
    <>
      <div className="grid w-96 grid-cols-2 items-center gap-2">
        <ChooseName name={dataSetName} onChange={setDataSetName} />
        <Button.Secondary
          className="col-span-full justify-center text-center"
          onClick={(): Promise<void> => handleFilesSelected(files, dataSetName)}
        >
          {attachmentsText.importAttachments()}
        </Button.Secondary>
      </div>
    </>
  );
}