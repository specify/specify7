import { openLintPanel } from '@codemirror/lint';
import { EditorSelection } from '@codemirror/state';
import { okaidia } from '@uiw/codemirror-theme-okaidia';
import { xcodeLight } from '@uiw/codemirror-theme-xcode';
import type { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import CodeMirror from '@uiw/react-codemirror';
import React from 'react';

import { useLiveState } from '../../hooks/useLiveState';
import { f } from '../../utils/functools';
import type { RR } from '../../utils/types';
import { writable } from '../../utils/types';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type {
  SpAppResource,
  SpViewSetObj as SpViewSetObject,
} from '../DataModel/types';
import { PreferencesContent } from '../Preferences';
import { BasePreferences } from '../Preferences/BasePreferences';
import { useDarkMode } from '../Preferences/Hooks';
import { userPreferenceDefinitions } from '../Preferences/UserDefinitions';
import { userPreferences } from '../Preferences/userPreferences';
import { useCodeMirrorExtensions } from './EditorComponents';
import type { appResourceSubTypes } from './types';

export type AppResourceTab = (props: {
  readonly isReadOnly: boolean;
  readonly resource: SerializedResource<SpAppResource | SpViewSetObject>;
  readonly appResource: SpecifyResource<SpAppResource | SpViewSetObject>;
  readonly data: string | null;
  readonly showValidationRef: React.MutableRefObject<(() => void) | null>;
  readonly onChange: (data: string | null) => void;
}) => JSX.Element;

export const AppResourceTextEditor: AppResourceTab = function ({
  isReadOnly,
  resource,
  appResource,
  data,
  showValidationRef,
  onChange: handleChange,
}): JSX.Element {
  const isDarkMode = useDarkMode();
  const extensions = useCodeMirrorExtensions(resource, appResource);

  const [stateRestored, setStateRestored] = React.useState<boolean>(false);
  const codeMirrorRef = React.useRef<ReactCodeMirrorRef | null>(null);
  React.useEffect(() => {
    showValidationRef.current = (): void => {
      const editorView = codeMirrorRef.current?.view;
      f.maybe(editorView, openLintPanel);
    };
  }, [showValidationRef]);
  const selectionRef = React.useRef<unknown | undefined>(undefined);

  const handleRef = React.useCallback(
    (ref: ReactCodeMirrorRef | null) => {
      codeMirrorRef.current = ref;
      // Restore selection state when switching tabs or toggling full screen
      if (!stateRestored && typeof ref?.view === 'object') {
        if (selectionRef.current !== undefined)
          ref.view.dispatch({
            selection: EditorSelection.fromJSON(selectionRef.current),
          });
        setStateRestored(true);
      }
    },
    [stateRestored]
  );
  return (
    <CodeMirror
      extensions={writable(extensions)}
      readOnly={isReadOnly}
      ref={handleRef}
      theme={isDarkMode ? okaidia : xcodeLight}
      value={data ?? ''}
      /*
       * FEATURE: provide supported attributes for autocomplete
       *   https://codemirror.net/examples/autocompletion/
       *   https://github.com/codemirror/lang-xml#api-reference
       */
      onChange={handleChange}
      onUpdate={({ state }): void => {
        selectionRef.current = state.selection.toJSON();
      }}
    />
  );
};

const UserPreferencesEditor: AppResourceTab = function ({
  isReadOnly,
  data,
  onChange: handleChange,
}): JSX.Element {
  const [preferencesContext] = useLiveState<typeof userPreferences>(
    React.useCallback(() => {
      const userPreferences = new BasePreferences({
        definitions: userPreferenceDefinitions,
        values: {
          resourceName: 'UserPreferences',
          fetchUrl: '/context/user_resource/',
        },
        defaultValues: undefined,
        developmentGlobal: '_editingUserPreferences',
        syncChanges: false,
      });
      userPreferences.setRaw(
        JSON.parse(data === null || data.length === 0 ? '{}' : data)
      );
      return userPreferences;
    }, [handleChange])
  );

  const Context = userPreferences.Context;
  return (
    <Context.Provider value={preferencesContext}>
      <PreferencesContent isReadOnly={isReadOnly} />
    </Context.Provider>
  );
};

export const visualAppResourceEditors: RR<
  keyof typeof appResourceSubTypes,
  AppResourceTab | undefined
> = {
  label: undefined,
  report: undefined,
  user: UserPreferencesEditor,
  defaultUserPreferences: UserPreferencesEditor,
  collection: undefined,
  leafletLayers: undefined,
  rssExportFeed: undefined,
  expressSearchConfig: undefined,
  webLinks: undefined,
  uiFormatters: undefined,
  dataObjectFormatters: undefined,
  searchDialogDefinitions: undefined,
  dataEntryTables: undefined,
  interactionsTables: undefined,
  otherXmlResource: undefined,
  otherJsonResource: undefined,
  otherPropertiesResource: undefined,
  otherAppResources: undefined,
};
