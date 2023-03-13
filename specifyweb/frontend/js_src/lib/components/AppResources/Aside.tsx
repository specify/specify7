import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';
import {
  AppResources,
  AppResourcesTree,
  useAppResourceCount,
  useResourcesTree,
} from './hooks';
import { multiSortFunction, removeItem, replaceItem } from '../../utils/utils';
import { useErrorContext } from '../../hooks/useErrorContext';
import { filterArray, RA } from '../../utils/types';
import { ActiveLink, useIsActive } from '../Router/ActiveLink';
import { SpAppResource, SpViewSetObj } from '../DataModel/types';
import { useFilteredAppResources } from './Filters';
import { scrollIntoView } from '../TreeView/helpers';
import type { AppResourceFilters as AppResourceFiltersType } from './filtersHelpers';
import { getResourceType } from './filtersHelpers';
import { resourcesText } from '../../localization/resources';
import { commonText } from '../../localization/common';
import { appResourceSubTypes } from './types';
import { buildAppResourceConformation, getAppResourceMode } from './helpers';
import { f } from '../../utils/functools';
import { StringToJsx } from '../../localization/utils';
import { hasToolPermission } from '../Permissions/helpers';
import { icons } from '../Atoms/Icons';
import { appResourceIcon } from './EditorComponents';
import { Ul } from '../Atoms';
import { useCachedState } from '../../hooks/useCachedState';
import { SerializedResource } from '../DataModel/helperTypes';
import { useParams } from 'react-router-dom';
import { Button } from '../Atoms/Button';
import { useId } from '../../hooks/useId';
import { Link } from '../Atoms/Link';
import { className } from '../Atoms/className';

export function AppResourcesAside({
  resources: initialResources,
  isReadOnly,
  initialFilters,
  isEmbedded,
  onOpen: handleOpen,
}: {
  readonly resources: AppResources;
  readonly isReadOnly: boolean;
  readonly initialFilters?: AppResourceFiltersType;
  readonly isEmbedded: boolean;
  readonly onOpen?: (
    resource: SerializedResource<SpAppResource | SpViewSetObj>
  ) => void;
}): JSX.Element {
  const [conformations = [], setConformations] = useCachedState(
    'appResources',
    'conformation'
  );
  const resources = useFilteredAppResources(initialResources, initialFilters);
  const resourcesTree = useResourcesTree(resources);
  useErrorContext('appResourcesTree', resourcesTree);

  useOpenCurrent(conformations, setConformations, resourcesTree);

  return (
    <aside
      className={`
        !gap-2
        ${
          isEmbedded ? className.containerBaseUnstyled : className.containerBase
        } 
      `}
    >
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
        <AppResourcesExpand
          resourcesTree={resourcesTree}
          onChange={setConformations}
        />
      </div>
    </aside>
  );
}

function useOpenCurrent(
  conformation: RA<AppResourcesConformation>,
  setConformations: (value: RA<AppResourcesConformation>) => void,
  resourcesTree: AppResourcesTree
): void {
  const { id } = useParams();
  React.useEffect(() => {
    const idNum = f.parseInt(id);

    if (idNum === undefined) return;

    function updateConformation(
      category: AppResourcesTree[number],
      conformation: AppResourcesConformation | undefined
    ): AppResourcesConformation | undefined {
      const childrenConformation = filterArray(
        category.subCategories.map((item) =>
          updateConformation(
            item,
            conformation?.children.find(
              (conformation) => conformation.key === category.key
            )
          )
        )
      );

      if (
        containsId(category) ||
        conformation !== undefined ||
        childrenConformation.length > 0
      ) {
        return {
          key: category.key,
          children: childrenConformation,
        };
      } else return undefined;
    }

    function containsId(category: AppResourcesTree[number]): boolean {
      return (
        category.appResources.some(
          (appResources) => appResources.id === idNum!
        ) ||
        category.viewSets.some((appResources) => appResources.id === idNum!)
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
      <Button.Blue
        className="grow"
        onClick={(): void =>
          handleChange(buildAppResourceConformation(resourcesTree))
        }
      >
        {commonText.expandAll()}
      </Button.Blue>
      <Button.Blue className="grow" onClick={(): void => handleChange([])}>
        {commonText.collapseAll()}
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
      role="treeitem"
    >
      <Button.LikeLink
        aria-controls={id('li')}
        className="font-bold inline text-left"
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
            wrap: (count) => <span className="text-neutral-500 pl-2">{count}</span>,
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
            isReadOnly={isReadOnly}
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

const subTypes = Object.keys(appResourceSubTypes);

function TreeItemResources({
  resourcesTree,
  isReadOnly,
  onOpen: handleOpen,
}: {
  readonly resourcesTree: AppResourcesTree[number];
  readonly isReadOnly: boolean;
  readonly onOpen:
    | ((resource: SerializedResource<SpAppResource | SpViewSetObj>) => void)
    | undefined;
}): JSX.Element | null {
  const { appResources, viewSets, directory, key } = resourcesTree;
  const canCreate = hasToolPermission('resources', 'create') && !isReadOnly;
  const resources = React.useMemo(
    () =>
      Array.from([...appResources, ...viewSets], (resource) => ({
        ...resource,
        type: getResourceType(resource),
      })).sort(
        multiSortFunction(
          ({ type }) => (type === 'viewSet' ? -1 : subTypes.indexOf(type)),
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
    if (isActive && link) {
      scrollIntoView(link);
    }
  }, [link]);

  return (
    <ActiveLink
      className="[&:not([aria-current]):not(:hover)]:!text-neutral-500"
      href={url}
      onClick={
        typeof handleOpen === 'function'
          ? (event): void => {
              event.preventDefault();
              handleOpen(resource);
            }
          : undefined
      }
      forwardRef={setLink}
    >
      {appResourceIcon(resource.type)}
      {(resource.name as LocalizedString) || commonText.nullInline()}
    </ActiveLink>
  );
}
