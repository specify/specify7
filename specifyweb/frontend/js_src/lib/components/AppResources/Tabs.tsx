import { Tab } from '@headlessui/react';
import React from 'react';

import { getAppResourceType } from './filtersHelpers';
import type {
  SpAppResource,
  SpViewSetObj as SpViewSetObject,
} from '../DataModel/types';
import type { SerializedResource } from '../DataModel/helpers';
import { f } from '../../utils/functools';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { adminText } from '../../localization/admin';
import { commonText } from '../../localization/common';
import { localityText } from '../../localization/locality';
import { toResource } from '../DataModel/specifyModel';
import type { RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { AppResourceIcon } from './EditorComponents';
import type { AppResourceTab } from './TabDefinitions';
import {
  AppResourceTextEditor,
  visualAppResourceEditors,
} from './TabDefinitions';
import { Button, className } from '../Atoms/Basic';
import { ErrorBoundary } from '../Errors/ErrorBoundary';
import { useBooleanState } from '../../hooks/hooks';
import { icons } from '../Atoms/Icons';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';

export function AppResourcesTabs({
  label,
  isReadOnly,
  showValidationRef,
  headerButtons,
  appResource,
  resource,
  data,
  onChange: handleChange,
}: {
  readonly label: string;
  readonly isReadOnly: boolean;
  readonly showValidationRef: React.MutableRefObject<(() => void) | null>;
  readonly appResource: SpecifyResource<SpAppResource | SpViewSetObject>;
  readonly resource: SerializedResource<SpAppResource | SpViewSetObject>;
  readonly headerButtons: JSX.Element;
  readonly data: string | null;
  readonly onChange: (data: string | null) => void;
}): JSX.Element {
  const [isFullScreen, _, handleExitFullScreen, handleToggleFullScreen] =
    useBooleanState();
  const tabs = useEditorTabs(resource);
  const children = (
    <Tab.Group>
      <Tab.List className="flex flex-wrap gap-2">
        {tabs.map(({ label }, index, { length }) => (
          <Tab
            className={({ selected }): string => `
              ${className.niceButton} ${className.blueButton}
              ${selected ? 'brightness-150' : ''}
              ${length === 1 ? 'sr-only' : ''}
              aria-handled
            `}
            key={index}
          >
            {label}
          </Tab>
        ))}
        <span className="-ml-2 flex-1" />
        <Button.Blue
          aria-label={localityText('toggleFullScreen')}
          aria-pressed={isFullScreen}
          title={localityText('toggleFullScreen')}
          onClick={handleToggleFullScreen}
        >
          {icons.arrowsExpand}
        </Button.Blue>
      </Tab.List>
      <Tab.Panels className="h-full overflow-auto">
        {tabs.map(({ component: Component }, index) => (
          <Tab.Panel className="h-full" key={index}>
            <ErrorBoundary dismissable>
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
      buttons={commonText('close')}
      className={{
        container: dialogClassNames.fullScreen,
      }}
      header={label}
      headerButtons={headerButtons}
      icon={<AppResourceIcon resource={resource} />}
      onClose={handleExitFullScreen}
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
    const visualEditor =
      typeof subType === 'string'
        ? visualAppResourceEditors[subType]
        : undefined;
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
