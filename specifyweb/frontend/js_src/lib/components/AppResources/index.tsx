import React from 'react';

import { useErrorContext } from '../../hooks/useErrorContext';
import { adminText } from '../../localization/admin';
import type { GetOrSet } from '../../utils/types';
import { Container, H2 } from '../Atoms';
import { ProtectedTable, ProtectedTool } from '../Permissions/PermissionDenied';
import { SafeOutlet } from '../Router/RouterUtils';
import { AppResourcesAside } from './Aside';
import { AppResourcesFilters } from './Filters';
import type { AppResources } from './hooks';
import { useAppResources } from './hooks';

export function AppResourcesWrapper(): JSX.Element {
  return (
    <ProtectedTool action="read" tool="resources">
      <ProtectedTable action="read" tableName="Discipline">
        <ProtectedTable action="read" tableName="Discipline">
          <ProtectedTable action="read" tableName="SpecifyUser">
            <AppResourcesDataFetcher />
          </ProtectedTable>
        </ProtectedTable>
      </ProtectedTable>
    </ProtectedTool>
  );
}

function AppResourcesDataFetcher(): JSX.Element | null {
  const getSetResources = useAppResources();
  const [resources] = getSetResources;
  useErrorContext('appResourcesData', resources);

  return typeof resources === 'object' ? (
    <AppResourcesView getSet={getSetResources as GetOrSet<AppResources>} />
  ) : null;
}

export type AppResourcesOutlet = { readonly getSet: GetOrSet<AppResources> };

function AppResourcesView({
  getSet,
}: {
  readonly getSet: GetOrSet<AppResources>;
}): JSX.Element {
  const [resources] = getSet;
  return (
    <Container.FullGray>
      <div className="flex items-center gap-4">
        <H2 className="text-2xl">{adminText('resources')}</H2>
        <div className="flex flex-wrap gap-2">
          <AppResourcesFilters initialResources={resources} />
        </div>
      </div>
      <div className="flex h-0 flex-1 gap-4">
        <AppResourcesAside
          isEmbedded={false}
          isReadOnly={false}
          resources={resources}
        />
        <SafeOutlet<AppResourcesOutlet>
          getSet={getSet as GetOrSet<AppResources>}
        />
      </div>
    </Container.FullGray>
  );
}
