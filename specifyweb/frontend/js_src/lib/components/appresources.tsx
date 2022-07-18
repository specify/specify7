import React from 'react';
import type { State } from 'typesafe-reducer';

import type { AppResourceMode } from '../appresourceshelpers';
import { getAppResource, getAppResourceMode } from '../appresourceshelpers';
import type {
  SpAppResource,
  SpAppResourceDir,
  SpViewSetObj as SpViewSetObject,
} from '../datamodel';
import type { SerializedResource } from '../datamodelutils';
import { commonText } from '../localization/common';
import { schema } from '../schema';
import type { SpecifyModel } from '../specifymodel';
import { getUniqueName } from '../wbuniquifyname';
import { AppResourcesAside } from './appresourcesaside';
import { CreateAppResource } from './appresourcescreate';
import { AppResourceEditor } from './appresourceseditor';
import type { AppResources } from './appresourceshooks';
import { useAppResources } from './appresourceshooks';
import { Container, H2, H3 } from './basic';
import { useTitle, useTriggerState } from './hooks';

export function AppResourcesWrapper({
  mode,
  resourceId,
}: {
  readonly mode: AppResourceMode;
  readonly resourceId: number | undefined;
}): JSX.Element | null {
  const model =
    mode === 'appResources'
      ? schema.models.SpAppResource
      : schema.models.SpViewSetObj;
  useTitle(commonText('appResources'));

  const resources = useAppResources();
  return typeof resources === 'object' ? (
    <AppResourcesView
      resources={resources}
      model={model}
      resourceId={resourceId}
    />
  ) : null;
}

function AppResourcesView({
  resources: initialResources,
  model,
  resourceId,
}: {
  readonly resources: AppResources;
  readonly model: SpecifyModel<SpAppResource | SpViewSetObject>;
  readonly resourceId: number | undefined;
}): JSX.Element {
  const [resources, setResources] = useTriggerState(initialResources);
  const [state, setState] = React.useState<
    | State<'Main'>
    | State<
        'View',
        {
          readonly resource: SerializedResource<
            SpAppResource | SpViewSetObject
          >;
          readonly directory: SerializedResource<SpAppResourceDir>;
          readonly initialData: string | undefined;
        }
      >
    | State<
        'Create',
        {
          readonly directory: SerializedResource<SpAppResourceDir>;
        }
      >
    | State<'NotFound'>
  >(() => {
    const resource = getAppResource(resources, model, resourceId);
    if (typeof resource === 'object') {
      const directoryUrl = resource.spAppResourceDir;
      const directory = resources.directories.find(
        (directory) => directory.resource_uri === directoryUrl
      );
      if (typeof directory === 'object')
        return {
          type: 'View',
          resource,
          directory,
          initialData: undefined,
        };
    }
    return resource === false ? { type: 'NotFound' } : { type: 'Main' };
  });
  return (
    <Container.FullGray>
      <H2 className="text-2xl">{model.label}</H2>
      <div className="flex h-0 flex-1 gap-4">
        <AppResourcesAside
          // FEATURE: highlight current resource on the sidebar
          resources={resources}
          onOpen={(resource, directory): void =>
            setState({
              type: 'View',
              resource,
              directory,
              initialData: undefined,
            })
          }
          onCreate={(directory): void =>
            setState({ type: 'Create', directory })
          }
        />
        {state.type === 'View' && (
          <AppResourceEditor
            resource={state.resource}
            directory={state.directory}
            initialData={state.initialData}
            onDeleted={(): void => {
              const mode = getAppResourceMode(
                state.resource
                // Casting to simplify typing
              ) as 'appResources';
              setResources({
                ...resources,
                [mode]: resources[mode].filter(
                  (resource) => resource !== state.resource
                ),
              });
              setState({ type: 'Main' });
            }}
            onClone={(appResource, directory, initialData): void =>
              setState({
                type: 'View',
                resource: {
                  ...appResource,
                  name: getUniqueName(appResource.name, [appResource.name]),
                },
                directory,
                initialData,
              })
            }
            onSaved={(appResource, directory): void => {
              if (typeof state.resource.id === 'number') return;
              const mode = getAppResourceMode(appResource);
              setResources({
                ...resources,
                directories:
                  typeof state.directory.id === 'number'
                    ? resources.directories
                    : [...resources.directories, directory],
                [mode]: [...resources[mode], appResource],
              });
              setState({
                type: 'View',
                resource: appResource,
                directory,
                initialData: undefined,
              });
            }}
          />
        )}
        {state.type === 'Create' && (
          <CreateAppResource
            directory={state.directory}
            onClose={(): void => setState({ type: 'Main' })}
            onSelected={(resource): void =>
              setState({
                type: 'View',
                resource,
                directory: state.directory,
                initialData: undefined,
              })
            }
          />
        )}
        {state.type === 'NotFound' && (
          <Container.Base className="flex-1">
            <H3>{commonText('pageNotFound')}</H3>
          </Container.Base>
        )}
      </div>
    </Container.FullGray>
  );
}
