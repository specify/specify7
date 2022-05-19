/**
 * Set user's access to collections in Specify 6
 * This does not affect Specify 7
 */

import React from 'react';

import { ajax, ping } from '../ajax';
import { fetchCollection } from '../collection';
import type { SpecifyUser } from '../datamodel';
import { toggleItem } from '../helpers';
import type { SpecifyResource } from '../legacytypes';
import { adminText } from '../localization/admin';
import { commonText } from '../localization/common';
import { hasPermission } from '../permissions';
import type { RA } from '../types';
import { Button, Form, Input, Label, Submit } from './basic';
import { LoadingContext } from './contexts';
import { useAsyncState, useBooleanState, useId } from './hooks';
import { Dialog } from './modaldialog';

// FIXME: SecurityUser chagne collection not loading preview and policies
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
      header={adminText('userCollectionsPluginDialogTitle')}
      onClose={handleClose}
      buttons={
        <>
          <Button.DialogClose>{commonText('close')}</Button.DialogClose>
          {hasPermission('/admin/user/sp6/collection_access', 'update') && (
            <Submit.Blue form={id('form')}>{commonText('save')}</Submit.Blue>
          )}
        </>
      }
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
          <Label.ForCheckbox key={collection.id}>
            <Input.Checkbox
              checked={selected.includes(collection.id)}
              onChange={(): void =>
                setSelected(toggleItem(selected, collection.id))
              }
              isReadOnly={
                !hasPermission('/admin/user/sp6/collection_access', 'update')
              }
            />
            {collection.collectionName}
          </Label.ForCheckbox>
        ))}
      </Form>
    </Dialog>
  ) : null;
}

export function UserCollectionsPlugin({
  user,
}: {
  readonly user: SpecifyResource<SpecifyUser>;
}): JSX.Element {
  const [isOpen, handleOpen, handleClose] = useBooleanState();
  return (
    <>
      <Button.Small
        onClick={handleOpen}
        className="w-fit"
        disabled={
          // Admin users have access to all collections
          typeof user === 'undefined' || user.get('isAdmin') || user.isNew()
        }
        title={
          user.get('isAdmin')
            ? adminText('notAvailableOnAdmins')
            : typeof user === 'undefined'
            ? commonText('loading')
            : user.isNew()
            ? adminText('saveUserFirst')
            : undefined
        }
      >
        {adminText('setCollections')}
      </Button.Small>
      {isOpen && <UserCollectionsUi userId={user.id} onClose={handleClose} />}
    </>
  );
}
