/**
 * Workbench Attachment import page
 *
 * @module
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';

import { attachmentsText } from '../../localization/attachments';
import { commonText } from '../../localization/common';
import type { RA } from '../../utils/types';
import { Container, H2 } from '../Atoms';
import { Button } from '../Atoms/Button';
import { useMenuItem } from '../Header/MenuContext';
import { FilePicker } from '../Molecules/FilePicker';
import { createDataSet } from '../WbImport/helpers';
import { ChooseName } from '../WbImport/index';

export function WbImportAttachmentsView(): JSX.Element {
  useMenuItem('workBench');
  const [files, setFiles] = React.useState<File[] | undefined>();
  
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

function FilesPicked({ files }: { readonly files: File[] }): JSX.Element {
  const navigate = useNavigate();

  const handleFilesSelected = async (
    files: File[],
    dataSetName: string
  ): Promise<void> => {
    /*
     * TODO: Upload attachments to spdatasetAttachments
     * Then this attachment column will be set to the ID of the attachment
     * For multiple attachments either use new columns (a bit wasteful) or separate each ID with a comma (unconventional for the WB)
     */
    const data: RA<RA<string>> = [
      ['Attachment'],
      ...Array.from(files, (file) => [file.name] as RA<string>),
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
