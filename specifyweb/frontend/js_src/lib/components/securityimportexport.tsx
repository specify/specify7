import React from 'react';

import { f } from '../functools';
import { group, omit, replaceItem, replaceKey } from '../helpers';
import { adminText } from '../localization/admin';
import { commonText } from '../localization/common';
import { hasPermission } from '../permissions';
import type { IR, RA, RR } from '../types';
import { defined, filterArray } from '../types';
import { Button, Form, H3, Input, Label, Submit, Ul } from './basic';
import { LoadingContext } from './contexts';
import { downloadFile, FilePicker, fileToText } from './filepicker';
import { useBooleanState, useId } from './hooks';
import { Dialog } from './modaldialog';
import type { NewRole, Role } from './securityrole';

type Category = 'changed' | 'unchanged' | 'created';
const categoryLabels = {
  changed: adminText('updateExistingRoles'),
  unchanged: adminText('unchangedRoles'),
  created: adminText('createNewRoles'),
} as const;

export function SecurityImportExport({
  roles,
  baseName,
  onUpdateRole: handleUpdateRole,
  onCreateRole: handleCreateRole,
  permissionName,
  isReadOnly = false,
}: {
  readonly roles: IR<Role> | undefined;
  readonly baseName: string;
  readonly onUpdateRole: (role: Role) => void;
  readonly onCreateRole: (role: NewRole) => void;
  readonly permissionName: '/permissions/library/roles' | '/permissions/roles';
  readonly isReadOnly?: boolean;
}): JSX.Element {
  const [isOpen, handleOpen, handleClose] = useBooleanState();
  const loading = React.useContext(LoadingContext);
  const [newRoles, setNewRoles] = React.useState<
    | RR<
        Category,
        | RA<{
            readonly role: Role | NewRole;
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
        (hasPermission(permissionName, 'update') ||
          hasPermission(permissionName, 'create')) && (
          <Button.Blue
            disabled={typeof roles === 'undefined'}
            onClick={handleOpen}
          >
            {commonText('import')}
          </Button.Blue>
        )}
      <Button.Blue
        disabled={typeof roles === 'undefined'}
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
          header={commonText('import')}
          onClose={(): void => {
            setNewRoles(undefined);
            handleClose();
          }}
          buttons={
            <>
              <Button.DialogClose component={Button.Transparent}>
                {commonText('cancel')}
              </Button.DialogClose>
              <Submit.Green
                disabled={typeof newRoles === 'undefined'}
                form={id('form')}
              >
                {commonText('import')}
              </Submit.Green>
            </>
          }
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
                  {typeof roles === 'undefined' || roles.length === 0 ? (
                    adminText('none')
                  ) : (
                    <Ul>
                      {roles.map(({ role, isChecked }, index) => (
                        <li key={index}>
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
                                    replaceKey<Role | NewRole>(
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
                                            omit(defined(roles)[newRole.id], [
                                              'id',
                                            ])
                                          ) ===
                                          JSON.stringify(omit(newRole, ['id']))
                                          ? 'unchanged'
                                          : 'changed'
                                        : 'created',
                                      (groupName) =>
                                        (groupName === 'changed' &&
                                          !hasPermission(
                                            permissionName,
                                            'update'
                                          )) ||
                                        (groupName === 'created' &&
                                          !hasPermission(
                                            permissionName,
                                            'create'
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
