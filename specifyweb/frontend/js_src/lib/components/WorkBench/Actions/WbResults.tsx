import React from 'react';

import { Button } from '../../Atoms/Button';
import { wbText } from '../../../localization/workbench';
import { commonText } from '../../../localization/common';

export function WbResults({
  hasUnSavedChanges,
  onToggleResults: handleToggleResults,
}: {
  readonly hasUnSavedChanges: boolean;
  readonly onToggleResults: () => void;
}): JSX.Element {
  return (
    <>
      <Button.Small
        aria-haspopup="tree"
        className="wb-show-upload-view"
        disabled={hasUnSavedChanges}
        title={hasUnSavedChanges ? wbText.wbUploadedUnavailable() : ''}
        onClick={handleToggleResults}
      >
        {commonText.results()}
      </Button.Small>
    </>
  );
}
