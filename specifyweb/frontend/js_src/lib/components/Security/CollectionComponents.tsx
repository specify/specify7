import React from 'react';
import { useNavigate } from 'react-router-dom';

import { useBooleanState } from '../../hooks/useBooleanState';
import { useErrorContext } from '../../hooks/useErrorContext';
import { commonText } from '../../localization/common';
import { userText } from '../../localization/user';
import type { GetOrSet, IR } from '../../utils/types';
import { localized } from '../../utils/types';
import { sortFunction } from '../../utils/utils';
import { Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { DataEntry } from '../Atoms/DataEntry';
import { Link } from '../Atoms/Link';
import { LoadingContext } from '../Core/Contexts';
import type { SerializedResource } from '../DataModel/helperTypes';
import { deserializeResource } from '../DataModel/serializers';
import { tables } from '../DataModel/tables';
import type { Collection } from '../DataModel/types';
import { ResourceView } from '../Forms/ResourceView';
import { userInformation } from '../InitialContext/userInformation';
import { hasPermission } from '../Permissions/helpers';
import { formatUrl } from '../Router/queryString';
import { updateCollectionRole } from './CollectionRole';
import { createCollectionRole } from './CreateRole';
import { ImportExport } from './ImportExport';
import type { Role } from './Role';

/**
 * Display a button to open current user
 *
 * @remarks
 * Used when the user doesn't have read permission to SpecifyUser table
 */
export function CurrentUserLink({
  collectionId,
}: {
  readonly collectionId: number;
}): JSX.Element {
  const navigate = useNavigate();
  return (
    <Link.Default
      href={`/specify/security/user/${userInformation.id}/`}
      onClick={(event): void => {
        event.preventDefault();
        navigate(
          formatUrl(`/specify/security/user/${userInformation.id}/`, {
            collection: collectionId,
          })
        );
      }}
    >
      {userInformation.name}
    </Link.Default>
  );
}

export function CreateCollectionRoleButton({
  isDisabled,
  collectionId,
}: {
  readonly isDisabled: boolean;
  readonly collectionId: number;
}): JSX.Element {
  return isDisabled ? (
    <Button.Success onClick={undefined}>{userText.addRole()}</Button.Success>
  ) : (
    <Link.Success
      href={`/specify/security/collection/${collectionId}/role/create/`}
    >
      {userText.addRole()}
    </Link.Success>
  );
}

export function ViewCollectionButton({
  collection,
}: {
  readonly collection: SerializedResource<Collection>;
}): JSX.Element {
  const [isOpen, handleOpen, handleClose] = useBooleanState();
  const resource = React.useMemo(
    () => deserializeResource(collection),
    [collection]
  );
  return (
    <>
      <DataEntry.Edit onClick={handleOpen} />
      {isOpen && (
        <ResourceView
          dialog="modal"
          isDependent={false}
          isSubForm={false}
          resource={resource}
          onAdd={undefined}
          onClose={handleClose}
          onDeleted={undefined}
          onSaved={undefined}
        />
      )}
    </>
  );
}

export function CollectionRoles({
  getSetRoles,
  collection,
  children,
}: {
  readonly getSetRoles: GetOrSet<IR<Role> | undefined>;
  readonly collection: SerializedResource<Collection>;
  readonly children: React.ReactNode;
}): JSX.Element {
  const [roles, setRoles] = getSetRoles;

  useErrorContext('roles', roles);
  const loading = React.useContext(LoadingContext);

  return (
    <section className="flex flex-col gap-1">
      <h4 className="text-xl">
        {userText.collectionUserRoles({
          collectionTable: tables.Collection.label,
        })}
      </h4>
      {typeof roles === 'object' ? (
        <Ul>
          {Object.values(roles)
            .sort(sortFunction(({ name }) => name))
            .map((role) => (
              <li key={role.id}>
                <Link.Default
                  href={`/specify/security/collection/${collection.id}/role/${role.id}/`}
                >
                  {role.name}
                </Link.Default>
              </li>
            ))}
        </Ul>
      ) : (
        commonText.loading()
      )}
      <div className="flex gap-2">
        {hasPermission('/permissions/roles', 'create', collection.id) ||
        (hasPermission(
          '/permissions/roles',
          'copy_from_library',
          collection.id
        ) &&
          hasPermission('/permissions/library/roles', 'read')) ? (
          <CreateCollectionRoleButton
            collectionId={collection.id}
            isDisabled={
              roles === undefined ||
              !hasPermission('/permissions/user/roles', 'read', collection.id)
            }
          />
        ) : undefined}
        {children}
        <ImportExport
          baseName={localized(collection.collectionName ?? '')}
          collectionId={collection.id}
          permissionName="/permissions/roles"
          roles={roles}
          onCreateRole={(role): void =>
            loading(createCollectionRole(setRoles, collection.id, role))
          }
          onUpdateRole={(role): void =>
            loading(updateCollectionRole(getSetRoles, role))
          }
        />
      </div>
    </section>
  );
}
