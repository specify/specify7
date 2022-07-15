import { openLintPanel } from '@codemirror/lint';
import { EditorSelection } from '@codemirror/state';
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
import { f } from '../functools';
import type { SpecifyResource } from '../legacytypes';
import { useCodeMirrorExtensions } from './appresourceeditorcomponents';
import { useDarkMode } from './preferenceshooks';
import { appResourceSubTypes } from './appresourcescreate';
import { RR } from '../types';

export type AppResourceTab = (props: {
  readonly isReadOnly: boolean;
  readonly resource: SerializedResource<SpAppResource | SpViewSetObject>;
  readonly appResource: SpecifyResource<SpAppResource | SpViewSetObject>;
  readonly resourceData: SerializedResource<SpAppResourceData>;
  readonly showValidationRef: React.MutableRefObject<null | (() => void)>;
  readonly onChange: (
    resourceData: SerializedResource<SpAppResourceData>
  ) => void;
}) => JSX.Element;

export const AppResourceTextEditor: AppResourceTab = function ({
  isReadOnly,
  resource,
  appResource,
  resourceData,
  showValidationRef,
  onChange: handleChange,
}): JSX.Element {
  const isDarkMode = useDarkMode();
  const extensions = useCodeMirrorExtensions(resource, appResource);
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
  );
};

const UserPreferences: AppResourceTab = function ({
  isReadOnly,
  resource,
  appResource,
  resourceData,
  showValidationRef,
  onChange: handleChange,
}): JSX.Element {};

export const visualAppResourceEditors: RR<
  keyof typeof appResourceSubTypes,
  AppResourceTab | undefined
> = {
  label: undefined,
  report: undefined,
  userPreferences: UserPreferences,
  defaultUserPreferences: UserPreferences,
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
