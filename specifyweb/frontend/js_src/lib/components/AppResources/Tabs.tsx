import { Tab } from '@headlessui/react';
import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { commonText } from '../../localization/common';
import { resourcesText } from '../../localization/resources';
import { f } from '../../utils/functools';
import type { GetSet, IR, RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { WarningMessage } from '../Atoms';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { toResource } from '../DataModel/helpers';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { getResourceApiUrl } from '../DataModel/resource';
import { schema } from '../DataModel/schema';
import type {
  SpAppResource,
  SpAppResourceDir,
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
  directory,
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
  readonly directory: SerializedResource<SpAppResourceDir>;
  readonly headerButtons: JSX.Element;
  readonly data: string | null;
  readonly isFullScreen: boolean;
  readonly onExitFullScreen: () => void;
  readonly onChange: (data: string | null) => void;
}): JSX.Element {
  const tabs = useEditorTabs(resource);
  const index = React.useState<number>(0);
  const children = (
    <Tabs
      index={index}
      tabs={Object.fromEntries(
        tabs.map(({ label, component: Component }, index) => [
          label,
          <Component
            appResource={appResource}
            data={data}
            directory={directory}
            isReadOnly={isReadOnly}
            key={index}
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
    const VisualEditor =
      typeof subType === 'string'
        ? visualAppResourceEditors()[subType]
        : undefined;
    return filterArray([
      typeof VisualEditor === 'function'
        ? {
            label: resourcesText.visualEditor(),
            component(props) {
              return (
                <>
                  <OtherCollectionWarning directory={props.directory} />
                  <VisualEditor {...props} />
                </>
              );
            },
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

/* Display a warning when editing resources from a different collection */
function OtherCollectionWarning({
  directory,
}: {
  readonly directory: SerializedResource<SpAppResourceDir>;
}): JSX.Element | null {
  const isOtherScope = React.useMemo(
    () =>
      (typeof directory.collection === 'string' &&
        directory.collection !==
          getResourceApiUrl('Collection', schema.domainLevelIds.collection)) ||
      (typeof directory.discipline === 'string' &&
        directory.discipline !==
          getResourceApiUrl('Discipline', schema.domainLevelIds.discipline)),
    [directory]
  );
  return isOtherScope ? (
    <WarningMessage>{resourcesText.wrongScopeWarning()}</WarningMessage>
  ) : null;
}

export function Tabs({
  tabs,
  index: [currentIndex, handleChange],
}: {
  readonly tabs: IR<JSX.Element>;
  readonly index: GetSet<number>;
}): JSX.Element {
  return (
    <Tab.Group selectedIndex={currentIndex} onChange={handleChange}>
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
            /**
             * HeadlessUI does not trigger onChange on click on current tab.
             * This is a workaround. It overrides their click handler only
             * if the option IS current.
             */
            onClick={
              currentIndex === index ? () => handleChange(index) : undefined
            }
          >
            {label}
          </Tab>
        ))}
      </Tab.List>
      <Tab.Panels className="flex flex-1 overflow-hidden border border-brand-300 dark:border-none">
        {Object.values(tabs).map((element, index) => (
          <Tab.Panel className="flex flex-1 flex-col gap-4" key={index}>
            <ErrorBoundary dismissable>{element}</ErrorBoundary>
          </Tab.Panel>
        ))}
      </Tab.Panels>
    </Tab.Group>
  );
}
