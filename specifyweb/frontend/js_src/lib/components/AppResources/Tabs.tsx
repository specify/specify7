import { Tab } from '@headlessui/react';
import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { resourcesText } from '../../localization/resources';
import { f } from '../../utils/functools';
import type { GetSet, IR, RA, RR } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { WarningMessage } from '../Atoms';
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
import { radioButtonClassName } from './Filters';
import { getAppResourceType, getResourceType } from './filtersHelpers';
import type {
  AppResourceEditorType,
  AppResourceTabProps,
} from './TabDefinitions';
import {
  AppResourceTextEditor,
  visualAppResourceEditors,
} from './TabDefinitions';

export function AppResourcesTab({
  tab: Component,
  label,
  headerButtons,
  appResource,
  resource,
  directory,
  data,
  isFullScreen: [isFullScreen, _],
  onChange: handleChange,
  onSetCleanup: setCleanup,
  footer,
}: {
  readonly tab: Component;
  readonly label: LocalizedString;
  readonly appResource: SpecifyResource<SpAppResource | SpViewSetObject>;
  readonly resource: SerializedResource<SpAppResource | SpViewSetObject>;
  readonly directory: SerializedResource<SpAppResourceDir>;
  readonly headerButtons: JSX.Element;
  readonly data: string | null;
  readonly isFullScreen: GetSet<boolean>;
  readonly onChange: (
    data: string | (() => string | null | undefined) | null
  ) => void;
  readonly onSetCleanup: (callback: () => Promise<void>) => void;
  readonly footer: JSX.Element;
}): JSX.Element {
  const children = (
    <ErrorBoundary dismissible>
      <Component
        appResource={appResource}
        data={data}
        directory={directory}
        resource={resource}
        onChange={handleChange}
        onSetCleanup={setCleanup}
      />
    </ErrorBoundary>
  );
  return isFullScreen ? (
    <Dialog
      buttons={<div className="flex gap-2">{footer}</div>}
      className={{
        container: dialogClassNames.fullScreen,
        buttonContainer: '!block',
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

// Move this at the top of the file?
type Component = (props: AppResourceTabProps) => JSX.Element;

export function useEditorTabs(
  resource: SerializedResource<SpAppResource | SpViewSetObject>
): RA<{
  readonly label: LocalizedString;
  readonly component: (props: AppResourceTabProps) => JSX.Element;
}> {
  const subType =
    f.maybe(toResource(resource, 'SpAppResource'), getAppResourceType) ??
    'viewSet';
  return React.useMemo(() => {
    const editors =
      typeof subType === 'string'
        ? visualAppResourceEditors()[subType]
        : undefined;
    return editors === undefined
      ? [
        {
          label: labels.generic,
          component(props): JSX.Element {
            return <AppResourceTextEditor {...props} />;
          },
        },
      ]
      : filterArray(
        Object.entries(editors).map(([type, Editor]) =>
          typeof Editor === 'function'
            ? {
              label: labels[type],
              component(props): JSX.Element {
                return (
                  <>
                    {type === 'visual' && (
                      <OtherCollectionWarning directory={props.directory} />
                    )}
                    <Editor {...props} />
                  </>
                );
              },
            }
            : undefined
        )
      );
  }, [subType]);
}

const labels: RR<AppResourceEditorType, LocalizedString> = {
  visual: resourcesText.visualEditor(),
  xml: resourcesText.xmlEditor(),
  json: resourcesText.jsonEditor(),
  generic: resourcesText.textEditor(),
};

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
        className={`
          inline-flex w-fit flex-wrap gap-2 rounded
          bg-[color:var(--form-background)]
          ${Object.keys(tabs).length === 1 ? 'sr-only' : ''}
        `}
      >
        {Object.keys(tabs).map((label, index) => (
          <Tab
            className={radioButtonClassName(currentIndex === index)}
            key={index}
            /**
             * HeadlessUI does not trigger onChange on click on current tab.
             * This is a workaround. It overrides their click handler only
             * if the option IS current.
             */
            onClick={
              currentIndex === index
                ? (): void => handleChange(index)
                : undefined
            }
          >
            {label}
          </Tab>
        ))}
      </Tab.List>
      <Tab.Panels className="flex flex-1 overflow-hidden">
        {Object.values(tabs).map((element, index) => (
          <Tab.Panel className="flex flex-1 flex-col gap-4" key={index}>
            <ErrorBoundary dismissible>{element}</ErrorBoundary>
          </Tab.Panel>
        ))}
      </Tab.Panels>
    </Tab.Group>
  );
}

export const exportsForTests = {
  OtherCollectionWarning
};