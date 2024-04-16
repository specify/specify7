import React from 'react';

import type { WbStatus } from '../WorkBench/WbView';
import { useBooleanState } from '../../hooks/useBooleanState';
import { Button } from '../Atoms/Button';
import { wbText } from '../../localization/workbench';
import { RollbackConfirmation } from '../WorkBench/Components';

export function WbRollback({
  datasetId,
  triggerStatusComponent,
}: {
  readonly datasetId: number;
  readonly triggerStatusComponent: (mode: WbStatus) => void;
}): JSX.Element {
  const [rollback, handleOpen, handleClose] = useBooleanState();

  const handleRollback = () => triggerStatusComponent('unupload');

  return (
    <>
      <Button.Small
        aria-haspopup="dialog"
        aria-pressed={rollback}
        onClick={handleOpen}
      >
        {wbText.rollback()}
      </Button.Small>
      {rollback ? (
        <RollbackConfirmation
          datasetId={datasetId}
          onClose={handleClose}
          onRollback={handleRollback}
        />
      ) : undefined}
    </>
  );
}
