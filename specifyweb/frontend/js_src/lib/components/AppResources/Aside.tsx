import React from 'react';
import { useParams } from 'react-router-dom';
import type { LocalizedString } from 'typesafe-i18n';

import { useErrorContext } from '../../hooks/useErrorContext';
import { useId } from '../../hooks/useId';
import { useLiveState } from '../../hooks/useLiveState';
import { commonText } from '../../localization/common';
import { resourcesText } from '../../localization/resources';
import { StringToJsx } from '../../localization/utils';
import { f } from '../../utils/functools';
import type { GetSet, RA } from '../../utils/types';
import { filterArray, localized } from '../../utils/types';
import { multiSortFunction, removeItem, replaceItem } from '../../utils/utils';
import { Ul } from '../Atoms';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { icons } from '../Atoms/Icons';
import { Link } from '../Atoms/Link';
import { ReadOnlyContext } from '../Core/Contexts';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { SpAppResource, SpViewSetObj } from '../DataModel/types';
import { hasToolPermission } from '../Permissions/helpers';
import { ActiveLink, useIsActive } from '../Router/ActiveLink';
import { scrollIntoView } from '../TreeView/helpers';
import { appResourceIcon } from './EditorComponents';
import type { AppResourceFilters as AppResourceFiltersType } from './filtersHelpers';
import {
  defaultAppResourceFilters,
  filterAppResources,
  getResourceType,
} from './filtersHelpers';
import { buildAppResourceConformation, getAppResourceMode } from './helpers';
import type { AppResources, AppResourcesTree } from './hooks';
import { useAppResourceCount, useResourcesTree } from './hooks';
import { searchAppResourcesTree } from './tree';
import { appResourceSubTypes } from './types';

const emptyArray = [] as const;

export function AppResourcesAside({
  className: extraClassName,
  resources: unfilteredResources,
  filters = defaultAppResourceFilters,
  isEmbedded,
  searchQuery = '',
  onOpen: handleOpen,
  conformations: [initialConformations = emptyArray, setConformations],
}: {
  readonly className?: string;
  readonly resources: AppResources;
  readonly filters: AppResourceFiltersType | undefined;
  readonly isEmbedded: boolean;
  readonly searchQuery?: string;
  readonly onOpen?: (
    resource: SerializedResource<SpAppResource | SpViewSetObj>
  ) => void;
  readonly conformations: GetSet<RA<AppResourcesConformation> | undefined>;
}): JSX.Element {
  const resources = React.useMemo(
    () => filterAppResources(unfilteredResources, filters),
    [filters, unfilteredResources]
  );
  const fullResourcesTree = useResourcesTree(resources);
  const resourcesTree = React.useMemo(
    () => searchAppResourcesTree(fullResourcesTree, searchQuery),
    [fullResourcesTree, searchQuery]
  );
  const isSearching = searchQuery.trim() !== '';
  useErrorContext('appResourcesTree', resourcesTree);

  const conformations = React.useMemo(
    () =>
      initialConformations === emptyArray
        ? buildAppResourceConformation(fullResourcesTree)
        : initialConformations,
    [initialConformations, fullResourcesTree]
  );
  useOpenCurrent(conformations, setConformations, fullResourcesTree);
  const [searchConformations, setSearchConformations] = useLiveState(
    React.useCallback(
      () => buildAppResourceConformation(resourcesTree),
      [resourcesTree]
    )
  );
  const visibleConformations = isSearching
    ? searchConformations
    : conformations;
  const handleFold = isSearching ? setSearchConformations : setConformations;

  return (
    <aside
      aria-label={resourcesText.browseResources()}
      className={`
        min-h-0 min-w-0 !gap-2
        ${
          isEmbedded
            ? className.containerBaseUnstyled
            : `${className.containerBase} max-h-[40vh] flex-1 !overflow-hidden !p-2 md:max-h-none`
        } 
      `.concat(extraClassName === undefined ? '' : ` ${extraClassName}`)}
    >
      {isSearching && resourcesTree.length === 0 ? (
        <p className="flex-1" role="status">
          {commonText.noResults()}
        </p>
      ) : (
        <Ul className="flex flex-1 flex-col gap-1 overflow-auto" role="tree">
          {resourcesTree.map((resources) => (
            <TreeItem
              conformations={visibleConformations}
              key={resources.key}
              resourcesTree={resources}
              onFold={handleFold}
              onOpen={handleOpen}
            />
          ))}
        </Ul>
      )}
      <div className="flex shrink-0 flex-wrap gap-2 border-t border-gray-300 pt-2 dark:border-neutral-700">
        <AppResourcesExpand
          resourcesTree={resourcesTree}
          onChange={handleFold}
        />
      </div>
    </aside>
  );
}

/**
 * Unfold the app resources tree to current resource when the page loads
 */
function useOpenCurrent(
  conformation: RA<AppResourcesConformation>,
  setConformations: (value: RA<AppResourcesConformation>) => void,
  resourcesTree: AppResourcesTree
): void {
  const { id } = useParams();
  React.useEffect(() => {
    const idNumber = f.parseInt(id);

    if (idNumber === undefined) return;

    function updateConformation(
      category: AppResourcesTree[number],
      conformation: AppResourcesConformation | undefined
    ): AppResourcesConformation | undefined {
      const childrenConformation = filterArray(
        category.subCategories.map((item) =>
          updateConformation(
            item,
            conformation?.children.find(
              (conformation) => conformation.key === item.key
            )
          )
        )
      );

      return containsId(category) ||
        conformation !== undefined ||
        childrenConformation.length > 0
        ? {
            key: category.key,
            children: childrenConformation,
          }
        : undefined;
    }

    function containsId(category: AppResourcesTree[number]): boolean {
      return (
        category.appResources.some(
          (appResources) => appResources.id === idNumber!
        ) ||
        category.viewSets.some((appResources) => appResources.id === idNumber!)
      );
    }

    setConformations(
      filterArray(
        resourcesTree.map((tree) =>
          updateConformation(
            tree,
            conformation.find((conformation) => conformation.key === tree.key)
          )
        )
      )
    );
    /*
     * Not listening to conformation changes to that this only runs on page
     * start up
     */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setConformations, resourcesTree, id]);
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
      <Button.LikeLink
        className="grow justify-center rounded p-1"
        onClick={(): void =>
          handleChange(buildAppResourceConformation(resourcesTree))
        }
      >
        {commonText.expandAll()}
      </Button.LikeLink>
      <Button.LikeLink
        className="grow justify-center rounded p-1"
        onClick={(): void => handleChange([])}
      >
        {commonText.collapseAll()}
      </Button.LikeLink>
    </>
  );
}

function TreeItem({
  resourcesTree,
  conformations,
  onFold: handleFold,
  onOpen: handleOpen,
}: {
  readonly resourcesTree: AppResourcesTree[number];
  readonly conformations: RA<AppResourcesConformation>;
  readonly onFold: (conformations: RA<AppResourcesConformation>) => void;
  readonly onOpen:
    | ((resource: SerializedResource<SpAppResource | SpViewSetObj>) => void)
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
      className="flex min-w-0 flex-col gap-1"
      id={id('li')}
      /*
       * LOW: add aria-selected for focused row (currently that is denoted by
       *   button being focused
       */
      role="treeitem"
    >
      <Button.LikeLink
        aria-controls={id('li')}
        className="inline text-left font-bold"
        id={id('label')}
        onClick={(): void =>
          handleFold(
            conformationIndex === -1
              ? [...conformations, conformation]
              : removeItem(conformations, conformationIndex)
          )
        }
      >
        <StringToJsx
          components={{
            // eslint-disable-next-line react/no-unstable-nested-components
            wrap: (count) => (
              <span className="pl-2 text-neutral-500">{count}</span>
            ),
          }}
          string={commonText.jsxCountLine({
            resource: label,
            count,
          })}
        />
      </Button.LikeLink>
      {isExpanded && (
        <>
          <TreeItemResources
            resourcesTree={resourcesTree}
            onOpen={handleOpen}
          />
          {subCategories.length > 0 && (
            <Ul
              aria-label={resourcesText.subCategories()}
              className="flex min-w-0 flex-col gap-1 pl-3"
              role="group"
            >
              {subCategories.map((resources) => (
                <TreeItem
                  conformations={conformation.children}
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

const subTypes = Object.keys(appResourceSubTypes);

function TreeItemResources({
  resourcesTree,
  onOpen: handleOpen,
}: {
  readonly resourcesTree: AppResourcesTree[number];
  readonly onOpen:
    | ((resource: SerializedResource<SpAppResource | SpViewSetObj>) => void)
    | undefined;
}): JSX.Element | null {
  const { appResources, viewSets, directory, key } = resourcesTree;
  const isReadOnly = React.useContext(ReadOnlyContext);
  const canCreate = hasToolPermission('resources', 'create') && !isReadOnly;
  const resources = React.useMemo(
    () =>
      Array.from([...appResources, ...viewSets], (resource) => ({
        ...resource,
        type: getResourceType(resource),
      })).sort(
        multiSortFunction(
          // Put view sets first. Sort by type
          ({ type }) => (type === 'viewSet' ? -1 : subTypes.indexOf(type)),
          // Secondary sort by name
          ({ name }) => name
        )
      ),
    [appResources, viewSets]
  );

  return typeof directory === 'object' &&
    (resources.length > 0 || canCreate) ? (
    <Ul
      aria-label={resourcesText.browseResources()}
      className="min-w-0 pl-3"
      role="group"
    >
      {resources.map((resource, index) => (
        <li key={index}>
          <ResourceItem resource={resource} onOpen={handleOpen} />
        </li>
      ))}
      {canCreate && (
        <li>
          <Link.Default href={`/specify/resources/create/${key}/`}>
            <span className={className.dataEntryAdd}>{icons.plus}</span>
            {resourcesText.addResource()}
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
  readonly resource: SerializedResource<SpAppResource | SpViewSetObj> & {
    readonly type: ReturnType<typeof getResourceType>;
    readonly label?: LocalizedString;
  };
  readonly onOpen:
    | ((resource: SerializedResource<SpAppResource | SpViewSetObj>) => void)
    | undefined;
}): JSX.Element {
  const url =
    getAppResourceMode(resource) === 'appResources'
      ? `/specify/resources/app-resource/${resource.id}/`
      : `/specify/resources/view-set/${resource.id}/`;

  const [link, setLink] = React.useState<HTMLElement | null>(null);

  const isActive = useIsActive(url, false);

  React.useEffect(() => {
    if (isActive && link) scrollIntoView(link);
    /*
     * Scroll into view on mount only
     */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [link]);

  return (
    <ActiveLink
      className="w-full min-w-0 rounded px-1 py-0.5 [&[aria-current]]:bg-brand-100 dark:[&[aria-current]]:bg-neutral-700 [&:not([aria-current]):not(:hover)]:!text-neutral-500"
      forwardRef={setLink}
      href={url}
      mode="startsWith"
      onClick={
        typeof handleOpen === 'function'
          ? (event): void => {
              event.preventDefault();
              handleOpen(resource);
            }
          : undefined
      }
    >
      {appResourceIcon(resource.type)}
      <span className="truncate" title={resource.name}>
        {('label' in resource ? resource.label : undefined) ??
          localized(resource.name) ??
          commonText.nullInline()}
      </span>
    </ActiveLink>
  );
}

export const exportsForTests = {
  mutateConformation,
  useOpenCurrent,
};
