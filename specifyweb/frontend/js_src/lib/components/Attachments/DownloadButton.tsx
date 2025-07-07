import React from 'react';

import { attachmentsText } from '../../localization/attachments';
import { commonText } from '../../localization/common';
import { queryText } from '../../localization/query';
import type { RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { LoadingContext } from '../Core/Contexts';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { Attachment } from '../DataModel/types';
import { Dialog } from '../Molecules/Dialog';
import { downloadAllAttachments } from './attachments';

export function DownloadAllAttachmentsButton({
  attachments,
  disabled = false,
  archiveName,
  recordSetId,
  recordSetRequired,
}: {
  readonly attachments: RA<SerializedResource<Attachment>>;
  readonly disabled?: boolean;
  readonly archiveName?: string;
  readonly recordSetId?: number;
  readonly recordSetRequired?: boolean;
}): JSX.Element {
  const loading = React.useContext(LoadingContext);

  const [showCreateRecordSetDialog, setShowCreateRecordSetDialog] =
    React.useState(false);
  const createRecordSetDialog = (
    <Dialog
      buttons={<Button.DialogClose>{commonText.close()}</Button.DialogClose>}
      header={attachmentsText.downloadAll()}
      onClose={(): void => {
        setShowCreateRecordSetDialog(false);
      }}
    >
      {attachmentsText.createRecordSetToDownloadAll()}
    </Dialog>
  );

  const [showDownloadStarted, setShowDownloadStartedDialog] =
    React.useState(false);
  const downloadStartedDialog = (
    <Dialog
      buttons={commonText.close()}
      header={queryText.queryExportStarted()}
      onClose={(): void => setShowDownloadStartedDialog(false)}
    >
      {queryText.queryExportStartedDescription()}
    </Dialog>
  );

  return (
    <>
      {showDownloadStarted && downloadStartedDialog}
      {showCreateRecordSetDialog && createRecordSetDialog}
      <Button.Info
        disabled={disabled}
        title={attachmentsText.downloadAllDescription()}
        onClick={(): void =>
          recordSetRequired === true && recordSetId === undefined
            ? setShowCreateRecordSetDialog(true)
            : loading(
                downloadAllAttachments(attachments, archiveName, recordSetId).then(() => {
                  setShowDownloadStartedDialog(true);
                })
              )
        }
      >
        {attachmentsText.downloadAll()}
      </Button.Info>
    </>
  );
}
