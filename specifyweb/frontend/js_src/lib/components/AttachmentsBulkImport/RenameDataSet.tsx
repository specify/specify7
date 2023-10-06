import React from 'react';
import { useNavigate } from 'react-router-dom';

import { useId } from '../../hooks/useId';
import { attachmentsText } from '../../localization/attachments';
import { commonText } from '../../localization/common';
import { statsText } from '../../localization/stats';
import { wbText } from '../../localization/workbench';
import { ajax } from '../../utils/ajax';
import { Http } from '../../utils/ajax/definitions';
import { Button } from '../Atoms/Button';
import { Form, Input, Label } from '../Atoms/Form';
import { dialogIcons, icons } from '../Atoms/Icons';
import { Submit } from '../Atoms/Submit';
import { Dialog } from '../Molecules/Dialog';
import type { SavedAttachmentDataSetResource } from './types';
import { defined } from '../../utils/types';

export function RenameAttachmentDataSetDialog({
  attachmentDataSetName,
  onRename: handleRename,
  onClose: handleClose,
  datasetId,
}: {
  readonly datasetId: number | undefined;
  readonly attachmentDataSetName: string;
  readonly onRename: (newName: string) => void;
  readonly onClose: () => void;
}): JSX.Element {
  const [pendingName, setPendingName] = React.useState(attachmentDataSetName);
  const id = useId('attachment');
  const navigate = useNavigate();
  const [triedToDelete, setTriedToDelete] = React.useState(false);
  return triedToDelete ? (
    <Dialog
      buttons={
        <>
          <Button.Danger
            onClick={async () =>
              defined(datasetId) &&
              ajax<SavedAttachmentDataSetResource>(
                `/attachment_gw/dataset/${datasetId}/`,
                {
                  headers: { Accept: undefined },
                  method: 'DELETE',
                },
                { expectedResponseCodes: [Http.NO_CONTENT] }
              ).then(() => navigate('/specify/'))
            }
          >
            {commonText.delete()}
          </Button.Danger>
          <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
        </>
      }
      header={commonText.delete()}
      icon={dialogIcons.warning}
      onClose={() => setTriedToDelete(false)}
    >
      {attachmentsText.deleteAttachmentDatasetWarning()}
    </Dialog>
  ) : (
    <Dialog
      buttons={
        <>
          {typeof datasetId === 'number' ? (
            <Button.Danger onClick={() => setTriedToDelete(true)}>
              {commonText.delete()}
            </Button.Danger>
          ) : null}
          <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
          <Submit.Orange form={id('form')}>{commonText.save()}</Submit.Orange>
        </>
      }
      header={wbText.dataSetName()}
      icon={icons.pencil}
      onClose={handleClose}
    >
      <Form
        id={id('form')}
        onSubmit={() => {
          handleRename(pendingName);
          handleClose();
        }}
      >
        <Label.Block>{statsText.name()}</Label.Block>
        <Input.Text
          required
          value={pendingName}
          onValueChange={setPendingName}
        />
      </Form>
    </Dialog>
  );
}
