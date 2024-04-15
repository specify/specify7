import React from 'react';

import { Button } from '../Atoms/Button';
import { wbText } from '../../localization/workbench';
import { commonText } from '../../localization/common';

export function WbResults({
  hasUnsavedChanges,
  isResultsOpen,
  onToggleResults: handleToggleResults,
}: {
  readonly hasUnsavedChanges: boolean;
  readonly isResultsOpen: boolean;
  readonly onToggleResults: () => void;
}): JSX.Element {
  return (
    <Button.Small
      aria-haspopup="tree"
      aria-pressed={isResultsOpen}
      disabled={hasUnsavedChanges}
      title={wbText.wbUploadedUnavailable()}
      onClick={handleToggleResults}
    >
      {commonText.results()}
    </Button.Small>
  );
}
