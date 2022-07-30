import React from 'react';

import { adminText } from '../localization/admin';
import type { GetOrSet } from '../types';
import { AppResourcesAside } from './appresourcesaside';
import type { AppResources } from './appresourceshooks';
import { useAppResources } from './appresourceshooks';
import { Container, H2 } from './basic';
import { ProtectedTable, ProtectedTool } from './permissiondenied';
import { SafeOutlet } from './routerutils';

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
  return typeof getSetResources[1] === 'object' ? (
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
      <H2 className="text-2xl">{adminText('resources')}</H2>
      <div className="flex h-0 flex-1 gap-4">
        <AppResourcesAside isReadOnly={false} resources={resources} />
        <SafeOutlet<AppResourcesOutlet>
          getSet={getSet as GetOrSet<AppResources>}
        />
      </div>
    </Container.FullGray>
  );
}
