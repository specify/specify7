import React from 'react';

import { commonText } from '../../localization/common';
import { wbText } from '../../localization/workbench';
import { Button } from '../Atoms/Button';
import { userPreferences } from '../Preferences/userPreferences';
import type { WbValidation } from '../WorkBench/WbValidation';
import type { WbStatus } from '../WorkBench/WbView';

export function WbValidate({
  hasUnsavedChanges,
  startUpload,
  validation,
}: {
  readonly hasUnsavedChanges: boolean;
  readonly startUpload: (mode: WbStatus) => void;
  readonly validation: WbValidation;
}): JSX.Element {
  const [canLiveValidate] = userPreferences.use(
    'workBench',
    'general',
    'liveValidation'
  );
  const handleValidate = () => startUpload('validate');
  const handleToggleDataCheck = () => validation.toggleDataCheck();

  return (
    <>
      {canLiveValidate ? (
        <Button.Small
          aria-pressed={validation.validationMode === 'live'}
          onClick={handleToggleDataCheck}
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
      ) : undefined}
      <Button.Small
        aria-haspopup="dialog"
        disabled={hasUnsavedChanges}
        title={hasUnsavedChanges ? wbText.unavailableWhileEditing() : ''}
        onClick={handleValidate}
      >
        {wbText.validate()}
      </Button.Small>
    </>
  );
}
