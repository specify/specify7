import { RA } from '../../utils/types';
import { PartialUploadableFileSpec } from './types';
import React from 'react';
import { validateAttachmentFiles } from './utils';
import { Dialog } from '../Molecules/Dialog';
import { Button } from '../Atoms/Button';
import { commonText } from '../../localization/common';
import { wbText } from '../../localization/workbench';
import { AttachmentUploadSpec } from './Import';

export function AttachmentsValidationDialog({
  files,
  onValidated: handleValidated,
  uploadSpec,
}: {
  readonly onValidated: (
    validatedFiles: RA<PartialUploadableFileSpec> | undefined
  ) => void;
  readonly files: RA<PartialUploadableFileSpec>;
  readonly uploadSpec: AttachmentUploadSpec;
}): JSX.Element {
  React.useEffect(() => {
    let destructorCalled = false;
    validateAttachmentFiles(files, uploadSpec).then((postValidation) => {
      if (destructorCalled) handleValidated(undefined);
      handleValidated(postValidation);
    });
    return () => {
      destructorCalled = true;
    };
  }, [handleValidated, files, uploadSpec]);
  return (
    <Dialog
      buttons={
        <Button.Danger onClick={() => handleValidated(undefined)}>
          {commonText.cancel()}
        </Button.Danger>
      }
      header={wbText.validating()}
      onClose={undefined}
    >
      {wbText.validating()}
    </Dialog>
  );
}
