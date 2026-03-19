import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useBooleanState } from '../../hooks/useBooleanState';
import { useId } from '../../hooks/useId';
import { commonText } from '../../localization/common';
import { wbText } from '../../localization/workbench';
import { ajax } from '../../utils/ajax';
import { formData } from '../../utils/ajax/helpers';
import { ping } from '../../utils/ajax/ping';
import type { RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { Form, Label, Select } from '../Atoms/Form';
import { Submit } from '../Atoms/Submit';
import { LoadingContext } from '../Core/Contexts';
import { Dialog } from '../Molecules/Dialog';
import { unsafeNavigate } from '../Router/Router';
import type { Dataset } from '../WbPlanView/Wrapped';

export function WbChangeOwner({
  hasUnsavedChanges,
  dataset,
}: {
  readonly hasUnsavedChanges: boolean;
  readonly dataset: Dataset;
}): JSX.Element {
  const [showChangeOwner, openChangeOwner, closeChangeOwner] =
    useBooleanState();
  return (
    <>
      <Button.Small
        aria-haspopup="dialog"
        aria-pressed={showChangeOwner}
        disabled={hasUnsavedChanges}
        title={hasUnsavedChanges ? wbText.unavailableWhileEditing() : undefined}
        onClick={openChangeOwner}
      >
        {wbText.changeOwner()}
      </Button.Small>
      {showChangeOwner && (
        <ChangeOwner dataset={dataset} onClose={closeChangeOwner} />
      )}
    </>
  );
}

type TransferUser = {
  readonly id: number;
  readonly name: string;
};

function ChangeOwner({
  dataset,
  onClose: handleClose,
}: {
  readonly dataset: Dataset;
  readonly onClose: () => void;
}): JSX.Element | null {
  const [users] = useAsyncState<RA<TransferUser>>(
    React.useCallback(
      async () =>
        ajax<RA<TransferUser>>(`/api/workbench/transfer/${dataset.id}/`, {
          headers: { Accept: 'application/json' },
        }).then(({ data }) => data),
      [dataset.id]
    ),
    true
  );

  const id = useId('change-data-set-owner');
  const [newOwner, setNewOwner] = React.useState<number | undefined>(undefined);
  const [isChanged, setIsChanged] = React.useState(false);
  const loading = React.useContext(LoadingContext);

  return users === undefined ? null : isChanged ? (
    <Dialog
      buttons={commonText.close()}
      header={wbText.dataSetOwnerChanged()}
      onClose={(): void => unsafeNavigate('/specify/', { replace: true })}
    >
      <p>{wbText.dataSetOwnerChanged()}</p>
    </Dialog>
  ) : (
    <Dialog
      buttons={
        <>
          <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
          <Submit.Info disabled={newOwner === undefined} form={id('form')}>
            {wbText.changeOwner()}
          </Submit.Info>
        </>
      }
      header={wbText.changeDataSetOwner()}
      onClose={handleClose}
    >
      <Form
        id={id('form')}
        onSubmit={(): void =>
          loading(
            ping(`/api/workbench/transfer/${dataset.id}/`, {
              method: 'POST',
              body: formData({
                specifyuserid: newOwner!,
              }),
            }).then(() => setIsChanged(true))
          )
        }
      >
        <Label.Block>
          <p>{wbText.changeDataSetOwnerDescription()}</p>
          <Select
            size={10}
            value={newOwner}
            onChange={({ target }): void =>
              setNewOwner(Number.parseInt(target.value))
            }
          >
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </Select>
        </Label.Block>
      </Form>
    </Dialog>
  );
}
