import React from 'react';
import { useParams } from 'react-router-dom';
import type { LocalizedString } from 'typesafe-i18n';

import { useErrorContext } from '../../hooks/useErrorContext';
import { useId } from '../../hooks/useId';
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
import { appResourceSubTypes } from './types';

const emptyArray = [] as const;

export function AppResourcesAside({
  resources: unfilteredResources,
  filters = defaultAppResourceFilters,
  isEmbedded,
  onOpen: handleOpen,
  conformations: [initialConformations = emptyArray, setConformations],
}: {
  readonly resources: AppResources;
  readonly filters: AppResourceFiltersType | undefined;
  readonly isEmbedded: boolean;
  readonly onOpen?: (
    resource: SerializedResource<SpAppResource | SpViewSetObj>
  ) => void;
  readonly conformations: GetSet<RA<AppResourcesConformation> | undefined>;
}): JSX.Element {
  const resources = React.useMemo(
    () => filterAppResources(unfilteredResources, filters),
    [filters, unfilteredResources]
  );
  const resourcesTree = useResourcesTree(resources);
  useErrorContext('appResourcesTree', resourcesTree);

  const conformations = React.useMemo(
    () =>
      initialConformations === emptyArray
        ? buildAppResourceConformation(resourcesTree)
        : initialConformations,
    [initialConformations, resourcesTree]
  );
  useOpenCurrent(conformations, setConformations, resourcesTree);

  return (
    <aside
      className={`
        !gap-2 sm:overflow-visible
        ${
          isEmbedded ? className.containerBaseUnstyled : className.containerBase
        } 
      `}
    >
      <Ul className="flex flex-1 flex-col gap-1 overflow-auto" role="tree">
        {resourcesTree.map((resources) => (
          <TreeItem
            conformations={conformations}
            key={resources.key}
            resourcesTree={resources}
            onFold={setConformations}
            onOpen={handleOpen}
          />
        ))}
      </Ul>
      <div className="flex flex-wrap gap-2">
        <AppResourcesExpand
          resourcesTree={resourcesTree}
          onChange={setConformations}
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
      <Button.Info
        className="grow"
        onClick={(): void =>
          handleChange(buildAppResourceConformation(resourcesTree))
        }
      >
        {commonText.expandAll()}
      </Button.Info>
      <Button.Info className="grow" onClick={(): void => handleChange([])}>
        {commonText.collapseAll()}
      </Button.Info>
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
      className="flex flex-col gap-2"
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
              className="flex flex-col gap-2 pl-4"
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
    <Ul aria-label={resourcesText.resources()} className="pl-4" role="group">
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
      className="[&:not([aria-current]):not(:hover)]:!text-neutral-500"
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
      {('label' in resource ? resource.label : undefined) ??
        localized(resource.name) ??
        commonText.nullInline()}
    </ActiveLink>
  );
}

export const exportsForTests = {
  mutateConformation,
  useOpenCurrent,
};
