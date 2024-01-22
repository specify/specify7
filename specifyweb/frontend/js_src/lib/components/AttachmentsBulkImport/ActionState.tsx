import React from 'react';

import { attachmentsText } from '../../localization/attachments';
import { commonText } from '../../localization/common';
import { wbText } from '../../localization/workbench';
import { formatTime } from '../../utils/utils';
import { Progress } from '../Atoms';
import { Button } from '../Atoms/Button';
import { formatNumber } from '../Atoms/Internationalization';
import { Dialog } from '../Molecules/Dialog';
import type { AttachmentWorkStateProps } from './types';

export function ActionState({
  workProgress,
  workRef,
  onStop: handleStop,
  onCompletedWork: handleCompletedWork,
  triggerNow,
  dialogText,
}: AttachmentWorkStateProps): JSX.Element | null {
  return workProgress.type === 'safe' ? (
    <Dialog
      buttons={
        <Button.Danger onClick={handleStop}>{wbText.stop()}</Button.Danger>
      }
      header={dialogText.onAction}
      onClose={undefined}
    >
      {commonText.colonLine({
        label: attachmentsText.onFile(),
        value: `${formatNumber(workProgress.uploaded)} / ${formatNumber(
          workProgress.total
        )}`,
      })}
      <Progress max={workProgress.total} value={workProgress.uploaded} />
    </Dialog>
  ) : workProgress.type === 'stopping' ? (
    <Dialog buttons={undefined} header={wbText.aborting()} onClose={undefined}>
      {wbText.aborting()}
    </Dialog>
  ) : workProgress.type === 'stopped' ? (
    <Dialog
      buttons={commonText.close()}
      header={dialogText.onCancelled}
      onClose={() => handleCompletedWork(workRef.current.mappedFiles)}
    >
      {dialogText.onCancelledDescription}
    </Dialog>
  ) : workProgress.type === 'interrupted' ? (
    <Dialog
      buttons={
        <>
          <Button.Danger onClick={handleStop}>{wbText.stop()}</Button.Danger>
          <Button.Fancy onClick={triggerNow}>
            {attachmentsText.tryNow()}
          </Button.Fancy>
        </>
      }
      header={attachmentsText.interrupted()}
      onClose={undefined}
    >
      {attachmentsText.interruptedTime({
        remainingTime: formatTime(workProgress.retryingIn),
      })}
    </Dialog>
  ) : null;
}
