import React from 'react';

import type { AppResourceFilters as AppResourceFiltersType } from './filtersHelpers';
import { buildAppResourceConformation, getAppResourceMode } from './helpers';
import type {
  SpAppResource,
  SpViewSetObj as SpViewSetObject,
} from '../DataModel/types';
import type { SerializedResource } from '../DataModel/helpers';
import { removeItem, replaceItem } from '../../utils/utils';
import { adminText } from '../../localization/admin';
import { commonText } from '../../localization/common';
import { hasToolPermission } from '../Permissions/helpers';
import type { RA } from '../../utils/types';
import { AppResourceIcon } from './EditorComponents';
import { AppResourcesFilters, useFilteredAppResources } from './Filters';
import type { AppResources, AppResourcesTree } from './hooks';
import { useAppResourceCount, useResourcesTree } from './hooks';
import { ActiveLink } from '../Molecules';
import { icons } from '../Atoms/Icons';
import { useCachedState } from '../../hooks/useCachedState';
import { useErrorContext } from '../../hooks/useErrorContext';
import { Ul } from '../Atoms';
import { className } from '../Atoms/className';
import { Button } from '../Atoms/Button';
import { Link } from '../Atoms/Link';
import {useId} from '../../hooks/useId';

export function AppResourcesAside({
  resources: initialResources,
  isReadOnly,
  initialFilters,
  onOpen: handleOpen,
}: {
  readonly resources: AppResources;
  readonly isReadOnly: boolean;
  readonly initialFilters?: AppResourceFiltersType;
  readonly onOpen?: (
    resource: SerializedResource<SpAppResource | SpViewSetObject>
  ) => void;
}): JSX.Element {
  const [conformations = [], setConformations] = useCachedState(
    'appResources',
    'conformation'
  );
  const resources = useFilteredAppResources(initialResources, initialFilters);
  const resourcesTree = useResourcesTree(resources);
  useErrorContext('appResourcesTree', resourcesTree);

  return (
    <aside className={className.containerBase}>
      <Ul className="flex flex-1 flex-col gap-1 overflow-auto" role="tree">
        {resourcesTree.map((resources) => (
          <TreeItem
            conformations={conformations}
            isReadOnly={isReadOnly}
            key={resources.key}
            resourcesTree={resources}
            onFold={setConformations}
            onOpen={handleOpen}
          />
        ))}
      </Ul>
      <div className="flex flex-wrap gap-2">
        <AppResourcesFilters initialResources={initialResources} />
        <AppResourcesExpand
          resourcesTree={resourcesTree}
          onChange={setConformations}
        />
      </div>
    </aside>
  );
}

export type AppResourcesConformation = {
  readonly key: string;
  readonly children: RA<AppResourcesConformation>;
};

function AppResourcesExpand({
  resourcesTree,
  onChange: handleChange,
}: {
  readonly resourcesTree: AppResourcesTree;
  readonly onChange: (conformation: RA<AppResourcesConformation>) => void;
}): JSX.Element {
  return (
    <>
      <Button.Blue
        onClick={(): void =>
          handleChange(buildAppResourceConformation(resourcesTree))
        }
      >
        {commonText('expandAll')}
      </Button.Blue>
      <Button.Blue onClick={(): void => handleChange([])}>
        {commonText('collapseAll')}
      </Button.Blue>
    </>
  );
}

function TreeItem({
  resourcesTree,
  conformations,
  isReadOnly,
  onFold: handleFold,
  onOpen: handleOpen,
}: {
  readonly resourcesTree: AppResourcesTree[number];
  readonly conformations: RA<AppResourcesConformation>;
  readonly isReadOnly: boolean;
  readonly onFold: (conformations: RA<AppResourcesConformation>) => void;
  readonly onOpen:
    | ((resource: SerializedResource<SpAppResource | SpViewSetObject>) => void)
    | undefined;
}): JSX.Element {
  const { label, key, subCategories } = resourcesTree;
  const conformationIndex = conformations.findIndex(
    (conformation) => conformation.key === key
  );
  const isExpanded = conformationIndex !== -1;
  const conformation = conformations[conformationIndex] ?? {
    key,
    children: [],
  };
  const id = useId('app-resources-tree');
  const count = useAppResourceCount(resourcesTree);
  return (
    <li
      aria-expanded={isExpanded}
      aria-labelledby={id('label')}
      className="flex flex-col gap-2"
      id={id('li')}
      role="treeitem"
    >
      <Button.LikeLink
        aria-controls={id('li')}
        className="font-bold"
        id={id('label')}
        onClick={(): void =>
          handleFold(
            conformationIndex === -1
              ? [...conformations, conformation]
              : removeItem(conformations, conformationIndex)
          )
        }
      >
        {label}
        <span className="text-neutral-500">{` (${count})`}</span>
      </Button.LikeLink>
      {isExpanded && (
        <>
          <TreeItemResources
            isReadOnly={isReadOnly}
            resourcesTree={resourcesTree}
            onOpen={handleOpen}
          />
          {subCategories.length > 0 && (
            <Ul
              aria-label={adminText('subCategories')}
              className="flex flex-col gap-2 pl-4"
              role="group"
            >
              {subCategories.map((resources) => (
                <TreeItem
                  conformations={conformation.children}
                  isReadOnly={isReadOnly}
                  key={resources.key}
                  resourcesTree={resources}
                  onFold={(newConformation): void =>
                    handleFold(
                      mutateConformation(conformations, key, newConformation)
                    )
                  }
                  onOpen={handleOpen}
                />
              ))}
            </Ul>
          )}
        </>
      )}
    </li>
  );
}

function TreeItemResources({
  resourcesTree,
  isReadOnly,
  onOpen: handleOpen,
}: {
  readonly resourcesTree: AppResourcesTree[number];
  readonly isReadOnly: boolean;
  readonly onOpen:
    | ((resource: SerializedResource<SpAppResource | SpViewSetObject>) => void)
    | undefined;
}): JSX.Element | null {
  const { appResources, viewSets, directory, key } = resourcesTree;
  const resources = [...appResources, ...viewSets];
  const canCreate = hasToolPermission('resources', 'create') && !isReadOnly;
  return typeof directory === 'object' &&
    (resources.length > 0 || canCreate) ? (
    <Ul aria-label={adminText('resources')} className="pl-4" role="group">
      {resources.map((resource, index) => (
        <li key={index}>
          <ResourceItem resource={resource} onOpen={handleOpen} />
        </li>
      ))}
      {canCreate && (
        <li>
          <Link.Default href={`/specify/resources/create/${key}/`}>
            <span className={className.dataEntryAdd}>{icons.plus}</span>
            {adminText('addResource')}
          </Link.Default>
        </li>
      )}
    </Ul>
  ) : null;
}

function mutateConformation(
  conformations: RA<AppResourcesConformation>,
  key: string,
  childConformation: RA<AppResourcesConformation>
): RA<AppResourcesConformation> {
  const conformationIndex = conformations.findIndex(
    (conformation) => conformation.key === key
  );
  return replaceItem(conformations, conformationIndex, {
    key,
    children: childConformation,
  });
}

function ResourceItem({
  resource,
  onOpen: handleOpen,
}: {
  readonly resource: SerializedResource<SpAppResource | SpViewSetObject>;
  readonly onOpen:
    | ((resource: SerializedResource<SpAppResource | SpViewSetObject>) => void)
    | undefined;
}): JSX.Element {
  const url =
    getAppResourceMode(resource) === 'appResources'
      ? `/specify/resources/app-resource/${resource.id}/`
      : `/specify/resources/view-set/${resource.id}/`;
  return (
    <ActiveLink
      className="!text-neutral-500 hover:!text-brand-300"
      href={url}
      onClick={
        typeof handleOpen === 'function'
          ? (event): void => {
              event.preventDefault();
              handleOpen(resource);
            }
          : undefined
      }
    >
      <AppResourceIcon resource={resource} />
      {resource.name || commonText('nullInline')}
    </ActiveLink>
  );
}
