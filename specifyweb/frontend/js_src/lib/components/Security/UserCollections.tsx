/**
 * Set user's access to collections in Specify 6
 * This does not affect Specify 7
 */

import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useBooleanState } from '../../hooks/useBooleanState';
import { useId } from '../../hooks/useId';
import { commonText } from '../../localization/common';
import { userText } from '../../localization/user';
import { ajax } from '../../utils/ajax';
import { ping } from '../../utils/ajax/ping';
import type { IR, RA } from '../../utils/types';
import { defined } from '../../utils/types';
import { replaceKey, toggleItem } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { Form, Input, Label, Select } from '../Atoms/Form';
import { Submit } from '../Atoms/Submit';
import { LoadingContext, ReadOnlyContext } from '../Core/Contexts';
import { fetchCollection } from '../DataModel/collection';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { resourceOn } from '../DataModel/resource';
import { tables } from '../DataModel/tables';
import type { Collection, SpecifyUser } from '../DataModel/types';
import { Dialog } from '../Molecules/Dialog';
import { collectionAccessResource } from '../Permissions/definitions';
import { hasPermission } from '../Permissions/helpers';
import { QueryComboBox } from '../QueryComboBox';
import type { Policy } from './Policy';
import type { UserAgents } from './UserHooks';

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
        fetchCollection('Collection', { limit: 0, domainFilter: false }).then(
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
          <Button.DialogClose>{commonText.close()}</Button.DialogClose>
          {hasPermission('/admin/user/sp6/collection_access', 'update') && (
            <Submit.Save form={id('form')}>{commonText.save()}</Submit.Save>
          )}
        </>
      }
      header={userText.configureCollectionAccess()}
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
}: {
  readonly user: SpecifyResource<SpecifyUser>;
}): JSX.Element {
  const [isOpen, handleOpen, handleClose] = useBooleanState();
  return (
    <>
      <Button.Small
        className="w-fit"
        disabled={
          // Admin users have access to all collections
          user === undefined || user.isNew()
        }
        title={
          user === undefined
            ? commonText.loading()
            : user.isNew()
              ? userText.saveUserFirst()
              : undefined
        }
        onClick={handleOpen}
      >
        {userText.setCollections()}
      </Button.Small>
      {isOpen && <UserCollectionsUi userId={user.id} onClose={handleClose} />}
    </>
  );
}

export function SetCollection({
  collectionId,
  collections,
  onChange: handleChange,
}: {
  readonly collectionId: number;
  readonly collections: RA<SerializedResource<Collection>>;
  readonly onChange: (collectionId: number) => void;
}): JSX.Element {
  return (
    <Label.Block className={className.limitedWidth}>
      <span className="text-xl">{tables.Collection.label}</span>
      <Select
        value={collectionId}
        onValueChange={(value): void => handleChange(Number.parseInt(value))}
      >
        {collections.map((collection) => (
          <option key={collection.id} value={collection.id}>
            {collection.collectionName}
          </option>
        ))}
      </Select>
    </Label.Block>
  );
}

export function CollectionAccess({
  userPolicies,
  onChange: handleChange,
  onChangedAgent: handleChangeAgent,
  collectionId,
  userAgents,
  isSuperAdmin,
}: {
  readonly userPolicies: IR<RA<Policy> | undefined> | undefined;
  readonly onChange: (
    userPolicies: IR<RA<Policy> | undefined> | undefined
  ) => void;
  readonly onChangedAgent: () => void;
  readonly collectionId: number;
  readonly userAgents: UserAgents | undefined;
  readonly isSuperAdmin: boolean;
}): JSX.Element {
  const hasCollectionAccess =
    userPolicies?.[collectionId]?.some(
      ({ resource, actions }) =>
        resource === collectionAccessResource && actions.includes('access')
    ) ?? false;
  const collectionAddress = userAgents?.find(({ collections }) =>
    collections.includes(collectionId)
  )?.address;
  const hasAgent = (collectionAddress?.get('agent')?.length ?? 0) > 0;

  React.useEffect(
    () =>
      typeof collectionAddress === 'object'
        ? resourceOn(
            collectionAddress,
            'change:agent',
            handleChangeAgent,
            false
          )
        : undefined,
    [collectionAddress, handleChangeAgent]
  );

  /**
   * If collection access was checked by default, but the user does not have
   * permission to assign an agent and no agent is assigned, uncheck
   * collection access
   */
  const canAssignAgent = hasPermission('/admin/user/agents', 'update');
  React.useEffect(
    () =>
      hasCollectionAccess && !canAssignAgent && !hasAgent
        ? handleToggle()
        : undefined,
    [canAssignAgent, hasCollectionAccess, hasAgent]
  );

  const handleToggle = (): void =>
    handleChange(
      typeof userPolicies === 'object'
        ? replaceKey(
            userPolicies,
            collectionId.toString(),
            hasCollectionAccess
              ? defined(userPolicies[collectionId]).filter(
                  ({ resource }) => resource !== collectionAccessResource
                )
              : [
                  ...defined(userPolicies[collectionId]),
                  {
                    resource: collectionAccessResource,
                    actions: ['access'],
                  },
                ]
          )
        : undefined
    );

  const isReadOnly = React.useContext(ReadOnlyContext) || !canAssignAgent;
  return (
    <div className="flex flex-col gap-4">
      {hasPermission('/permissions/policies/user', 'read', collectionId) &&
      !isSuperAdmin ? (
        <Label.Inline className={className.limitedWidth}>
          <Input.Checkbox
            checked={hasCollectionAccess}
            isReadOnly={
              !hasPermission(
                '/permissions/policies/user',
                'update',
                collectionId
              ) ||
              userPolicies === undefined ||
              (!hasCollectionAccess && !canAssignAgent && !hasAgent)
            }
            onValueChange={handleToggle}
          />
          {userText.collectionAccess()}
        </Label.Inline>
      ) : undefined}
      <Label.Block className={className.limitedWidth}>
        {tables.Agent.label}
        {typeof collectionAddress === 'object' ? (
          <ReadOnlyContext.Provider value={isReadOnly}>
            <QueryComboBox
              field={tables.Address.strictGetRelationship('agent')}
              forceCollection={collectionId}
              formType="form"
              id={undefined}
              isRequired={hasCollectionAccess || isSuperAdmin}
              resource={collectionAddress}
              typeSearch={undefined}
            />
          </ReadOnlyContext.Provider>
        ) : (
          <Input.Text disabled value={commonText.loading()} />
        )}
      </Label.Block>
    </div>
  );
}
