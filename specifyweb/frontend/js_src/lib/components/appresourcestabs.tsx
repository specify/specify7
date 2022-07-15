import { Tab } from '@headlessui/react';
import React from 'react';

import { getAppResourceType } from '../appresourcesfilters';
import type {
  SpAppResource,
  SpAppResourceData,
  SpViewSetObj as SpViewSetObject,
} from '../datamodel';
import type { SerializedResource } from '../datamodelutils';
import { f } from '../functools';
import type { SpecifyResource } from '../legacytypes';
import { adminText } from '../localization/admin';
import { commonText } from '../localization/common';
import { localityText } from '../localization/locality';
import { toResource } from '../specifymodel';
import type { RA } from '../types';
import { filterArray } from '../types';
import { AppResourceIcon } from './appresourceeditorcomponents';
import type { AppResourceTab } from './appresourcestabsdefs';
import {
  AppResourceTextEditor,
  visualAppResourceEditors,
} from './appresourcestabsdefs';
import { Button, className } from './basic';
import { useBooleanState } from './hooks';
import { icons } from './icons';
import { Dialog, dialogClassNames } from './modaldialog';

export function AppResourcesTabs({
  label,
  isReadOnly,
  showValidationRef,
  headerButtons,
  appResource,
  resource,
  resourceData,
  onChange: handleChange,
}: {
  readonly label: string;
  readonly isReadOnly: boolean;
  readonly showValidationRef: React.MutableRefObject<null | (() => void)>;
  readonly appResource: SpecifyResource<SpAppResource | SpViewSetObject>;
  readonly resource: SerializedResource<SpAppResource | SpViewSetObject>;
  readonly headerButtons: JSX.Element;
  readonly resourceData: SerializedResource<SpAppResourceData>;
  readonly onChange: (
    resourceData: SerializedResource<SpAppResourceData>
  ) => void;
}): JSX.Element {
  const [isFullScreen, _, handleExitFullScreen, handleToggleFullScreen] =
    useBooleanState();
  const tabs = useEditorTabs(resource);
  const children = (
    <Tab.Group>
      <Tab.List className="flex flex-wrap gap-2">
        {tabs.map(({ label }, index) => (
          <Tab
            key={index}
            className={({ selected }): string =>
              `${className.niceButton} ${className.blueButton} aria-handled ${
                selected ? 'brightness-150' : ''
              }`
            }
          >
            {label}
          </Tab>
        ))}
        <span className="flex-1 -ml-2" />
        <Button.Blue
          title={localityText('toggleFullScreen')}
          aria-label={localityText('toggleFullScreen')}
          onClick={handleToggleFullScreen}
          aria-pressed={isFullScreen}
        >
          {icons.arrowsExpand}
        </Button.Blue>
      </Tab.List>
      <Tab.Panels className="h-full overflow-auto">
        {tabs.map(({ component: Component }, index) => (
          <Tab.Panel key={index} className="h-full">
            <Component
              isReadOnly={isReadOnly}
              resource={resource}
              appResource={appResource}
              resourceData={resourceData}
              onChange={handleChange}
              showValidationRef={showValidationRef}
            />
          </Tab.Panel>
        ))}
      </Tab.Panels>
    </Tab.Group>
  );
  return isFullScreen ? (
    <Dialog
      icon={<AppResourceIcon resource={resource} />}
      header={label}
      headerButtons={headerButtons}
      buttons={commonText('close')}
      onClose={handleExitFullScreen}
      className={{
        container: dialogClassNames.fullScreen,
      }}
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
  readonly label: string;
  readonly component: AppResourceTab;
}> {
  const subType = f.maybe(
    toResource(resource, 'SpAppResource'),
    getAppResourceType
  );
  return React.useMemo(() => {
    const visualEditor = Object.entries(visualAppResourceEditors).find(
      ([type]) => type === subType
    );
    return filterArray([
      typeof visualEditor === 'function'
        ? {
            label: adminText('visualEditor'),
            component: visualEditor,
          }
        : undefined,
      {
        label: adminText('textEditor'),
        component: AppResourceTextEditor,
      },
    ]);
  }, [subType]);
}
