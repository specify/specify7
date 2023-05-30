import React from 'react';
import { useOutletContext } from 'react-router';
import { useLocation } from 'react-router-dom';
import type { LocalizedString } from 'typesafe-i18n';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useErrorContext } from '../../hooks/useErrorContext';
import { commonText } from '../../localization/common';
import { userText } from '../../localization/user';
import { ajax } from '../../utils/ajax';
import type { RA } from '../../utils/types';
import { localized } from '../../utils/types';
import { sortFunction } from '../../utils/utils';
import { Container, Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { Link } from '../Atoms/Link';
import { LoadingContext } from '../Core/Contexts';
import type { SerializedResource } from '../DataModel/helperTypes';
import { schema } from '../DataModel/schema';
import { tables } from '../DataModel/tables';
import type { Institution } from '../DataModel/types';
import { userInformation } from '../InitialContext/userInformation';
import { useTitle } from '../Molecules/AppTitle';
import { downloadFile } from '../Molecules/FilePicker';
import { RecordEdit } from '../Molecules/ResourceLink';
import { hasPermission, hasTablePermission } from '../Permissions/helpers';
import { SafeOutlet } from '../Router/RouterUtils';
import type { SecurityOutlet } from '../Toolbar/Security';
import { createLibraryRole } from './CreateLibraryRole';
import { ImportExport } from './ImportExport';
import { updateLibraryRole } from './LibraryRole';
import { policiesToTsv } from './registry';

export function SecurityInstitution(): JSX.Element | null {
  const { institution } = useOutletContext<SecurityOutlet>();
  return typeof institution === 'object' ? (
    <InstitutionView institution={institution} />
  ) : null;
}

function InstitutionView({
  institution,
}: {
  readonly institution: SerializedResource<Institution>;
}): JSX.Element {
  const outletState = useOutletContext<SecurityOutlet>();
  const {
    getSetLibraryRoles,
    getSetUsers: [users],
  } = outletState;
  const [libraryRoles, handleChangeLibraryRoles] = getSetLibraryRoles;
  useErrorContext('libraryRoles', libraryRoles);

  const admins = useAdmins();

  useTitle(localized(institution.name) ?? undefined);
  const loading = React.useContext(LoadingContext);
  const location = useLocation();
  const isOverlay = location.pathname.startsWith(
    '/specify/security/institution/role/create/'
  );
  const isRoleState =
    !isOverlay &&
    location.pathname.startsWith('/specify/security/institution/role');
  const isMainState = !isRoleState;

  return (
    <Container.Base className="flex-1">
      {isMainState || isOverlay ? (
        <>
          <div className="flex gap-2">
            <h3 className="text-2xl">
              {commonText.colonLine({
                label: tables.Institution.label,
                value: institution.name ?? '',
              })}
            </h3>
            <RecordEdit resource={institution} />
          </div>
          <div className="flex flex-1 flex-col gap-8 overflow-y-scroll">
            {hasPermission('/permissions/library/roles', 'read') && (
              <section className="flex flex-col gap-2">
                <h4 className="text-xl">{userText.userRoleLibrary()}</h4>
                {typeof libraryRoles === 'object' ? (
                  <ul>
                    {Object.values(libraryRoles)
                      .sort(sortFunction(({ name }) => name))
                      .map((role) => (
                        <li key={role.id}>
                          <Link.Default
                            href={`/specify/security/institution/role/${role.id}/`}
                          >
                            {role.name}
                          </Link.Default>
                        </li>
                      ))}
                  </ul>
                ) : (
                  commonText.loading()
                )}
                <div className="flex flex-wrap gap-2">
                  {hasPermission('/permissions/library/roles', 'create') && (
                    <Link.Success href="/specify/security/institution/role/create/">
                      {commonText.create()}
                    </Link.Success>
                  )}
                  <SafeOutlet<SecurityOutlet> {...outletState} />
                  <ImportExport
                    baseName={localized(institution.name ?? '')}
                    collectionId={schema.domainLevelIds.collection}
                    permissionName="/permissions/library/roles"
                    roles={libraryRoles}
                    onCreateRole={(role): void =>
                      loading(createLibraryRole(handleChangeLibraryRoles, role))
                    }
                    onUpdateRole={(role): void =>
                      loading(updateLibraryRole(handleChangeLibraryRoles, role))
                    }
                  />
                  {/* REFACTOR: turn this into a CLI command using commander instead */}
                  <Button.Info
                    className={
                      process.env.NODE_ENV === 'development'
                        ? undefined
                        : 'hidden'
                    }
                    onClick={(): void =>
                      loading(
                        downloadFile('Permission Policies.tsv', policiesToTsv())
                      )
                    }
                  >
                    {localized('[DEV] Download policy list')}
                  </Button.Info>
                </div>
              </section>
            )}
            <section className="flex flex-col gap-2">
              <h4 className="text-xl">
                {userText.institutionUsers({
                  institutionTable: tables.Institution.label,
                })}
              </h4>
              {typeof users === 'object' ? (
                <>
                  <Ul>
                    {Object.values(users)
                      .sort(sortFunction(({ name }) => name))
                      .map((user) => {
                        const canRead =
                          user.id === userInformation.id ||
                          hasTablePermission('SpecifyUser', 'read');
                        const children = (
                          <>
                            {`${user.name}`}
                            <span className="text-gray-500">{`${
                              admins?.admins.has(user.id) === true
                                ? ` ${userText.specifyAdmin()}`
                                : ''
                            }${
                              admins?.legacyAdmins.has(user.id) === true
                                ? ` ${userText.legacyAdmin()}`
                                : ''
                            }`}</span>
                          </>
                        );
                        return (
                          <li key={user.id}>
                            {canRead ? (
                              <Link.Default
                                href={`/specify/security/user/${user.id}/`}
                              >
                                {children}
                              </Link.Default>
                            ) : (
                              children
                            )}
                          </li>
                        );
                      })}
                  </Ul>
                  {hasTablePermission('SpecifyUser', 'create') && (
                    <div>
                      <Link.Success href="/specify/security/user/new/">
                        {commonText.create()}
                      </Link.Success>
                    </div>
                  )}
                </>
              ) : (
                commonText.loading()
              )}
              {typeof users === 'object' && admins === undefined && (
                <p>{userText.loadingAdmins()}</p>
              )}
            </section>
          </div>
        </>
      ) : (
        <SafeOutlet<SecurityOutlet> {...outletState} />
      )}
    </Container.Base>
  );
}

export function useAdmins():
  | {
      readonly admins: ReadonlySet<number>;
      readonly legacyAdmins: ReadonlySet<number>;
    }
  | undefined {
  return useAsyncState(
    React.useCallback(
      async () =>
        hasPermission('/permissions/list_admins', 'read')
          ? ajax<{
              readonly sp7_admins: RA<{
                readonly userid: number;
                readonly username: LocalizedString;
              }>;
              readonly sp6_admins: RA<{
                readonly userid: number;
                readonly username: LocalizedString;
              }>;
            }>('/permissions/list_admins/', {
              headers: { Accept: 'application/json' },
              errorMode: 'dismissible',
            }).then(({ data }) => ({
              admins: new Set(data.sp7_admins.map(({ userid }) => userid)),
              legacyAdmins: new Set(
                data.sp6_admins.map(({ userid }) => userid)
              ),
            }))
          : { admins: new Set<number>(), legacyAdmins: new Set<number>() },
      []
    ),
    false
  )[0];
}
