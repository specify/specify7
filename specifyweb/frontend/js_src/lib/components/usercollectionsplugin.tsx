import React from 'react';

import { ajax, ping } from '../ajax';
import { fetchCollection } from '../collection';
import type { Collection, SpecifyUser } from '../datamodel';
import type { SpecifyResource } from '../legacytypes';
import adminText from '../localization/admin';
import commonText from '../localization/common';
import type { RA } from '../types';
import { Button, Form, Input, Label, Submit } from './basic';
import { LoadingContext } from './contexts';
import { useAsyncState, useBooleanState, useId } from './hooks';
import { Dialog, LoadingScreen } from './modaldialog';
import { toggleItem } from '../helpers';

function UserCollectionsUi({
  userId,
  selectedCollections,
  allCollections,
  onClose: handleClose,
}: {
  readonly userId: number;
  readonly selectedCollections: RA<number>;
  readonly allCollections: RA<SpecifyResource<Collection>>;
  readonly onClose: () => void;
}): JSX.Element | null {
  const [selected, setSelected] =
    React.useState<RA<number>>(selectedCollections);
  const id = useId('user-collection-ui');
  const loading = React.useContext(LoadingContext);

  return (
    <Dialog
      header={adminText('userCollectionsPluginDialogTitle')}
      onClose={handleClose}
      buttons={
        <>
          <Button.DialogClose>{commonText('close')}</Button.DialogClose>
          <Submit.Blue form={id('form')}>{commonText('close')}</Submit.Blue>
        </>
      }
    >
      <Form
        className="contents"
        id={id('form')}
        onSubmit={(): void =>
          loading(
            ping(`/context/user_collection_access/${userId}/`, {
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
            />
            {collection.get('collectionName')}
          </Label.ForCheckbox>
        ))}
      </Form>
    </Dialog>
  );
}

const fetchAllCollections = async () =>
  fetchCollection('Collection', { limit: 0 });

export function UserCollectionsPlugin({
  user,
}: {
  readonly user: SpecifyResource<SpecifyUser>;
}): JSX.Element {
  const [allCollections] = useAsyncState(fetchAllCollections, false);
  const [selectedCollections] = useAsyncState(
    React.useCallback(
      async () =>
        ajax<RA<number>>(`/context/user_collection_access/${user.id}/`, {
          headers: { Accept: 'application/json' },
        }).then(({ data }) => data),
      [user.id]
    ),
    false
  );
  const [isOpen, handleOpen, handleClose] = useBooleanState();
  return (
    <>
      <Button.Simple
        onClick={handleOpen}
        disabled={
          !user.get('isAdmin') ||
          typeof user === 'undefined' ||
          !Array.isArray(allCollections) ||
          !Array.isArray(selectedCollections) ||
          user.isNew()
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
        {adminText('collections')}
      </Button.Simple>
      {isOpen &&
      typeof user === 'object' &&
      Array.isArray(allCollections) &&
      Array.isArray(selectedCollections) ? (
        <UserCollectionsUi
          userId={user.id}
          allCollections={allCollections}
          selectedCollections={selectedCollections}
          onClose={handleClose}
        />
      ) : (
        <LoadingScreen />
      )}
    </>
  );
}
