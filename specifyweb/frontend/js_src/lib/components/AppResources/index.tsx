import React from 'react';
import { useLocation } from 'react-router-dom';

import { useCachedState } from '../../hooks/useCachedState';
import { useErrorContext } from '../../hooks/useErrorContext';
import { useId } from '../../hooks/useId';
import { useScreenSize } from '../../hooks/useScreenSize';
import { commonText } from '../../localization/common';
import { headerText } from '../../localization/header';
import { resourcesText } from '../../localization/resources';
import type { GetOrSet } from '../../utils/types';
import { Container, H2 } from '../Atoms';
import { Button } from '../Atoms/Button';
import { Input, Label } from '../Atoms/Form';
import { icons } from '../Atoms/Icons';
import { Link } from '../Atoms/Link';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
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
        <ProtectedTable action="read" tableName="Collection">
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

export function AppResourcesView({
  getSet,
}: {
  readonly getSet: GetOrSet<AppResources>;
}): JSX.Element {
  const [resources] = getSet;

  const conformations = useCachedState('appResources', 'conformation');
  const [filters] = useCachedState('appResources', 'filters');
  const [searchQuery, setSearchQuery] = React.useState('');
  const isDesktop = useScreenSize('md');
  const [isBrowserOpen, setIsBrowserOpen] = React.useState(false);
  const location = useLocation();
  // Close only after navigation commits, preserving the router's unload protection.
  React.useEffect(() => {
    setIsBrowserOpen(false);
  }, [isDesktop, location.key]);
  const [sidebarCollapsed = false, setSidebarCollapsed] = useCachedState(
    'appResources',
    'sidebarCollapsed'
  );
  const id = useId('app-resources');

  const browser = (
    <div
      className={
        isDesktop && sidebarCollapsed
          ? 'hidden'
          : `flex flex-col gap-2 p-2 ${
              isDesktop ? 'min-h-0 flex-1' : 'shrink-0'
            }`
      }
      hidden={isDesktop && sidebarCollapsed}
      id={id('sidebar')}
    >
      <Label.Block className="shrink-0 gap-1">
        <span className="text-sm text-gray-600 dark:text-neutral-400">
          {resourcesText.searchResources()}
        </span>
        <Input.Generic
          autoFocus={!isDesktop}
          type="search"
          placeholder={commonText.search()}
          value={searchQuery}
          onValueChange={setSearchQuery}
        />
      </Label.Block>
      <div className="shrink-0">
        <AppResourcesFilters initialResources={resources} />
      </div>
      <AppResourcesAside
        className={
          isDesktop ? 'flex-1 !overflow-hidden' : 'shrink-0 !overflow-visible'
        }
        conformations={conformations}
        filters={filters}
        isEmbedded
        resources={resources}
        searchQuery={searchQuery}
      />
    </div>
  );

  return (
    <Container.FullGray className="min-h-0 min-w-0 !gap-2 !p-2">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 p-px sm:h-0 sm:overflow-auto md:flex-row">
        {isDesktop ? (
          <Container.Base
            className={`min-h-0 min-w-0 shrink-0 !gap-0 !overflow-hidden !p-0 ${
              sidebarCollapsed ? 'md:w-10' : 'md:w-64 lg:w-72'
            }`}
          >
            <div
              className={`flex shrink-0 items-center gap-2 p-1 ${sidebarCollapsed ? 'md:flex-1' : 'border-b border-gray-300 dark:border-neutral-700'}`}
            >
              <H2 className={sidebarCollapsed ? 'sr-only' : 'pl-1 text-lg'}>
                {resourcesText.browseResources()}
              </H2>
              {!sidebarCollapsed && (
                <Link.Icon
                  className="[&>svg]:h-4 [&>svg]:w-4"
                  href="https://speciforum.org/t/app-resources/582"
                  icon="informationCircle"
                  rel="noopener"
                  target="_blank"
                  title={headerText.documentation()}
                />
              )}
              <Button.LikeLink
                aria-controls={id('sidebar')}
                aria-expanded={!sidebarCollapsed}
                aria-label={resourcesText.browseResources()}
                className={
                  sidebarCollapsed
                    ? 'w-full rounded p-1 md:h-full md:flex-col md:justify-start'
                    : 'ml-auto rounded p-1'
                }
                onClick={(): void => setSidebarCollapsed(!sidebarCollapsed)}
              >
                {sidebarCollapsed
                  ? icons.chevronDoubleRight
                  : icons.chevronDoubleLeft}
                <span
                  className={
                    sidebarCollapsed
                      ? 'md:[writing-mode:vertical-rl]'
                      : 'sr-only'
                  }
                >
                  {resourcesText.browseResources()}
                </span>
              </Button.LikeLink>
            </div>
            {browser}
          </Container.Base>
        ) : (
          <Button.Small
            aria-haspopup="dialog"
            className="shrink-0 self-start"
            onClick={(): void => setIsBrowserOpen(true)}
          >
            {icons.search}
            {resourcesText.browseResources()}
          </Button.Small>
        )}
        <SafeOutlet<AppResourcesOutlet>
          getSet={getSet as GetOrSet<AppResources>}
        />
      </div>
      {!isDesktop && isBrowserOpen && (
        <Dialog
          buttons={
            <Button.Small onClick={(): void => setIsBrowserOpen(false)}>
              {commonText.close()}
            </Button.Small>
          }
          className={{
            container: `${dialogClassNames.fullScreen} !p-2`,
            content: `${dialogClassNames.flexContent} min-h-0 !py-0`,
          }}
          dimensionsKey={false}
          header={resourcesText.browseResources()}
          headerButtons={
            <Link.Icon
              className="[&>svg]:h-4 [&>svg]:w-4"
              href="https://speciforum.org/t/app-resources/582"
              icon="questionCircle"
              rel="noopener"
              target="_blank"
              title={headerText.documentation()}
            />
          }
          onClose={(): void => setIsBrowserOpen(false)}
        >
          {browser}
        </Dialog>
      )}
    </Container.FullGray>
  );
}
