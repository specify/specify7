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
  SpAppResourceDir,
  SpViewSetObj,
} from '../DataModel/types';
import { DataObjectFormatter } from '../Formatters';
import { PreferencesContent } from '../UserPreferences';
import type { UserPreferences } from '../UserPreferences/helpers';
import {
  getPrefDefinition,
  setPrefsGenerator,
} from '../UserPreferences/helpers';
import { PreferencesContext, useDarkMode } from '../UserPreferences/Hooks';
import { useCodeMirrorExtensions } from './EditorComponents';
import type { appResourceSubTypes } from './types';
import { ReadOnlyContext } from '../Core/Contexts';

export type AppResourceTabProps = {
  readonly resource: SerializedResource<SpAppResource | SpViewSetObj>;
  readonly appResource: SpecifyResource<SpAppResource | SpViewSetObj>;
  readonly directory: SerializedResource<SpAppResourceDir>;
  readonly data: string | null;
  readonly showValidationRef: React.MutableRefObject<(() => void) | null>;
  /**
   * Instead of returning a string value on change, you return a function
   * that returns a string value. This way, if new value is stored in an
   * internal structure that is expensive to convert to string, it won't be
   * converted to string until it is necessary.
   */
  readonly onChange: (data: string | (() => string | null) | null) => void;
};

export function AppResourceTextEditor({
  resource,
  appResource,
  data,
  showValidationRef,
  onChange: handleChange,
}: AppResourceTabProps): JSX.Element {
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
  const isReadOnly = React.useContext(ReadOnlyContext);
  return (
    <CodeMirror
      extensions={writable(extensions)}
      readOnly={isReadOnly}
      ref={handleRef}
      theme={isDarkMode ? okaidia : xcodeLight}
      value={data ?? ''}
      /*
       * FEATURE: show validation errors when editing recognized XML file
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
}

function UserPreferencesEditor({
  data,
  onChange: handleChange,
}: AppResourceTabProps): JSX.Element {
  const [preferencesContext] = useLiveState<
    React.ContextType<typeof PreferencesContext>
  >(
    React.useCallback(() => {
      const preferences = JSON.parse(data || '{}') as UserPreferences;
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
      <PreferencesContent />
    </PreferencesContext.Provider>
  );
}

export const visualAppResourceEditors = f.store<
  RR<
    keyof typeof appResourceSubTypes,
    ((props: AppResourceTabProps) => JSX.Element) | undefined
  >
>(() => ({
  label: undefined,
  report: undefined,
  userPreferences: UserPreferencesEditor,
  defaultUserPreferences: UserPreferencesEditor,
  leafletLayers: undefined,
  rssExportFeed: undefined,
  expressSearchConfig: undefined,
  webLinks: undefined,
  uiFormatters: undefined,
  dataObjectFormatters: DataObjectFormatter,
  searchDialogDefinitions: undefined,
  dataEntryTables: undefined,
  interactionsTables: undefined,
  otherXmlResource: undefined,
  otherJsonResource: undefined,
  otherPropertiesResource: undefined,
  otherAppResources: undefined,
}));
