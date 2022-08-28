/**
 * Set user's access to collections in Specify 6
 * This does not affect Specify 7
 */

import React from 'react';

import { ajax } from '../../utils/ajax';
import { ping } from '../../utils/ajax/ping';
import { fetchCollection } from '../DataModel/collection';
import type { SpecifyUser } from '../DataModel/types';
import { toggleItem } from '../../utils/utils';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { adminText } from '../../localization/admin';
import { commonText } from '../../localization/common';
import { hasPermission } from '../Permissions/helpers';
import type { RA } from '../../utils/types';
import { LoadingContext } from '../Core/Contexts';
import { useAsyncState, useBooleanState, useId } from '../../hooks/hooks';
import { Dialog } from '../Molecules/Dialog';
import { Button } from '../Atoms/Button';
import { Submit } from '../Atoms/Submit';
import { Form, Input, Label } from '../Atoms/Form';

function UserCollectionsUi({
  userId,
  onClose: handleClose,
}: {
  readonly userId: number;
  readonly onClose: () => void;
}): JSX.Element | null {
  const [allCollections] = useAsyncState(
    React.useCallback(
      async () =>
        fetchCollection('Collection', { limit: 0 }).then(
          ({ records }) => records
        ),
      []
    ),
    true
  );
  const [selected, setSelected] = useAsyncState(
    React.useCallback(
      async () =>
        ajax<RA<number>>(`/context/user_collection_access_for_sp6/${userId}/`, {
          headers: { Accept: 'application/json' },
        }).then(({ data }) => data),
      [userId]
    ),
    true
  );
  const id = useId('user-collection-ui');
  const loading = React.useContext(LoadingContext);

  return Array.isArray(allCollections) && Array.isArray(selected) ? (
    <Dialog
      buttons={
        <>
          <Button.DialogClose>{commonText('close')}</Button.DialogClose>
          {hasPermission('/admin/user/sp6/collection_access', 'update') && (
            <Submit.Blue form={id('form')}>{commonText('save')}</Submit.Blue>
          )}
        </>
      }
      header={adminText('userCollectionsPluginDialogTitle')}
      onClose={handleClose}
    >
      <Form
        className="contents"
        id={id('form')}
        onSubmit={(): void =>
          loading(
            ping(`/context/user_collection_access_for_sp6/${userId}/`, {
              method: 'PUT',
              body: selected,
            }).then(handleClose)
          )
        }
      >
        {allCollections.map((collection) => (
          <Label.Inline key={collection.id}>
            <Input.Checkbox
              checked={selected.includes(collection.id)}
              isReadOnly={
                !hasPermission('/admin/user/sp6/collection_access', 'update')
              }
              onChange={(): void =>
                setSelected(toggleItem(selected, collection.id))
              }
            />
            {collection.collectionName}
          </Label.Inline>
        ))}
      </Form>
    </Dialog>
  ) : null;
}

export function UserCollections({
  user,
  isAdmin,
}: {
  readonly user: SpecifyResource<SpecifyUser>;
  readonly isAdmin: boolean;
}): JSX.Element {
  const [isOpen, handleOpen, handleClose] = useBooleanState();
  return (
    <>
      <Button.Small
        className="w-fit"
        disabled={
          // Admin users have access to all collections
          user === undefined || isAdmin || user.isNew()
        }
        title={
          isAdmin
            ? adminText('notAvailableOnAdmins')
            : user === undefined
            ? commonText('loading')
            : user.isNew()
            ? adminText('saveUserFirst')
            : undefined
        }
        onClick={handleOpen}
      >
        {adminText('setCollections')}
      </Button.Small>
      {isOpen && <UserCollectionsUi userId={user.id} onClose={handleClose} />}
    </>
  );
}
