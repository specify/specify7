import React from 'react';
import { useOutletContext } from 'react-router';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import type { AppResourceMode } from '../appresourceshelpers';
import { getAppResourceMode } from '../appresourceshelpers';
import type {
  SpAppResource,
  SpAppResourceDir,
  SpViewSetObj as SpViewSetObject,
} from '../datamodel';
import type { SerializedResource } from '../datamodelutils';
import { commonText } from '../localization/common';
import { fetchResource } from '../resource';
import { getUniqueName } from '../wbuniquifyname';
import type { AppResourcesOutlet } from './appresources';
import { findDirectory } from './appresourcescreate';
import { AppResourceEditor } from './appresourceseditor';
import type { AppResources } from './appresourceshooks';
import { useResourcesTree } from './appresourceshooks';
import { Container, H3 } from './basic';
import { useAsyncState } from './hooks';

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
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as {
    readonly resource?: SerializedResource<SpAppResource | SpViewSetObject>;
    readonly directoryKey?: string;
    readonly initialDataFrom?: number;
  };
  const resource = useAppResource(state.resource, resources, mode);
  const initialData = useInitialData(state.initialDataFrom);
  const directory = useDirectory(state.directoryKey, resource, resources);

  return initialData === undefined ? null : resource === undefined ||
    directory === undefined ? (
    <Container.Base className="flex-1">
      <H3>{commonText('pageNotFound')}</H3>
    </Container.Base>
  ) : (
    <AppResourceEditor
      directory={directory}
      initialData={initialData === false ? undefined : initialData}
      resource={resource}
      onClone={(appResource, initialDataFrom): void =>
        navigate(`/specify/resources/${mode}/new/`, {
          state: {
            resource: {
              ...appResource,
              name: getUniqueName(appResource.name, [appResource.name]),
            },
            directoryKey: state.directoryKey,
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
        navigate('/specify/resources/');
      }}
      onSaved={(appResource, directory): void => {
        if (resource.id === undefined)
          setResources({
            ...resources,
            directories:
              typeof directory.id === 'number'
                ? resources.directories
                : [...resources.directories, directory],
            [mode]: [...resources[mode], appResource],
          });
        navigate(`/specify/resources/${mode}/${appResource.id}/`);
      }}
    />
  );
}

function useAppResource(
  resource: SerializedResource<SpAppResource | SpViewSetObject> | undefined,
  resources: AppResources,
  mode: AppResourceMode
): SerializedResource<SpAppResource | SpViewSetObject> | undefined {
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
  resource: SerializedResource<SpAppResource | SpViewSetObject> | undefined,
  resources: AppResources
): SerializedResource<SpAppResourceDir> | undefined {
  const resourcesTree = useResourcesTree(resources);
  return React.useMemo(() => {
    if (typeof directoryKey === 'string')
      return findDirectory(resourcesTree, directoryKey);
    const directoryUrl = resource?.spAppResourceDir;
    return resources.directories.find(
      (directory) => directory.resource_uri === directoryUrl
    );
  }, [resourcesTree, directoryKey, resource, resources]);
}
