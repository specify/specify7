import React from 'react';
import { useId } from '../../hooks/useId';
import { useNavigate } from 'react-router-dom';
import { Dialog } from '../Molecules/Dialog';
import { Button } from '../Atoms/Button';
import { fetchAttachmentResourceId } from './fetchAttachmentResource';
import { raise } from '../Errors/Crash';
import { ajax } from '../../utils/ajax';
import { AttachmentDataSetResource } from './types';
import { Http } from '../../utils/ajax/definitions';
import { commonText } from '../../localization/common';
import { dialogIcons, icons } from '../Atoms/Icons';
import { attachmentsText } from '../../localization/attachments';
import { Submit } from '../Atoms/Submit';
import { wbText } from '../../localization/workbench';
import { Form, Input, Label } from '../Atoms/Form';
import { statsText } from '../../localization/stats';

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
            onClick={() => {
              fetchAttachmentResourceId.then(async (resourceId) => {
                if (resourceId === undefined)
                  raise(
                    new Error('Trying to delete from non existent app resource')
                  );
                else
                  return ajax<AttachmentDataSetResource<true>>(
                    `/attachment_gw/dataset/${resourceId}/${datasetId}/`,
                    {
                      headers: { Accept: undefined },
                      method: 'DELETE',
                    },
                    { expectedResponseCodes: [Http.NO_CONTENT] }
                  ).then(() => navigate('/specify/'));
              });
            }}
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
          <Submit.Blue form={id('form')}>{commonText.save()}</Submit.Blue>
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
