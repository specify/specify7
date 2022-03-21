import React from 'react';
import type { State } from 'typesafe-reducer';

import { ajax, ping } from '../../ajax';
import { fetchCollection } from '../../collection';
import type { Collection, Institution, SpecifyUser } from '../../datamodel';
import type { SerializedResource } from '../../datamodelutils';
import type { SpecifyResource } from '../../legacytypes';
import adminText from '../../localization/admin';
import commonText from '../../localization/common';
import { router } from '../../router';
import { schema } from '../../schema';
import { setCurrentView } from '../../specifyapp';
import type { IR, RA } from '../../types';
import { userInformation } from '../../userinfo';
import { f, omit, sortFunction } from '../../wbplanviewhelper';
import {
  Button,
  className,
  Container,
  Form,
  H2,
  H3,
  Input,
  Label,
  Select,
  Submit,
  Ul,
} from '../basic';
import { useAsyncState, useTitle, useUnloadProtect } from '../hooks';
import { icons } from '../icons';
import type { UserTool } from '../main';
import createBackboneView from '../reactbackboneextend';
import { removeItem } from '../wbplanviewstate';
import { crash } from '../errorboundary';
import { LoadingContext } from '../contexts';

function InstitutionView({
  institution,
}: {
  readonly institution: SpecifyResource<Institution>;
}): JSX.Element {
  return (
    <>
      <H3>{institution.get('name')}</H3>
      <div className="flex flex-col gap-2">
        <h4>{adminText('admins')}</h4>
        <div>
          <Button.Green>{commonText('add')}</Button.Green>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <h4>{adminText('userRoleLibrary')}</h4>
        <div>
          <Button.Green>{commonText('add')}</Button.Green>
        </div>
      </div>
    </>
  );
}

type Policy = {
  readonly resource: string;
  readonly action: string;
};

type Role = {
  readonly id: number;
  readonly name: string;
  readonly policies: RA<Policy>;
};

function UserView({
  user,
  initialCollection,
  collections,
  onOpenRole: handleOpenRole,
  onClose: handleClose,
}: {
  readonly user: SerializedResource<SpecifyUser>;
  readonly initialCollection: number;
  readonly collections: IR<SpecifyResource<Collection>>;
  readonly onOpenRole: (collectionId: number, roleId: number) => void;
  readonly onClose: () => void;
}): JSX.Element {
  const [collectionRoles] = useAsyncState(
    React.useCallback(
      async () =>
        Promise.all(
          Object.values(collections).map(async (collection) =>
            fetchRoles(collection.id, undefined).then(
              (roles) => [collection.id, roles] as const
            )
          )
        ).then((entries) => Object.fromEntries(entries)),
      [collections]
    ),
    false
  );
  const initialUserRoles = React.useRef<IR<RA<number>>>({});
  const [userRoles, setUserRoles] = useAsyncState<IR<RA<number>>>(
    React.useCallback(
      async () =>
        Promise.all(
          Object.values(collections).map(async (collection) =>
            fetchRoles(collection.id, user.id).then(
              (roles) =>
                [
                  collection.id,
                  roles.map((role) => role.id).sort(sortFunction(f.id)),
                ] as const
            )
          )
        )
          .then((entries) => Object.fromEntries(entries))
          .then((userRoles) => {
            initialUserRoles.current = userRoles;
            return userRoles;
          }),
      [user.id, collections]
    ),
    false
  );
  const changesMade =
    typeof userRoles === 'object' &&
    Object.entries(userRoles).some(
      ([collectionId, roles]) =>
        JSON.stringify(roles) !==
        JSON.stringify(initialUserRoles.current[collectionId])
    );
  const setUnloadProtect = useUnloadProtect(
    changesMade,
    commonText('leavePageDialogMessage')
  );
  const [collection, setCollection] = React.useState(initialCollection);
  const loading = React.useContext(LoadingContext);
  return (
    <Form
      onSubmit={(): void =>
        typeof userRoles === 'object'
          ? loading(
              Promise.all(
                Object.entries(userRoles)
                  .filter(
                    ([collectionId, roles]) =>
                      JSON.stringify(roles) !==
                      JSON.stringify(initialUserRoles.current[collectionId])
                  )
                  .map(async ([collectionId, roles]) =>
                    ping(
                      `/permissions/user_roles/${collectionId}/${user.id}/`,
                      {
                        method: 'POST',
                        body: roles.map((id) => ({ id })),
                      }
                    )
                  )
              ).then(handleClose)
            )
          : undefined
      }
    >
      <H3>{user.name}</H3>
      <Label.Generic>
        {commonText('collection')}
        <Select
          value={collection}
          onValueChange={(value): void => setCollection(Number.parseInt(value))}
        >
          {Object.values(collections).map((collection) => (
            <option key={collection.id} value={collection.id}>
              {collection.get('collectionName')}
            </option>
          ))}
        </Select>
      </Label.Generic>
      <fieldset className="flex gap-2">
        <legend>{adminText('userRoles')}</legend>
        <Ul>
          {typeof collectionRoles === 'object' && typeof userRoles === 'object'
            ? collectionRoles[collection].map((role) => (
                <li key={role.id}>
                  <Label.ForCheckbox>
                    <Input.Checkbox
                      checked={userRoles[collection].includes(role.id)}
                      onValueChange={(isChecked): void =>
                        setUserRoles({
                          ...userRoles,
                          [collection]: Array.from(
                            isChecked
                              ? removeItem(
                                  userRoles[collection],
                                  userRoles[collection].indexOf(role.id)
                                )
                              : [...userRoles[collection], role.id]
                          ).sort(sortFunction(f.id)),
                        })
                      }
                    />
                    {role.name}
                  </Label.ForCheckbox>
                  <Button.Blue
                    title={commonText('edit')}
                    aria-label={commonText('edit')}
                    // TODO: trigger unload protect
                    onClick={(): void => handleOpenRole(collection, role.id)}
                  >
                    {icons.pencil}
                  </Button.Blue>
                </li>
              ))
            : commonText('loading')}
        </Ul>
      </fieldset>
      <span className="flex-1 -mt-2" />
      <div className="flex gap-2">
        {changesMade ? (
          <Button.Red
            // TODO: improve unload protect workflow
            onClick={(): void => setUnloadProtect(false, handleClose)}
          >
            {commonText('cancel')}
          </Button.Red>
        ) : (
          <Button.Blue onClick={handleClose}>{commonText('close')}</Button.Blue>
        )}
        <Submit.Green disabled={!changesMade}>
          {commonText('save')}
        </Submit.Green>
      </div>
    </Form>
  );
}

function RoleView({
  role: initialRole,
  collection,
  userRoles,
  onClose: handleClose,
  onOpenUser: handleOpenUser,
}: {
  readonly role: Role;
  readonly collection: SpecifyResource<Collection>;
  readonly userRoles: UserRoles | undefined;
  readonly onClose: () => void;
  readonly onOpenUser: (user: SerializedResource<SpecifyUser>) => void;
}): JSX.Element {
  const [role, setRole] = React.useState(initialRole);
  const changesMade = JSON.stringify(initialRole) !== JSON.stringify(role);
  const setUnloadProtect = useUnloadProtect(
    changesMade,
    commonText('leavePageDialogMessage')
  );
  const loading = React.useContext(LoadingContext);
  return (
    <Form
      onSubmit={(): void =>
        loading(
          ping(`/permissions/role/${role.id}`, {
            method: 'POST',
            body: role,
          }).then(handleClose)
        )
      }
    >
      <H3>{role.name}</H3>
      <Button.LikeLink onClick={handleClose}>
        {/* FIXME: add a back arrow here */}
        {collection.get('collectionName')}
      </Button.LikeLink>
      <Label.Generic>
        {commonText('name')}
        <Input.Text
          value={role.name}
          onValueChange={(name): void =>
            setRole({ name, ...omit(role, ['name']) })
          }
          required
          maxLength={1024}
        />
      </Label.Generic>
      <fieldset className="flex gap-2">
        <legend>{adminText('users')}</legend>
        {typeof userRoles === 'object' ? (
          <ul>
            {Object.values(userRoles)
              .filter(({ roles }) => roles.some(({ id }) => id === role.id))
              .map(({ user }) => (
                <li key={user.id}>
                  <Button.LikeLink
                    // TODO: trigger unload protect
                    onClick={(): void => handleOpenUser(user)}
                  >
                    {user.name}
                  </Button.LikeLink>
                </li>
              ))}
          </ul>
        ) : (
          commonText('loading')
        )}
      </fieldset>
      <span className="flex-1 -mt-2" />
      <div className="flex gap-2">
        <Button.Red
          onClick={(): void =>
            void ping(`/permissions/role/${role.id}`, {
              method: 'DELETE',
            })
              .then(handleClose)
              .catch(crash)
          }
        >
          {commonText('remove')}
        </Button.Red>
        {changesMade ? (
          <Button.Red
            // TODO: improve unload protect workflow
            onClick={(): void => setUnloadProtect(false, handleClose)}
          >
            {commonText('cancel')}
          </Button.Red>
        ) : (
          <Button.Blue onClick={handleClose}>{commonText('close')}</Button.Blue>
        )}
        <Submit.Green disabled={!changesMade}>
          {commonText('save')}
        </Submit.Green>
      </div>
    </Form>
  );
}

type UserRoles = IR<{
  readonly user: SerializedResource<SpecifyUser>;
  roles: RA<Role>;
}>;

const fetchRoles = async (
  collectionId: number,
  userId: number | undefined
): Promise<RA<Role>> =>
  ajax<RA<Role>>(
    typeof userId === 'undefined'
      ? `/permissions/roles/${collectionId}/`
      : `/permissions/user_roles/${collectionId}/${userId}/`,
    {
      headers: { Accept: 'application/json' },
    }
  ).then(({ data }) => data);

const index = <T extends { readonly id: number }>(data: RA<T>): IR<T> =>
  Object.fromEntries(data.map((item) => [item.id, item]));

function CollectionView({
  collection,
  initialRole,
  onOpenUser: handleOpenUser,
}: {
  readonly collection: SpecifyResource<Collection>;
  readonly initialRole: number | undefined;
  readonly onOpenUser: (user: SerializedResource<SpecifyUser>) => void;
}): JSX.Element {
  const [roles] = useAsyncState<IR<Role>>(
    React.useCallback(
      async () => fetchRoles(collection.id, undefined).then(index),
      [collection.id]
    ),
    false
  );
  const [userRoles] = useAsyncState<UserRoles>(
    React.useCallback(
      async () =>
        fetchCollection('SpecifyUser', { limit: 0 }).then(async ({ records }) =>
          Promise.all(
            records.map(async (user) =>
              fetchRoles(collection.id, user.id).then(
                (roles) => [user.id, { user, roles }] as const
              )
            )
          ).then((entries) => Object.fromEntries(entries))
        ),
      [collection.id]
    ),
    false
  );
  const [state, setState] = React.useState<
    State<'MainState'> | State<'RoleState', { readonly roleId: number }>
  >(
    typeof initialRole === 'number'
      ? {
          type: 'RoleState',
          roleId: initialRole,
        }
      : { type: 'MainState' }
  );
  return (
    <>
      {state.type === 'MainState' && (
        <>
          <H3>{collection.get('collectionName')}</H3>
          <div className="flex flex-col gap-2">
            <h4>{adminText('admins')}</h4>
            <div>
              <Button.Green>{commonText('add')}</Button.Green>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <h4>{adminText('userRoles')}</h4>
            {typeof roles === 'object' ? (
              <ul>
                {Object.values(roles).map((role) => (
                  <li key={role.id}>
                    <Button.LikeLink
                      onClick={(): void =>
                        setState({
                          type: 'RoleState',
                          roleId: role.id,
                        })
                      }
                    >
                      {role.name}
                    </Button.LikeLink>
                  </li>
                ))}
              </ul>
            ) : (
              commonText('loading')
            )}
            <div>
              <Button.Green>{commonText('add')}</Button.Green>
            </div>
          </div>
        </>
      )}
      {state.type === 'RoleState' && typeof roles === 'object' ? (
        <RoleView
          role={roles[state.roleId]}
          collection={collection}
          onClose={(): void =>
            setState({
              type: 'MainState',
            })
          }
          userRoles={userRoles}
          onOpenUser={handleOpenUser}
        />
      ) : undefined}
    </>
  );
}

function SecurityPanel(): JSX.Element | null {
  useTitle(adminText('securityPanel'));

  const [data] = useAsyncState(
    React.useCallback(async () => {
      const institutionCollection =
        new schema.models.Institution.LazyCollection();
      const collectionsCollection =
        new schema.models.Collection.LazyCollection();
      return f.all({
        institution: institutionCollection
          .fetchPromise({ limit: 1 })
          .then(({ models }) => models[0]),
        collections: collectionsCollection
          .fetchPromise({ limit: 0 })
          .then(({ models }) =>
            Object.fromEntries(
              models.map((collection) => [collection.id, collection])
            )
          ),
      });
    }, []),
    true
  );

  const [state, setState] = React.useState<
    | State<'MainState'>
    | State<'InstitutionState'>
    | State<
        'CollectionState',
        {
          readonly collectionId: number;
          readonly initialRole: number | undefined;
        }
      >
    | State<
        'UserState',
        {
          readonly initialCollection: number;
          readonly user: SerializedResource<SpecifyUser>;
        }
      >
  >({ type: 'MainState' });

  // TODO: write a routing library that would make navigation easier
  return typeof data === 'object' ? (
    <Container.Full>
      <H2 className="text-2xl">{adminText('securityPanel')}</H2>
      <div className="flex flex-1 gap-4">
        <aside className={className.containerBase}>
          <section>
            <H3>{adminText('institution')}</H3>
            {/* FIXME: aria-pressed styles for LikeLink improve */}
            <Button.LikeLink
              aria-pressed={state.type === 'InstitutionState'}
              onClick={(): void =>
                setState({
                  type: 'InstitutionState',
                })
              }
            >
              {data.institution.get('name')}
            </Button.LikeLink>
          </section>
          <section>
            <H3>{adminText('collections')}</H3>
            <ul>
              {Object.values(data.collections).map((collection) => (
                <li key={collection.cid}>
                  <Button.LikeLink
                    aria-pressed={
                      state.type === 'CollectionState' &&
                      state.collectionId === collection.id
                    }
                    onClick={(): void =>
                      setState({
                        type: 'CollectionState',
                        collectionId: collection.id,
                        initialRole: undefined,
                      })
                    }
                  >
                    {collection.get('collectionName')}
                  </Button.LikeLink>
                </li>
              ))}
            </ul>
          </section>
        </aside>
        <Container.Base className="flex-1">
          {state.type === 'InstitutionState' && (
            <InstitutionView institution={data.institution} />
          )}
          {state.type === 'CollectionState' && (
            <CollectionView
              collection={data.collections[state.collectionId]}
              initialRole={state.initialRole}
              onOpenUser={(user): void =>
                setState({
                  type: 'UserState',
                  user,
                  initialCollection: state.collectionId,
                })
              }
            />
          )}
          {state.type === 'UserState' && (
            <UserView
              user={state.user}
              collections={data.collections}
              initialCollection={state.initialCollection}
              onClose={(): void => setState({ type: 'MainState' })}
              onOpenRole={(collectionId, roleId): void =>
                setState({
                  type: 'CollectionState',
                  collectionId,
                  initialRole: roleId,
                })
              }
            />
          )}
        </Container.Base>
      </div>
    </Container.Full>
  ) : null;
}

const View = createBackboneView(SecurityPanel);

export const userTool: UserTool = {
  task: 'security',
  title: adminText('securityPanel'),
  enabled: () => userInformation.isadmin,
  isOverlay: true,
  view: '/specify/security/',
};

export default function Routes(): void {
  router.route('security/', 'security', () => setCurrentView(new View()));
}
