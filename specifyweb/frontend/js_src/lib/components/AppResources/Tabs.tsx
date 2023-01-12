import { Tab } from '@headlessui/react';
import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { commonText } from '../../localization/common';
import { resourcesText } from '../../localization/resources';
import { f } from '../../utils/functools';
import type { GetSet, IR, RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { toResource } from '../DataModel/helpers';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type {
  SpAppResource,
  SpViewSetObj as SpViewSetObject,
} from '../DataModel/types';
import { ErrorBoundary } from '../Errors/ErrorBoundary';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import { appResourceIcon } from './EditorComponents';
import { getAppResourceType, getResourceType } from './filtersHelpers';
import type { AppResourceTabProps } from './TabDefinitions';
import {
  AppResourceTextEditor,
  visualAppResourceEditors,
} from './TabDefinitions';

export function AppResourcesTabs({
  label,
  isReadOnly,
  showValidationRef,
  headerButtons,
  appResource,
  resource,
  data,
  isFullScreen,
  onExitFullScreen: handleExitFullScreen,
  onChange: handleChange,
}: {
  readonly label: LocalizedString;
  readonly isReadOnly: boolean;
  readonly showValidationRef: React.MutableRefObject<(() => void) | null>;
  readonly appResource: SpecifyResource<SpAppResource | SpViewSetObject>;
  readonly resource: SerializedResource<SpAppResource | SpViewSetObject>;
  readonly headerButtons: JSX.Element;
  readonly data: string | null;
  readonly isFullScreen: boolean;
  readonly onExitFullScreen: () => void;
  readonly onChange: (data: string | null) => void;
}): JSX.Element {
  const tabs = useEditorTabs(resource);
  const children = (
    <Tabs
      tabs={Object.fromEntries(
        tabs.map(({ label, component: Component }, index) => [
          label,
          <Component
            key={index}
            appResource={appResource}
            data={data}
            isReadOnly={isReadOnly}
            resource={resource}
            showValidationRef={showValidationRef}
            onChange={handleChange}
          />,
        ])
      )}
    />
  );
  return isFullScreen ? (
    <Dialog
      buttons={
        <Button.Blue onClick={handleExitFullScreen}>
          {commonText.close()}
        </Button.Blue>
      }
      className={{
        container: dialogClassNames.fullScreen,
      }}
      header={label}
      headerButtons={headerButtons}
      icon={appResourceIcon(getResourceType(resource))}
      onClose={undefined}
    >
      {children}
    </Dialog>
  ) : (
    children
  );
}

function useEditorTabs(
  resource: SerializedResource<SpAppResource | SpViewSetObject>
): RA<{
  readonly label: LocalizedString;
  readonly component: (props: AppResourceTabProps) => JSX.Element;
}> {
  const subType = f.maybe(
    toResource(resource, 'SpAppResource'),
    getAppResourceType
  );
  return React.useMemo(() => {
    const visualEditor =
      typeof subType === 'string'
        ? visualAppResourceEditors[subType]
        : undefined;
    return filterArray([
      typeof visualEditor === 'function'
        ? {
            label: resourcesText.visualEditor(),
            component: visualEditor,
          }
        : undefined,
      // FEATURE: add JSON editor for XML resources 🔥 (based on Syncer)
      {
        label: resourcesText.textEditor(),
        component: AppResourceTextEditor,
      },
    ]);
  }, [subType]);
}

export function Tabs({
  tabs,
  index,
}: {
  readonly tabs: IR<JSX.Element>;
  readonly index?: GetSet<number>;
}): JSX.Element {
  return (
    <Tab.Group selectedIndex={index?.[0]} onChange={index?.[1]}>
      <Tab.List
        // Don't display tabs if there is only one tab
        className={`flex flex-wrap gap-2 ${
          Object.keys(tabs).length === 1 ? 'sr-only' : ''
        }`}
      >
        {Object.keys(tabs).map((label, index) => (
          <Tab
            className={`${className.niceButton} ${className.blueButton}`}
            key={index}
          >
            {label}
          </Tab>
        ))}
      </Tab.List>
      <Tab.Panels className="flex flex-1 overflow-hidden border border-brand-300 dark:border-none">
        {Object.values(tabs).map((element, index) => (
          <Tab.Panel className="flex flex-1 flex-col gap-2" key={index}>
            <ErrorBoundary dismissable>{element}</ErrorBoundary>
          </Tab.Panel>
        ))}
      </Tab.Panels>
    </Tab.Group>
  );
}
