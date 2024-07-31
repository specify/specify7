import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useErrorContext } from '../../hooks/useErrorContext';
import { useLiveState } from '../../hooks/useLiveState';
import { useTriggerState } from '../../hooks/useTriggerState';
import { formsText } from '../../localization/forms';
import { localityText } from '../../localization/locality';
import { getAppResourceUrl } from '../../utils/ajax/helpers';
import { f } from '../../utils/functools';
import { defined } from '../../utils/types';
import { getUniqueName } from '../../utils/uniquifyName';
import { Button } from '../Atoms/Button';
import { Form, Select } from '../Atoms/Form';
import { icons } from '../Atoms/Icons';
import { LoadingContext, ReadOnlyContext } from '../Core/Contexts';
import { toResource, toTable } from '../DataModel/helpers';
import type { SerializedResource } from '../DataModel/helperTypes';
import { SpecifyResource } from '../DataModel/legacyTypes';
import { createResource } from '../DataModel/resource';
import {
  deserializeResource,
  serializeResource,
} from '../DataModel/serializers';
import type {
  SpAppResource,
  SpAppResourceData,
  SpViewSetObj as SpViewSetObject,
} from '../DataModel/types';
import { useResourceView } from '../Forms/BaseResourceView';
import { SaveButton } from '../Forms/Save';
import { AppTitle } from '../Molecules/AppTitle';
import { hasToolPermission } from '../Permissions/helpers';
import { isOverlay, OverlayContext } from '../Router/Router';
import { clearUrlCache } from '../RouterCommands/CacheBuster';
import { isXmlSubType } from './Create';
import {
  AppResourceDownload,
  AppResourceEditButton,
  appResourceIcon,
  AppResourceLoad,
} from './EditorComponents';
import { getAppResourceType, getResourceType } from './filtersHelpers';
import { useAppResourceData } from './hooks';
import { AppResourcesTab, useEditorTabs } from './Tabs';
import { getScope } from './tree';
import type { ScopedAppResourceDir } from './types';
import { appResourceSubTypes } from './types';

export const AppResourceContext = React.createContext<
  SpecifyResource<SpAppResource>
>(undefined!);

export function AppResourceEditor({
  resource,
  directory,
  initialData,
  onSaved: handleSaved,
  onClone: handleClone,
  onDeleted: handleDeleted,
  children,
}: {
  readonly resource:
    | SerializedResource<SpAppResource>
    | SerializedResource<SpViewSetObject>;
  readonly directory: ScopedAppResourceDir;
  readonly initialData: string | undefined;
  readonly onDeleted: (() => void) | undefined;
  readonly onClone:
    | ((
        resource:
          | SerializedResource<SpAppResource>
          | SerializedResource<SpViewSetObject>,
        initialData: number | undefined
      ) => void)
    | undefined;
  readonly onSaved: (
    resource:
      | SerializedResource<SpAppResource>
      | SerializedResource<SpViewSetObject>,
    directory: ScopedAppResourceDir
  ) => void;
  readonly children: (renderProps: {
    readonly headerString: LocalizedString;
    readonly headerJsx: JSX.Element;
    readonly headerButtons: JSX.Element;
    readonly form: JSX.Element;
    readonly footer: JSX.Element | undefined;
  }) => JSX.Element;
}): JSX.Element | null {
  const appResource = React.useMemo(
    () => deserializeResource(resource as SerializedResource<SpAppResource>),
    [resource]
  );
  useErrorContext('appResource', resource);

  const {
    resourceData: [resourceData, setResourceData],
    isChanged,
  } = useAppResourceData(resource, initialData);
  useErrorContext('resourceData', resourceData);

  const [formElement, setForm] = React.useState<HTMLFormElement | null>(null);
  const isReadOnly =
    React.useContext(ReadOnlyContext) ||
    !hasToolPermission('resources', appResource.isNew() ? 'create' : 'update');

  const loading = React.useContext(LoadingContext);

  const [isFullScreen, setIsFullScreen] = React.useState(false);
  const syncData = React.useCallback(() => {
    const getData = lastDataRef.current;
    if (typeof getData === 'function')
      setResourceData((resourceData) => {
        const data = getData();
        return data === undefined
          ? resourceData
          : {
              ...defined(resourceData, 'App Resource Data is not defined'),
              data,
            };
      });
  }, [setResourceData]);
  const handleChangeFullScreen = React.useCallback(
    (value: boolean) => {
      setIsFullScreen(value);
      syncData();
    },
    [syncData]
  );

  const { title, formatted, form } = useResourceView({
    isLoading: false,
    isSubForm: false,
    mode: 'edit',
    resource: appResource,
  });
  const isInOverlay = isOverlay(React.useContext(OverlayContext));

  const tabs = useEditorTabs(resource);
  // Return to first tab on resource type change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const [tabIndex, setTab] = useLiveState(React.useCallback(() => 0, [tabs]));
  const tab = Math.min(tabIndex, tabs.length - 1);
  const handleChangeTab = React.useCallback(
    (index: number) => {
      setTab(index);
      syncData();
    },
    [syncData, setTab]
  );
  const isEditingForm =
    typeof toResource(resource, 'SpViewSetObj') === 'object';
  // When editing a form, don't render the page inside of <form> to avoid #3357
  const renderInForm = !isEditingForm;

  const headerButtons = (
    <div className="flex flex-wrap gap-3">
      {tabs.length > 1 && (
        <div className="flex">
          <Select
            value={tab}
            onValueChange={(index): void =>
              handleChangeTab(f.parseInt(index) ?? 0)
            }
          >
            {tabs.map(({ label }, index) => (
              <option key={index} value={index}>
                {label}
              </option>
            ))}
          </Select>
        </div>
      )}
      {!isInOverlay && (
        <Button.Info
          aria-label={localityText.toggleFullScreen()}
          aria-pressed={isFullScreen}
          title={localityText.toggleFullScreen()}
          onClick={(): void => handleChangeFullScreen(!isFullScreen)}
        >
          {isFullScreen ? icons.arrowsCollapse : icons.arrowsExpand}
        </Button.Info>
      )}
      <span className="-ml-4 md:flex-1" />
      {typeof resourceData === 'object' && (
        <AppResourceLoad
          onLoaded={(data: string, mimeType: string): void => {
            setResourceData({
              ...resourceData,
              data,
            });
            const resource = toTable(appResource, 'SpAppResource');
            if (typeof resource === 'object' && mimeType !== '') {
              const currentType = resource.get('mimeType') ?? '';
              // Don't widen the type unnecessarily
              if (isXmlSubType(mimeType, currentType)) return;
              resource?.set('mimeType', mimeType);
            }
          }}
        />
      )}
      <AppResourceDownload
        data={resourceData?.data ?? ''}
        resource={resource}
      />
    </div>
  );

  const [lastData, setLastData] = useTriggerState<
    string | (() => string | null | undefined) | null
  >(resourceData?.data ?? null);
  const lastDataRef = React.useRef(lastData);
  lastDataRef.current = lastData;
  const possiblyChanged = typeof lastData === 'function';
  const [cleanup, setCleanup] = React.useState<
    (() => Promise<void>) | undefined
  >(undefined);
  const handleSetCleanup = React.useCallback(
    (callback: (() => Promise<void>) | undefined) => setCleanup(() => callback),
    []
  );

  if (resourceData === undefined) return null;

  const footer = (
    <>
      <span className="-ml-2 flex-1" />
      {formElement !== null &&
      hasToolPermission(
        'resources',
        appResource.isNew() ? 'create' : 'update'
      ) ? (
        <SaveButton
          form={formElement}
          resource={appResource}
          saveRequired={isChanged || possiblyChanged}
          onAdd={
            hasToolPermission('resources', 'create') &&
            typeof handleClone === 'function'
              ? ([newResource]): void => {
                  const resource = serializeResource(newResource);
                  const isClone = typeof resource.spAppResourceDir === 'string';
                  handleClone(
                    {
                      ...resource,
                      name:
                        resource.name.length > 0
                          ? getUniqueName(resource.name, [resource.name])
                          : formsText.newResourceTitle({
                              tableName: appResource.specifyTable.label,
                            }),
                    },
                    isClone ? resourceData.id : undefined
                  );
                }
              : undefined
          }
          onSaving={(unsetUnloadProtect): false => {
            loading(
              (typeof directory.id === 'number'
                ? Promise.resolve(directory)
                : createResource('SpAppResourceDir', directory)
              ).then(async (resourceDirectory) => {
                unsetUnloadProtect();

                if (appResource.isNew())
                  appResource.set(
                    'spAppResourceDir',
                    resourceDirectory.resource_uri
                  );

                const subType = f.maybe(
                  toResource(serializeResource(appResource), 'SpAppResource'),
                  getAppResourceType
                );
                // Set a mime type if it's not set yet
                if (typeof subType === 'string') {
                  const type = appResourceSubTypes[subType];
                  if (typeof type.name === 'string')
                    appResource.set(
                      'mimeType',
                      type.mimeType ?? appResource.get('mimeType')
                    );
                }

                await appResource.save();
                const resource = serializeResource(appResource);

                const data =
                  typeof lastDataRef.current === 'function'
                    ? lastDataRef.current()
                    : lastDataRef.current;
                const appResourceData = deserializeResource({
                  ...resourceData,
                  data: data === undefined ? resourceData.data : data,
                  spAppResource:
                    toTable(appResource, 'SpAppResource')?.get(
                      'resource_uri'
                    ) ?? null,
                  spViewSetObj:
                    toTable(appResource, 'SpViewSetObj')?.get('resource_uri') ??
                    null,
                });
                await appResourceData.save();
                if (appResource.specifyTable.name === 'SpAppResource')
                  await clearUrlCache(
                    getAppResourceUrl(appResource.get('name'))
                  );
                await cleanup?.();

                setResourceData(
                  serializeResource(
                    appResourceData
                  ) as SerializedResource<SpAppResourceData>
                );

                handleSaved(resource, {
                  ...resourceDirectory,
                  scope: getScope(resourceDirectory),
                });
              })
            );

            return false;
          }}
        />
      ) : undefined}
    </>
  );

  const content = (
    <ReadOnlyContext.Provider value={isReadOnly}>
      <AppResourceContext.Provider value={appResource}>
        <AppResourcesTab
          appResource={appResource}
          data={resourceData.data}
          directory={directory}
          footer={footer}
          headerButtons={headerButtons}
          isFullScreen={[isFullScreen, handleChangeFullScreen]}
          label={formatted}
          resource={resource}
          tab={tabs[tab].component}
          onChange={(data): void => {
            if (typeof data === 'function') setLastData(() => data);
            else setResourceData({ ...resourceData, data });
          }}
          onSetCleanup={handleSetCleanup}
        />
      </AppResourceContext.Provider>
    </ReadOnlyContext.Provider>
  );

  return children({
    headerString: formatted,
    headerJsx: (
      <div className="flex items-center justify-center gap-2">
        <div className="hidden md:block">
          {appResourceIcon(getResourceType(resource))}
        </div>
        <div className="flex max-w-[90%] gap-1">
          <h3 className="overflow-auto whitespace-nowrap text-2xl">
            {formatted}
          </h3>
          <AppResourceEditButton
            appResource={appResource}
            title={title}
            onDeleted={handleDeleted}
          >
            {form()}
          </AppResourceEditButton>
        </div>
        <AppTitle title={formatted} />
      </div>
    ),
    headerButtons,
    form: renderInForm ? (
      <Form className="flex-1 overflow-auto" forwardRef={setForm}>
        {content}
      </Form>
    ) : (
      <div className="flex flex-1 flex-col gap-4 overflow-auto">
        {/* A blank form just for the <SaveButton< component */}
        <Form className="contents" forwardRef={setForm} />
        {content}
      </div>
    ),
    footer: isFullScreen ? undefined : footer,
  });
}
