import React from 'react';

import { commonText } from '../../localization/common';
import { wbText } from '../../localization/workbench';
import type { RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { loadingBar } from '../Molecules';
import { Dialog } from '../Molecules/Dialog';
import type { AttachmentUploadSpec } from './Import';
import type { PartialUploadableFileSpec } from './types';
import { validateAttachmentFiles } from './utils';

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
      <div className="flex flex-col">
        <div>{wbText.validating()}</div>
        {loadingBar}
      </div>
    </Dialog>
  );
}
