import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
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
  isMapped,
  isResultsOpen,
}: {
  readonly hasUnsavedChanges: boolean;
  readonly startUpload: (mode: WbStatus) => void;
  readonly validation: WbValidation;
  readonly isMapped: boolean;
  readonly isResultsOpen: boolean;
}): JSX.Element {
  const [canLiveValidate] = userPreferences.use(
    'workBench',
    'general',
    'liveValidation'
  );
  const [isLiveValidateOn, _, __, toggleLiveValidate] = useBooleanState();
  const handleValidate = () => startUpload('validate');
  const handleToggleDataCheck = () => {
    validation.toggleDataCheck();
    toggleLiveValidate();
  };

  return (
    <>
      {canLiveValidate ? (
        <Button.Small
          aria-pressed={validation.validationMode === 'live'}
          onClick={handleToggleDataCheck}
          disabled={!isMapped || isResultsOpen}
          title={
            !isMapped
              ? wbText.wbValidateUnavailable()
              : isResultsOpen
              ? wbText.unavailableWhileViewingResults()
              : undefined
          }
        >
          {isLiveValidateOn && validation.validationMode === 'live'
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
        disabled={hasUnsavedChanges || !isMapped}
        title={
          hasUnsavedChanges
            ? wbText.unavailableWhileEditing()
            : !isMapped
            ? wbText.wbValidateUnavailable()
            : undefined
        }
        onClick={handleValidate}
      >
        {wbText.validate()}
      </Button.Small>
    </>
  );
}
