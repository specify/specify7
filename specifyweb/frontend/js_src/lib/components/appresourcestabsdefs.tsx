import { openLintPanel } from '@codemirror/lint';
import { EditorSelection } from '@codemirror/state';
import { okaidia } from '@uiw/codemirror-theme-okaidia';
import { xcodeLight } from '@uiw/codemirror-theme-xcode';
import type { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import CodeMirror from '@uiw/react-codemirror';
import React from 'react';

import type {
  SpAppResource,
  SpViewSetObj as SpViewSetObject,
} from '../datamodel';
import type { SerializedResource } from '../datamodelutils';
import { f } from '../functools';
import type { SpecifyResource } from '../legacytypes';
import type { UserPreferences } from '../preferencesutils';
import { getPrefDefinition, setPrefsGenerator } from '../preferencesutils';
import type { RR } from '../types';
import { writable } from '../types';
import { useCodeMirrorExtensions } from './appresourceeditorcomponents';
import type { appResourceSubTypes } from './appresourcescreate';
import { useId, useLiveState } from './hooks';
import { PreferencesContext, useDarkMode } from './preferenceshooks';
import { PreferencesContent } from './toolbar/preferences';

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
  return (
    <CodeMirror
      extensions={writable(extensions)}
      readOnly={isReadOnly}
      ref={(ref): void => {
        codeMirrorRef.current = ref;
        // Restore selection state when switching tabs or toggling full screen
        if (!stateRestored && typeof ref?.view === 'object') {
          if (selectionRef.current !== undefined)
            ref.view.dispatch({
              selection: EditorSelection.fromJSON(selectionRef.current),
            });
          setStateRestored(true);
        }
      }}
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
  const id = useId('user-preferences');
  const [preferencesContext] = useLiveState<
    React.ContextType<typeof PreferencesContext>
  >(
    React.useCallback(() => {
      const preferences = JSON.parse(data ?? '{}') as UserPreferences;
      const setPrefs = setPrefsGenerator(() => preferences, false);
      return [
        (
          category: string,
          subcategory: PropertyKey,
          item: PropertyKey
        ): unknown =>
          preferences[category]?.[subcategory as string]?.[item as string] ??
          getPrefDefinition(category, subcategory as string, item as string)
            .defaultValue,
        (
          category: string,
          subcategory: PropertyKey,
          item: PropertyKey,
          value: unknown
        ): void => {
          setPrefs(category, subcategory as string, item as string, value);
          handleChange(JSON.stringify(preferences));
        },
      ];
    }, [handleChange])
  );

  return (
    <PreferencesContext.Provider value={preferencesContext}>
      <PreferencesContent id={id} isReadOnly={isReadOnly} />
    </PreferencesContext.Provider>
  );
};

export const visualAppResourceEditors: RR<
  keyof typeof appResourceSubTypes,
  AppResourceTab | undefined
> = {
  label: undefined,
  report: undefined,
  userPreferences: UserPreferencesEditor,
  defaultUserPreferences: UserPreferencesEditor,
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
