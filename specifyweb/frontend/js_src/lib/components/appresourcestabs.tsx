import { EditorSelection } from '@codemirror/state';
import { Tab } from '@headlessui/react';
import { okaidia } from '@uiw/codemirror-theme-okaidia';
import { xcodeLight } from '@uiw/codemirror-theme-xcode';
import type { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import CodeMirror from '@uiw/react-codemirror';
import React from 'react';

import type {
  SpAppResource,
  SpAppResourceData,
  SpViewSetObj as SpViewSetObject,
} from '../datamodel';
import type { SerializedResource } from '../datamodelutils';
import type { SpecifyResource } from '../legacytypes';
import { adminText } from '../localization/admin';
import { commonText } from '../localization/common';
import { localityText } from '../localization/locality';
import {
  AppResourceIcon,
  useCodeMirrorExtensions,
} from './appresourceeditorcomponents';
import { Button, className } from './basic';
import { useBooleanState } from './hooks';
import { icons } from './icons';
import { Dialog, dialogClassNames } from './modaldialog';
import { useDarkMode } from './preferenceshooks';

export function AppResourcesTabs({
  label,
  isReadOnly,
  forwardRef,
  headerButtons,
  appResource,
  resource,
  resourceData,
  onChange: handleChange,
}: {
  readonly label: string;
  readonly isReadOnly: boolean;
  readonly forwardRef: React.MutableRefObject<ReactCodeMirrorRef | null>;
  readonly appResource: SpecifyResource<SpAppResource | SpViewSetObject>;
  readonly resource: SerializedResource<SpAppResource | SpViewSetObject>;
  readonly headerButtons: JSX.Element;
  readonly resourceData: SerializedResource<SpAppResourceData>;
  readonly onChange: (
    resourceData: SerializedResource<SpAppResourceData>
  ) => void;
}): JSX.Element {
  const isDarkMode = useDarkMode();
  const [isFullScreen, _, handleExitFullScreen, handleToggleFullScreen] =
    useBooleanState();
  const [tabIndex, setTabIndex] = React.useState(0);
  const codeMirrorRef = React.useRef<ReactCodeMirrorRef | null>(null);
  const selectionRef = React.useRef<unknown | undefined>(undefined);
  const extensions = useCodeMirrorExtensions(resource, appResource);
  const tabs = {
    [adminText('editor')]: (
      <CodeMirror
        value={resourceData.data ?? ''}
        onChange={(data: string): void =>
          handleChange({
            ...resourceData,
            data,
          })
        }
        theme={isDarkMode ? okaidia : xcodeLight}
        readOnly={isReadOnly}
        ref={(ref): void => {
          codeMirrorRef.current = ref;
          forwardRef.current = ref;
          // Restore selection state when switching tabs or toggling full screen
          if (selectionRef.current !== undefined)
            ref?.view?.dispatch({
              selection: EditorSelection.fromJSON(selectionRef.current),
            });
        }}
        /*
         * FEATURE: provide supported attributes for autocomplete
         *   https://codemirror.net/examples/autocompletion/
         *   https://github.com/codemirror/lang-xml#api-reference
         */
        extensions={extensions}
        onUpdate={({ state }): void => {
          selectionRef.current = state.selection.toJSON();
        }}
      />
    ),
    test: <p>Test</p>,
  };
  const children = (
    <Tab.Group onChange={setTabIndex}>
      <Tab.List className="flex flex-wrap gap-2">
        {Object.keys(tabs).map((label, index) => (
          <Tab
            key={index}
            className={`${className.niceButton} ${
              className.blueButton
            } aria-handled ${index === tabIndex ? 'brightness-150' : ''}`}
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
        {Object.values(tabs).map((panel, index) => (
          <Tab.Panel key={index} className="h-full">
            {panel}
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
