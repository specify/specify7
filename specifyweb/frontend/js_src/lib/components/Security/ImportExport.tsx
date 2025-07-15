import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useBooleanState } from '../../hooks/useBooleanState';
import { useId } from '../../hooks/useId';
import { commonText } from '../../localization/common';
import { userText } from '../../localization/user';
import { f } from '../../utils/functools';
import type { IR, RA, RR } from '../../utils/types';
import { filterArray } from '../../utils/types';
import {
  group,
  removeKey,
  replaceItem,
  replaceKey,
  sortFunction,
} from '../../utils/utils';
import { H3, Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { Form, Input, Label } from '../Atoms/Form';
import { Submit } from '../Atoms/Submit';
import { LoadingContext } from '../Core/Contexts';
import { Dialog } from '../Molecules/Dialog';
import { downloadFile, FilePicker, fileToText } from '../Molecules/FilePicker';
import { hasPermission } from '../Permissions/helpers';
import type { NewRole, Role } from './Role';

type Category = 'changed' | 'created' | 'unchanged';
const categoryLabels = {
  changed: userText.updateExistingRoles(),
  unchanged: userText.unchangedRoles(),
  created: userText.createNewRoles(),
} as const;

// REFACTOR: reduce size of this component
export function ImportExport({
  roles,
  baseName,
  collectionId,
  permissionName,
  isReadOnly = false,
  onUpdateRole: handleUpdateRole,
  onCreateRole: handleCreateRole,
}: {
  readonly roles: IR<Role> | undefined;
  readonly baseName: LocalizedString;
  readonly collectionId: number;
  readonly permissionName: '/permissions/library/roles' | '/permissions/roles';
  readonly isReadOnly?: boolean;
  readonly onUpdateRole: (role: Role) => void;
  readonly onCreateRole: (role: NewRole) => void;
}): JSX.Element {
  const [isOpen, handleOpen, handleClose] = useBooleanState();
  const loading = React.useContext(LoadingContext);
  const [newRoles, setNewRoles] = React.useState<
    | RR<
        Category,
        | RA<{
            readonly role: NewRole | Role;
            readonly isChecked: boolean;
          }>
        | undefined
      >
    | undefined
  >(undefined);
  const id = useId('security-import-export');
  return (
    <>
      {!isReadOnly &&
        (hasPermission(permissionName, 'update', collectionId) ||
          hasPermission(permissionName, 'create', collectionId)) && (
          <Button.Info disabled={roles === undefined} onClick={handleOpen}>
            {commonText.import()}
          </Button.Info>
        )}
      <ExportButton baseName={baseName} roles={roles} />
      {isOpen && (
        <Dialog
          buttons={
            <>
              <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
              <Submit.Success
                disabled={newRoles === undefined}
                form={id('form')}
              >
                {commonText.import()}
              </Submit.Success>
            </>
          }
          header={commonText.import()}
          onClose={(): void => {
            setNewRoles(undefined);
            handleClose();
          }}
        >
          <Form
            id={id('form')}
            onSubmit={(): void =>
              typeof newRoles === 'object'
                ? loading(
                    Promise.all([
                      ...(newRoles.changed ?? [])
                        .filter(({ isChecked }) => isChecked)
                        .map(({ role }) => handleUpdateRole(role as Role)),
                      ...(newRoles.created ?? [])
                        .filter(({ isChecked }) => isChecked)
                        .map(({ role }) => handleCreateRole(role)),
                    ])
                      .then((): void => setNewRoles(undefined))
                      .then(handleClose)
                  )
                : undefined
            }
          >
            {typeof newRoles === 'object' ? (
              Object.entries(newRoles).map(([category, roles]) => (
                <section key={category}>
                  <H3>{categoryLabels[category]}</H3>
                  {roles === undefined || roles.length === 0 ? (
                    commonText.none()
                  ) : (
                    <Ul>
                      {roles.map(({ role, isChecked }, index) => (
                        <li key={index}>
                          {category === 'unchanged' ? (
                            role.name
                          ) : (
                            <Label.Inline>
                              <Input.Checkbox
                                checked={isChecked}
                                onValueChange={(): void =>
                                  setNewRoles(
                                    replaceKey(
                                      newRoles,
                                      category,
                                      replaceItem(roles, index, {
                                        role,
                                        isChecked: !isChecked,
                                      })
                                    )
                                  )
                                }
                              />
                              {role.name}
                            </Label.Inline>
                          )}
                        </li>
                      ))}
                    </Ul>
                  )}
                </section>
              ))
            ) : (
              <FilePicker
                acceptedFormats={['.json']}
                onFileSelected={(file): void =>
                  loading(
                    fileToText(file)
                      .then<RA<Role>>(f.unary(JSON.parse))
                      .then((newRoles) =>
                        setNewRoles(
                          Object.fromEntries(
                            group(
                              filterArray(
                                newRoles
                                  .map((newRole) =>
                                    replaceKey<NewRole | Role>(
                                      newRole,
                                      'id',
                                      Object.values(roles ?? {})?.find(
                                        ({ name }) => name === newRole.name
                                      )?.id ?? undefined
                                    )
                                  )
                                  .map((newRole) => {
                                    const groupName =
                                      typeof newRole.id === 'number'
                                        ? JSON.stringify(
                                            removeKey(roles![newRole.id], 'id')
                                          ) ===
                                          JSON.stringify(
                                            removeKey(newRole, 'id')
                                          )
                                          ? 'unchanged'
                                          : 'changed'
                                        : 'created';
                                    return (groupName === 'changed' &&
                                      !hasPermission(
                                        permissionName,
                                        'update',
                                        collectionId
                                      )) ||
                                      (groupName === 'created' &&
                                        !hasPermission(
                                          permissionName,
                                          'create',
                                          collectionId
                                        ))
                                      ? undefined
                                      : [
                                          groupName,
                                          {
                                            role: newRole,
                                            isChecked: true,
                                          },
                                        ];
                                  })
                              )
                            ).map(
                              ([category, roles]) =>
                                [
                                  category,
                                  Array.from(roles).sort(
                                    sortFunction(({ role }) => role.name)
                                  ),
                                ] as const
                            )
                          )
                        )
                      )
                  )
                }
              />
            )}
          </Form>
        </Dialog>
      )}
    </>
  );
}

function ExportButton({
  roles,
  baseName,
}: {
  readonly roles: IR<Role> | undefined;
  readonly baseName: LocalizedString;
}): JSX.Element {
  const loading = React.useContext(LoadingContext);
  return (
    <Button.Info
      disabled={roles === undefined}
      onClick={(): void =>
        loading(
          downloadFile(
            `${userText.userRoles()} - ${baseName} - ${new Date().toDateString()}.json`,
            JSON.stringify(Object.values(roles!), null, '\t')
          )
        )
      }
    >
      {commonText.export()}
    </Button.Info>
  );
}
