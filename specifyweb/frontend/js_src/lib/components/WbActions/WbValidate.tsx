import React from 'react';

import type { WbStatus } from '../WorkBench/WbView';
import { WbValidationReact } from '../WorkBench/WbValidation';
import { Button } from '../Atoms/Button';
import { commonText } from '../../localization/common';
import { wbText } from '../../localization/workbench';

export function WbValidate({
  canLiveValidate,
  hasUnsavedChanges,
  startUpload,
  validation,
}: {
  readonly canLiveValidate: boolean;
  readonly hasUnsavedChanges: boolean;
  readonly startUpload: (mode: WbStatus) => void;
  readonly validation: WbValidationReact;
}): JSX.Element {
  const handleValidate = () => startUpload('validate');
  const handleToggleDataCheck = () => validation.toggleDataCheck();

  return (
    <>
      <Button.Small
        className={`${canLiveValidate ? '' : 'hidden'}`}
        onClick={handleToggleDataCheck}
        aria-pressed={validation.validationMode === 'live'}
      >
        {validation.validationMode === 'live'
          ? validation.liveValidationStack.length > 0
            ? commonText.countLine({
                resource: wbText.dataCheckOn(),
                count: validation.liveValidationStack.length,
              })
            : wbText.dataCheckOn()
          : wbText.dataCheck()}
      </Button.Small>
      <Button.Small
        aria-haspopup="dialog"
        className="wb-validate"
        onClick={handleValidate}
        disabled={hasUnsavedChanges}
        title={hasUnsavedChanges ? wbText.unavailableWhileEditing() : ''}
      >
        {wbText.validate()}
      </Button.Small>
    </>
  );
}
