import React from 'react';

import { Button } from '../Atoms/Button';
import { Dialog } from '../Molecules/Dialog';
import { LoadingContext } from '../Core/Contexts';
import { downloadAllAttachments } from './attachments';
import { attachmentsText } from '../../localization/attachments';
import { commonText } from '../../localization/common';
import { RA } from '../../utils/types';
import { SerializedResource } from '../DataModel/helperTypes';
import { Attachment } from '../DataModel/types';

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
  const CreateRecordSetDialog = ({
    onClose,
  }: {
    readonly onClose: () => void;
  }): JSX.Element => {
    return (
      <Dialog
        buttons={<Button.DialogClose>{commonText.close()}</Button.DialogClose>}
        header={attachmentsText.downloadAll()}
        onClose={onClose}
      >
        {attachmentsText.createRecordSetToDownloadAll()}
      </Dialog>
    );
  };

  return (
    <>
      {showCreateRecordSetDialog && (
        <CreateRecordSetDialog
          onClose={(): void => {
            setShowCreateRecordSetDialog(false);
          }}
        />
      )}
      <Button.Info
        title={attachmentsText.downloadAllDescription()}
        disabled={disabled}
        onClick={(): void =>
          recordSetRequired === true && recordSetId === undefined
            ? setShowCreateRecordSetDialog(true)
            : loading(
                downloadAllAttachments(attachments, archiveName, recordSetId)
              )
        }
      >
        {attachmentsText.downloadAll()}
      </Button.Info>
    </>
  );
}
