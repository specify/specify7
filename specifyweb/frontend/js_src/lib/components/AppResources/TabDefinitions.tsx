import { openLintPanel } from '@codemirror/lint';
import { EditorSelection } from '@codemirror/state';
import { okaidia } from '@uiw/codemirror-theme-okaidia';
import { xcodeLight } from '@uiw/codemirror-theme-xcode';
import type { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import CodeMirror from '@uiw/react-codemirror';
import React from 'react';

import type { SpAppResource, SpViewSetObj } from '../DataModel/types';
import { f } from '../../utils/functools';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { PartialUserPreference } from '../UserPreferences/helpers';
import {
  getPref,
  getPrefDefinition,
  setPref,
  setPrefsGenerator,
} from '../UserPreferences/helpers';
import type { RR } from '../../utils/types';
import { writable } from '../../utils/types';
import { useCodeMirrorExtensions } from './EditorComponents';
import { PreferencesContext, useDarkMode } from '../UserPreferences/Hooks';
import { PreferencesContent } from '../UserPreferences';
import { useId } from '../../hooks/useId';
import { useLiveState } from '../../hooks/useLiveState';
import { appResourceSubTypes } from './types';
import { SerializedResource } from '../DataModel/helperTypes';
import {
  preferenceDefinitions,
  PreferenceItem,
} from '../UserPreferences/Definitions';

export type AppResourceTab = (props: {
  readonly isReadOnly: boolean;
  readonly resource: SerializedResource<SpAppResource | SpViewSetObj>;
  readonly appResource: SpecifyResource<SpAppResource | SpViewSetObj>;
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
  const id = useId('user-preferences');
  const [preferencesContext] = useLiveState<
    React.ContextType<typeof PreferencesContext>
  >(
    React.useCallback(() => {
      const preferences = JSON.parse(
        data || '{}'
      ) as unknown as PartialUserPreference;
      const setPrefs = setPrefsGenerator<typeof preferenceDefinitions>(
        () => preferences,
        getPrefDefinition,
        false
      );
      return [
        ((
          category: string,
          subcategory: PropertyKey,
          item: PropertyKey
        ): unknown =>
          // @ts-expect-error
          preferences[category]?.[subcategory as string]?.[item as string] ??
          (
            getPrefDefinition(
              // @ts-expect-error
              category,
              subcategory as string,
              item as string
            ) as PreferenceItem<any>
          ).defaultValue) as unknown as typeof getPref.user,
        ((
          category: string,
          subcategory: PropertyKey,
          item: PropertyKey,
          value: unknown
        ): void => {
          const newValue = setPrefs(
            // @ts-expect-error
            category,
            subcategory as string,
            item as string,
            value
          );
          handleChange(JSON.stringify(preferences));
          return newValue;
        }) as unknown as typeof setPref.user,
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
  user: UserPreferencesEditor,
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
