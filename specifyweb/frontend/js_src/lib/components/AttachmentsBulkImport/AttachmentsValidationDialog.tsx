import { RA } from '../../utils/types';
import { CanValidate, PartialUploadableFileSpec } from './types';
import React from 'react';
import { validateAttachmentFiles } from './utils';
import { Dialog } from '../Molecules/Dialog';
import { Button } from '../Atoms/Button';
import { commonText } from '../../localization/common';
import { wbText } from '../../localization/workbench';

export function AttachmentsValidationDialog({
  onValidated: handleValidated,
  dataSet,
}: {
  readonly onValidated: (
    validatedFiles: RA<PartialUploadableFileSpec> | undefined
  ) => void;
  readonly dataSet: CanValidate;
}): JSX.Element {
  React.useEffect(() => {
    let destructorCalled = false;
    validateAttachmentFiles(dataSet.uploadableFiles, dataSet.uploadSpec).then(
      (postValidation) => {
        if (destructorCalled) handleValidated(undefined);
        handleValidated(postValidation);
      }
    );
    return () => {
      destructorCalled = true;
    };
  }, [handleValidated, dataSet]);
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
