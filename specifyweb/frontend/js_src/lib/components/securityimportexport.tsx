import React from 'react';

import { f } from '../functools';
import {
  group,
  removeKey,
  replaceItem,
  replaceKey,
  sortFunction,
} from '../helpers';
import { adminText } from '../localization/admin';
import { commonText } from '../localization/common';
import { hasPermission } from '../permissionutils';
import type { IR, RA, RR } from '../types';
import { defined, filterArray } from '../types';
import { Button, Form, H3, Input, Label, Submit, Ul } from './basic';
import { LoadingContext } from './contexts';
import { downloadFile, FilePicker, fileToText } from './filepicker';
import { useBooleanState, useId } from './hooks';
import { Dialog } from './modaldialog';
import type { NewRole, Role } from './securityrole';

type Category = 'changed' | 'created' | 'unchanged';
const categoryLabels = {
  changed: adminText('updateExistingRoles'),
  unchanged: adminText('unchangedRoles'),
  created: adminText('createNewRoles'),
} as const;

export function SecurityImportExport({
  roles,
  baseName,
  collectionId,
  permissionName,
  isReadOnly = false,
  onUpdateRole: handleUpdateRole,
  onCreateRole: handleCreateRole,
}: {
  readonly roles: IR<Role> | undefined;
  readonly baseName: string;
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
          <Button.Blue disabled={roles === undefined} onClick={handleOpen}>
            {commonText('import')}
          </Button.Blue>
        )}
      <Button.Blue
        disabled={roles === undefined}
        onClick={(): void =>
          loading(
            downloadFile(
              `${adminText(
                'userRoles'
              )} - ${baseName} - ${new Date().toDateString()}.json`,
              JSON.stringify(Object.values(defined(roles)), null, '\t')
            )
          )
        }
      >
        {commonText('export')}
      </Button.Blue>
      {isOpen && (
        <Dialog
          buttons={
            <>
              <Button.DialogClose>{commonText('cancel')}</Button.DialogClose>
              <Submit.Green disabled={newRoles === undefined} form={id('form')}>
                {commonText('import')}
              </Submit.Green>
            </>
          }
          header={commonText('import')}
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
                    adminText('none')
                  ) : (
                    <Ul>
                      {Array.from(roles)
                        .sort(sortFunction(({ role }) => role.name))
                        .map(({ role, isChecked }, index) => (
                          <li key={index}>
                            {category === 'unchanged' ? (
                              role.name
                            ) : (
                              <Label.ForCheckbox>
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
                              </Label.ForCheckbox>
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
                onSelected={(file): void =>
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
                                  .map((newRole) =>
                                    f.var(
                                      typeof newRole.id === 'number'
                                        ? JSON.stringify(
                                            removeKey(
                                              defined(roles)[newRole.id],
                                              'id'
                                            )
                                          ) ===
                                          JSON.stringify(
                                            removeKey(newRole, 'id')
                                          )
                                          ? 'unchanged'
                                          : 'changed'
                                        : 'created',
                                      (groupName) =>
                                        (groupName === 'changed' &&
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
                                            ]
                                    )
                                  )
                              )
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
