import { Tab } from '@headlessui/react';
import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { commonText } from '../../localization/common';
import { resourcesText } from '../../localization/resources';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
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
import type { AppResourceTab } from './TabDefinitions';
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
    <Tab.Group>
      <Tab.List
        // Don't display tabs if there is only one tab
        className={`flex flex-wrap gap-2 ${tabs.length === 1 ? 'sr-only' : ''}`}
      >
        {tabs.map(({ label }, index) => (
          <Tab
            className={`${className.niceButton} ${className.blueButton}`}
            key={index}
          >
            {label}
          </Tab>
        ))}
      </Tab.List>
      <Tab.Panels className="h-full overflow-auto border border-brand-300 dark:border-none">
        {tabs.map(({ component: Component }, index) => (
          <Tab.Panel className="h-full" key={index}>
            <ErrorBoundary dismissible>
              <Component
                appResource={appResource}
                data={data}
                isReadOnly={isReadOnly}
                resource={resource}
                showValidationRef={showValidationRef}
                onChange={handleChange}
              />
            </ErrorBoundary>
          </Tab.Panel>
        ))}
      </Tab.Panels>
    </Tab.Group>
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
      dimensionsKey={false}
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
  readonly component: AppResourceTab;
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
      {
        label: resourcesText.textEditor(),
        component: AppResourceTextEditor,
      },
    ]);
  }, [subType]);
}
