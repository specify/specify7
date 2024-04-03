import React from 'react';

import { Button } from '../../Atoms/Button';
import { wbText } from '../../../localization/workbench';
import { commonText } from '../../../localization/common';

export function WbResults({
  hasUnsavedChanges,
  onToggleResults: handleToggleResults,
}: {
  readonly hasUnsavedChanges: boolean;
  readonly onToggleResults: () => void;
}): JSX.Element {

  return (
    <>
      <Button.Small
        aria-haspopup="tree"
        disabled={hasUnsavedChanges}
        title={hasUnsavedChanges ? wbText.wbUploadedUnavailable() : ''}
        onClick={handleToggleResults}
      >
        {commonText.results()}
      </Button.Small>
    </>
  );
}
