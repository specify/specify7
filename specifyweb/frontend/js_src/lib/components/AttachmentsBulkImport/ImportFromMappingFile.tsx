import React from 'react';
import { localized, RA } from '../../utils/types';
import { CsvFilePicker } from '../Molecules/CsvFilePicker';
import { attachmentsText } from '../../localization/attachments';
import { useNavigate } from 'react-router-dom';

import { PartialUploadableFileSpec } from './types';
import { createEmptyAttachmentDataset } from './Datasets';

// TODO: Is this needed?
//const requiredHeaders = ['filename', 'identifier'];

export function ImportFromMappingFile(): JSX.Element {
  const navigate = useNavigate();
  return (
    <>
      <CsvFilePicker
        header={attachmentsText.importFromMappingFile()}
        onFileImport={({ data: rawRows, fileName }) => {
          // To support mapping file, we just create a new dataset with files. Matching behaviour
          // within dataset takes care of rest
          const attachmentRows: RA<PartialUploadableFileSpec> = rawRows.map(
            ([fileName, parsedName]) => ({
              uploadFile: {
                file: {
                  name: fileName,
                },
                parsedName,
              },
            })
          );
          createEmptyAttachmentDataset(
            localized(fileName),
            attachmentRows
          ).then(({ id }) => navigate(`/specify/attachments/import/${id}`));
        }}
      />
    </>
  );
}
