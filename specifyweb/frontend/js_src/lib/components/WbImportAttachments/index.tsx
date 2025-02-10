/**
 * Workbench Attachment import page
 *
 * @module
 */

import React from 'react';

import { commonText } from '../../localization/common';
import { Container, H2 } from '../Atoms';
import { useMenuItem } from '../Header/MenuContext';
import { FilePicker } from '../Molecules/FilePicker';

export function WbImportAttachmentsView(): JSX.Element {
  useMenuItem('workBench');
  const [file] = React.useState<File | undefined>();

  return (
    <Container.Full>
      <H2>{commonText.multipleFilePickerMessage()}</H2>
      <div className="w-96">
        <FilePicker
          acceptedFormats={undefined}
          containerClassName="min-w-fit"
          showFileNames={false}
          onFilesSelected={handleFilesSelected}
        />
      </div>
      {typeof file === 'object' && <FilePicked file={file} />}
    </Container.Full>
  );
}

const handleFilesSelected = (files: FileList): void => {
  console.log(files);
};