import { AttachmentWorkStateProps } from './types';
import { Dialog } from '../Molecules/Dialog';
import { Button } from '../Atoms/Button';
import { wbText } from '../../localization/workbench';
import { attachmentsText } from '../../localization/attachments';
import { Progress } from '../Atoms';
import { commonText } from '../../localization/common';
import { formatTime } from '../../utils/utils';
import React from 'react';

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
      {attachmentsText.onFile({
        onFile: workProgress.uploaded,
        total: workProgress.total,
      })}
      <Progress max={workProgress.total} value={workProgress.uploaded} />
    </Dialog>
  ) : workProgress.type === 'stopping' ? (
    <Dialog buttons={undefined} header={wbText.aborting()} onClose={undefined}>
      {wbText.aborting()}
    </Dialog>
  ) : workProgress.type === 'stopped' ? (
    <Dialog
      buttons={<Button.DialogClose>{commonText.close()}</Button.DialogClose>}
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
