import React from 'react';
import { useOutletContext } from 'react-router';
import { useNavigate, useParams } from 'react-router-dom';

import { useSearchParameter } from '../../hooks/navigation';
import { useAsyncState } from '../../hooks/useAsyncState';
import { f } from '../../utils/functools';
import { Container } from '../Atoms';
import { DataEntry } from '../Atoms/DataEntry';
import { addMissingFields } from '../DataModel/addMissingFields';
import type { SerializedResource } from '../DataModel/helperTypes';
import { fetchResource } from '../DataModel/resource';
import type {
  SpAppResource,
  SpAppResourceDir,
  SpViewSetObj,
} from '../DataModel/types';
import { userInformation } from '../InitialContext/userInformation';
import { NotFoundView } from '../Router/NotFoundView';
import { formatUrl } from '../Router/queryString';
import {
  findAppResourceDirectory,
  findAppResourceDirectoryKey,
} from './Create';
import { AppResourceEditor } from './Editor';
import type { AppResourceMode } from './helpers';
import { getAppResourceMode } from './helpers';
import type { AppResources, AppResourcesTree } from './hooks';
import { useResourcesTree } from './hooks';
import type { AppResourcesOutlet } from './index';

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

  const { name, mimeType, rawDirectoryKey, clone } = useProps();

  const newResource = React.useMemo(
    () =>
      addMissingFields(
        mode === 'appResources'
          ? 'SpAppResource'
          : ('SpViewSetObj' as 'SpAppResource'),
        {
          // I don't think this field is used anywhere
          level: 0,
          mimeType,
          name: name?.trim() ?? '',
          specifyUser: userInformation.resource_uri,
        }
      ),
    [resources, name, mimeType]
  );
  const resource = useAppResource(newResource, resources, mode);

  const initialData = useInitialData(f.parseInt(clone));

  const navigate = useNavigate();

  const resourcesTree = useResourcesTree(resources);
  const directory = useDirectory(
    rawDirectoryKey,
    resourcesTree,
    resource,
    resources
  );

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
      resource={resource as SerializedResource<SpAppResource>}
      onClone={(resource, clone): void =>
        navigate(
          formatUrl(`${baseHref}/new/`, {
            directoryKey: findAppResourceDirectoryKey(
              resourcesTree,
              directory.id
            ),
            name: resource.name,
            mimeType: 'mimeType' in resource ? resource.mimeType : undefined,
            clone,
          })
        )
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
    >
      {({ headerJsx, headerButtons, form, footer }): JSX.Element => (
        <Container.Base className="flex-1 overflow-hidden">
          <DataEntry.Header className="flex-wrap">
            {headerJsx}
            {headerButtons}
          </DataEntry.Header>
          {form}
          <DataEntry.Footer>{footer}</DataEntry.Footer>
        </Container.Base>
      )}
    </AppResourceEditor>
  );
}

/**
 * If clicking on a URL in a visual app resource editor, query string parameters
 * get cleared. This remembers previous parameters
 */
function useProps(): {
  readonly mimeType: string | undefined;
  readonly name: string | undefined;
  readonly rawDirectoryKey: string | undefined;
  readonly clone: string | undefined;
} {
  const { id: rawId } = useParams();
  const [mimeType] = useSearchParameter('mimeType');
  const [name] = useSearchParameter('name');
  const [clone] = useSearchParameter('clone');
  const [rawDirectoryKey] = useSearchParameter('directoryKey');
  const freeze =
    rawId === 'new' &&
    mimeType === undefined &&
    name === undefined &&
    clone === undefined;
  const data = { mimeType, name, clone, rawDirectoryKey };
  const frozen = React.useRef(data);
  if (freeze) return frozen.current;
  else {
    frozen.current = data;
    return data;
  }
}

function useAppResource(
  newResource: SerializedResource<SpAppResource | SpViewSetObj> | undefined,
  resources: AppResources,
  mode: AppResourceMode
): SerializedResource<SpAppResource | SpViewSetObj> | undefined {
  const { id } = useParams();
  return React.useMemo(
    () =>
      resources[mode as 'appResources'].find(
        (resource) => resource.id.toString() === id
      ) ?? newResource,
    [newResource, resources, id, mode]
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
  resourcesTree: AppResourcesTree,
  resource: SerializedResource<SpAppResource | SpViewSetObj> | undefined,
  resources: AppResources
): SerializedResource<SpAppResourceDir> | undefined {
  return React.useMemo(() => {
    const directoryUrl = resource?.spAppResourceDir;
    const directory = resources.directories.find(
      (directory) => directory.resource_uri === directoryUrl
    );
    if (typeof directory === 'object') return directory;
    else if (typeof directoryKey === 'string')
      return findAppResourceDirectory(resourcesTree, directoryKey);
    else return undefined;
  }, [resourcesTree, directoryKey, resource, resources]);
}
