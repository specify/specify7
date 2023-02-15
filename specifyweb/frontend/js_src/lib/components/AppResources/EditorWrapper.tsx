import React from 'react';
import { useOutletContext } from 'react-router';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { useAsyncState } from '../../hooks/useAsyncState';
import type { SerializedResource } from '../DataModel/helperTypes';
import { fetchResource } from '../DataModel/resource';
import type { SpAppResource, SpViewSetObj } from '../DataModel/types';
import { NotFoundView } from '../Router/NotFoundView';
import { locationToState, useStableLocation } from '../Router/RouterState';
import { findAppResourceDirectory } from './Create';
import { AppResourceEditor } from './Editor';
import type { AppResourceMode } from './helpers';
import { getAppResourceMode } from './helpers';
import type { AppResources } from './hooks';
import { useResourcesTree } from './hooks';
import type { AppResourcesOutlet } from './index';
import { ScopedAppResourceDir } from './types';

export function AppResourceView(): JSX.Element {
  return <Wrapper mode="appResources" />;
}

export function ViewSetView(): JSX.Element {
  return <Wrapper mode="viewSets" />;
}

export function Wrapper({
  mode,
}: {
  readonly mode: AppResourceMode;
}): JSX.Element | null {
  const {
    getSet: [resources, setResources],
  } = useOutletContext<AppResourcesOutlet>();
  const location = useStableLocation(useLocation());
  const navigate = useNavigate();
  const state = locationToState(location, 'AppResource');
  const resource = useAppResource(state?.resource, resources, mode);
  const initialData = useInitialData(state?.initialDataFrom);
  const directory = useDirectory(state?.directoryKey, resource, resources);

  const baseHref = `/specify/resources/${
    mode === 'appResources' ? 'app-resource' : 'view-set'
  }`;
  return initialData === undefined ? null : resource === undefined ||
    directory === undefined ? (
    <NotFoundView container={false} />
  ) : (
    <AppResourceEditor
      directory={directory}
      initialData={initialData === false ? undefined : initialData}
      resource={resource}
      onClone={(resource, initialDataFrom): void =>
        navigate(`${baseHref}/new/`, {
          state: {
            type: 'AppResource',
            resource,
            directoryKey: state?.directoryKey,
            initialDataFrom,
          },
        })
      }
      onDeleted={(): void => {
        const mode = getAppResourceMode(
          resource
          // Casting to simplify typing
        ) as 'appResources';
        setResources({
          ...resources,
          [mode]: resources[mode].filter((record) => record !== resource),
        });
        navigate('/specify/resources/', { replace: true });
      }}
      onSaved={(appResource, directory): void => {
        setResources({
          ...resources,
          directories: [
            ...resources.directories.filter(({ id }) => id !== directory.id),
            directory,
          ],
          [mode]: [
            ...resources[mode as 'appResources'].filter(
              ({ id }) => id !== appResource.id
            ),
            appResource,
          ],
        });
        navigate(`${baseHref}/${appResource.id}/`);
      }}
    />
  );
}

function useAppResource(
  resource: SerializedResource<SpAppResource | SpViewSetObj> | undefined,
  resources: AppResources,
  mode: AppResourceMode
): SerializedResource<SpAppResource | SpViewSetObj> | undefined {
  const { id } = useParams();
  return React.useMemo(
    () =>
      resource ??
      resources[mode as 'appResources'].find(
        (resource) => resource.id.toString() === id
      ),
    [resource, resources, id, mode]
  );
}

function useInitialData(
  initialDataFrom: number | undefined
): string | false | undefined {
  return useAsyncState(
    React.useCallback(
      async () =>
        initialDataFrom === undefined
          ? false
          : fetchResource('SpAppResourceData', initialDataFrom).then(
              ({ data }) => data ?? ''
            ),
      [initialDataFrom]
    ),
    true
  )[0];
}

function useDirectory(
  directoryKey: string | undefined,
  resource: SerializedResource<SpAppResource | SpViewSetObj> | undefined,
  resources: AppResources
): ScopedAppResourceDir | undefined {
  const resourcesTree = useResourcesTree(resources);
  return React.useMemo(() => {
    if (typeof directoryKey === 'string')
      return findAppResourceDirectory(resourcesTree, directoryKey);
    const directoryUrl = resource?.spAppResourceDir;
    return resources.directories.find(
      (directory) => directory.resource_uri === directoryUrl
    );
  }, [resourcesTree, directoryKey, resource, resources]);
}
