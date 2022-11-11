import React from 'react';

import { deserializeResource } from '../../hooks/resource';
import { useBooleanState } from '../../hooks/useBooleanState';
import { useErrorContext } from '../../hooks/useErrorContext';
import { useIsModified } from '../../hooks/useIsModified';
import { formsText } from '../../localization/forms';
import { localityText } from '../../localization/locality';
import { Container } from '../Atoms';
import { Button } from '../Atoms/Button';
import { DataEntry } from '../Atoms/DataEntry';
import { Form } from '../Atoms/Form';
import { icons } from '../Atoms/Icons';
import { LoadingContext } from '../Core/Contexts';
import { serializeResource, toTable } from '../DataModel/helpers';
import type { SerializedResource } from '../DataModel/helperTypes';
import { createResource } from '../DataModel/resource';
import type {
  SpAppResource,
  SpAppResourceData,
  SpAppResourceDir,
  SpViewSetObj as SpViewSetObject,
} from '../DataModel/types';
import { BaseResourceView } from '../Forms/BaseResourceView';
import { DeleteButton } from '../Forms/DeleteButton';
import { SaveButton } from '../Forms/Save';
import { AppTitle } from '../Molecules/AppTitle';
import { hasToolPermission } from '../Permissions/helpers';
import { isAppResourceSubType } from './Create';
import {
  AppResourceDownload,
  AppResourceEditButton,
  AppResourceIcon,
  AppResourceLoad,
} from './EditorComponents';
import { useAppResourceData } from './hooks';
import { AppResourcesTabs } from './Tabs';

export function AppResourceEditor({
  resource,
  directory,
  initialData,
  onSaved: handleSaved,
  onClone: handleClone,
  onDeleted: handleDeleted,
}: {
  readonly resource: SerializedResource<SpAppResource | SpViewSetObject>;
  readonly directory: SerializedResource<SpAppResourceDir>;
  readonly initialData: string | undefined;
  readonly onDeleted: () => void;
  readonly onClone: (
    resource: SerializedResource<SpAppResource | SpViewSetObject>,
    initialData: number
  ) => void;
  readonly onSaved: (
    resource: SerializedResource<SpAppResource | SpViewSetObject>,
    directory: SerializedResource<SpAppResourceDir>
  ) => void;
}): JSX.Element | null {
  const appResource = React.useMemo(
    () => deserializeResource(resource),
    [resource]
  );
  useErrorContext('appResource', resource);

  const isModified = useIsModified(appResource);

  const { resourceData, setResourceData, isChanged } = useAppResourceData(
    resource,
    initialData
  );
  useErrorContext('resourceData', resourceData);

  const formRef = React.useRef<HTMLFormElement | null>(null);
  const isReadOnly = !hasToolPermission(
    'resources',
    appResource.isNew() ? 'create' : 'update'
  );

  const loading = React.useContext(LoadingContext);

  const showValidationRef = React.useRef<(() => void) | null>(null);
  const [isFullScreen, _, handleExitFullScreen, handleToggleFullScreen] =
    useBooleanState();
  return typeof resourceData === 'object' ? (
    <Container.Base className="flex-1 overflow-hidden">
      <BaseResourceView
        isLoading={false}
        isSubForm={false}
        mode="edit"
        resource={appResource}
      >
        {({ title, formatted, form }): JSX.Element => {
          const headerButtons = (
            <>
              <AppResourceEditButton title={title}>
                {form()}
              </AppResourceEditButton>
              <AppTitle title={formatted} type="form" />
              <Button.Blue
                aria-label={localityText('toggleFullScreen')}
                aria-pressed={isFullScreen}
                title={localityText('toggleFullScreen')}
                onClick={handleToggleFullScreen}
              >
                {isFullScreen ? icons.arrowsCollapse : icons.arrowsExpand}
              </Button.Blue>
              <span className="-ml-4 flex-1" />
              <AppResourceLoad
                onLoaded={(data: string, mimeType: string): void => {
                  setResourceData({
                    ...resourceData,
                    data,
                  });
                  const resource = toTable(appResource, 'SpAppResource');
                  if (typeof resource === 'object') {
                    const currentType = resource.get('mimeType') ?? '';
                    // Don't widen the type unnecessarily.
                    if (isAppResourceSubType(mimeType, currentType)) return;
                    resource?.set('mimeType', mimeType);
                  }
                }}
              />
              <AppResourceDownload
                data={resourceData?.data ?? ''}
                resource={resource}
              />
            </>
          );
          return (
            <>
              <DataEntry.Header>
                <AppResourceIcon resource={resource} />
                <h3 className="overflow-auto whitespace-nowrap text-2xl">
                  {formatted}
                </h3>
                {headerButtons}
              </DataEntry.Header>
              <Form className="flex-1 overflow-hidden" forwardRef={formRef}>
                <AppResourcesTabs
                  appResource={appResource}
                  data={resourceData.data}
                  headerButtons={headerButtons}
                  isFullScreen={isFullScreen}
                  isReadOnly={isReadOnly}
                  label={formatted}
                  resource={resource}
                  showValidationRef={showValidationRef}
                  onChange={(data): void =>
                    setResourceData({ ...resourceData, data })
                  }
                  onExitFullScreen={handleExitFullScreen}
                />
              </Form>
              <DataEntry.Footer>
                {!appResource.isNew() &&
                hasToolPermission('resources', 'delete') ? (
                  <DeleteButton
                    resource={appResource}
                    onDeleted={handleDeleted}
                  />
                ) : undefined}
                <span className="-ml-2 flex-1" />
                {hasToolPermission('resources', 'create') && (
                  <Button.Orange
                    disabled={isChanged || isModified}
                    onClick={(): void =>
                      loading(
                        appResource
                          .clone()
                          .then((appResourceClone) =>
                            handleClone(
                              serializeResource(appResourceClone),
                              resourceData.id
                            )
                          )
                      )
                    }
                  >
                    {formsText('clone')}
                  </Button.Orange>
                )}
                {formRef.current !== null &&
                hasToolPermission(
                  'resources',
                  appResource.isNew() ? 'create' : 'update'
                ) ? (
                  <SaveButton
                    canAddAnother={false}
                    form={formRef.current}
                    resource={appResource}
                    saveRequired={isChanged}
                    onIgnored={(): void => {
                      showValidationRef.current?.();
                    }}
                    onSaving={(): false => {
                      loading(
                        (async (): Promise<void> => {
                          const resourceDirectory =
                            typeof directory.id === 'number'
                              ? directory
                              : await createResource(
                                  'SpAppResourceDir',
                                  directory
                                );

                          if (appResource.isNew())
                            appResource.set(
                              'spAppResourceDir',
                              resourceDirectory.resource_uri
                            );
                          await appResource.save();
                          const resource = serializeResource(appResource);

                          const appResourceData = deserializeResource({
                            ...resourceData,
                            spAppResource:
                              toTable(appResource, 'SpAppResource')?.get(
                                'resource_uri'
                              ) ?? null,
                            spViewSetObj:
                              toTable(appResource, 'SpViewSetObj')?.get(
                                'resource_uri'
                              ) ?? null,
                          });
                          await appResourceData.save();

                          setResourceData(
                            serializeResource(
                              appResourceData
                            ) as SerializedResource<SpAppResourceData>
                          );

                          handleSaved(resource, resourceDirectory);
                        })()
                      );

                      return false;
                    }}
                  />
                ) : undefined}
              </DataEntry.Footer>
            </>
          );
        }}
      </BaseResourceView>
    </Container.Base>
  ) : null;
}
