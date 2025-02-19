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
import { FilePicker, Layout } from '../Molecules/FilePicker';
import { createDataSet } from '../WbImport/helpers';
import type { RA } from '../../utils/types';

export function WbImportAttachmentsView(): JSX.Element {
  useMenuItem('workBench');
  const navigate = useNavigate();

  const handleFilesSelected = async (files: FileList): Promise<void> => {
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
      dataSetName: attachmentsText.attachments(),
      fileName: "attachments",
      hasHeader: true,
      data,
    });
    navigate(`/specify/workbench/${id}/`);
  };

  // TODO: Preview files and a separate "Import Attachments" button
  return (
    <>
      <Container.Full>
        <H2>{commonText.multipleFilePickerMessage()}</H2>
        <div className="w-96">
          <FilePicker
            acceptedFormats={undefined}
            showFileNames={true}
            onFilesSelected={handleFilesSelected}
          />
        </div>
      </Container.Full>
    </>
  );
}