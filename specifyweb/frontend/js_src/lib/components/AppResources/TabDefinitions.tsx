import { openLintPanel } from '@codemirror/lint';
import { EditorSelection } from '@codemirror/state';
import { okaidia } from '@uiw/codemirror-theme-okaidia';
import { xcodeLight } from '@uiw/codemirror-theme-xcode';
import type { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import CodeMirror from '@uiw/react-codemirror';
import React from 'react';

import { f } from '../../utils/functools';
import type { RR } from '../../utils/types';
import { writable } from '../../utils/types';
import { ReadOnlyContext } from '../Core/Contexts';
import { getField } from '../DataModel/helpers';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { useBlockerHandler } from '../DataModel/saveBlockers';
import type {
  SpAppResource,
  SpAppResourceDir,
  SpViewSetObj,
} from '../DataModel/types';
import { RssExportFeedEditor } from '../ExportFeed';
import { exportFeedSpec } from '../ExportFeed/spec';
import { FieldFormattersEditor } from '../FieldFormatters/Editor';
import { fieldFormattersSpec } from '../FieldFormatters/spec';
import { DataObjectFormatter } from '../Formatters';
import { formattersSpec } from '../Formatters/spec';
import { FormEditor } from '../FormEditor';
import { viewSetsSpec } from '../FormEditor/spec';
import { UserPreferencesEditor } from '../Preferences/Editor';
import { useDarkMode } from '../Preferences/Hooks';
import type { BaseSpec } from '../Syncer';
import type { SimpleXmlNode } from '../Syncer/xmlToJson';
import { WebLinkEditor } from '../WebLinks/Editor';
import { webLinksSpec } from '../WebLinks/spec';
import { useCodeMirrorExtensions } from './EditorComponents';
import type { appResourceSubTypes } from './types';

export type AppResourceEditorType = 'generic' | 'json' | 'visual' | 'xml';

export type AppResourceTabProps = {
  readonly resource: SerializedResource<SpAppResource | SpViewSetObj>;
  readonly appResource: SpecifyResource<SpAppResource | SpViewSetObj>;
  readonly directory: SerializedResource<SpAppResourceDir>;
  readonly data: string | null;
  /**
   * Instead of returning a string value on change, you return a function
   * that returns a string value. This way, if new value is stored in an
   * internal structure that is expensive to convert to string, it won't be
   * converted to string until it is necessary.
   */
  readonly onChange: (
    data: string | (() => string | null | undefined) | null
  ) => void;
  readonly onSetCleanup: (callback: () => Promise<void>) => void;
};
const generateEditor = (xmlSpec: (() => BaseSpec<SimpleXmlNode>) | undefined) =>
  function AppResourceTextEditor({
    resource,
    appResource,
    data,
    className = '',
    onChange: handleChange,
  }: Omit<AppResourceTabProps, 'onChange' | 'onSetCleanup'> & {
    readonly onChange: (data: string) => void;
    readonly className?: string;
  }): JSX.Element {
    const isDarkMode = useDarkMode();

    const extensions = useCodeMirrorExtensions(resource, appResource, xmlSpec);

    const [stateRestored, setStateRestored] = React.useState<boolean>(false);
    const codeMirrorRef = React.useRef<ReactCodeMirrorRef | null>(null);
    useBlockerHandler(
      appResource,
      React.useMemo(
        () => getField(appResource.specifyTable, 'spAppResourceDatas'),
        [appResource.specifyTable]
      ),
      React.useCallback(() => {
        const editorView = codeMirrorRef.current?.view;
        return f.maybe(editorView, openLintPanel) ?? false;
      }, [])
    );
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
        onUpdate={({ state }): void => {
          selectionRef.current = state.selection.toJSON();
        }}
        className={`border-brand-300 w-full overflow-auto border dark:border-none ${className}`}
        /*
         * Disable spell check if we are doing own validation as otherwise it's
         * hard to differentiate between browser's spell check errors and our
         * validation errors
         */
        spellCheck={typeof xmlSpec === 'function'}
        value={data ?? ''}
        /*
         * FEATURE: provide supported attributes for autocomplete
         *   https://codemirror.net/examples/autocompletion/
         *   https://github.com/codemirror/lang-xml#api-reference
         */
        onChange={handleChange}
      />
    );
  };

export const AppResourceTextEditor = generateEditor(undefined);
export const generateXmlEditor = generateEditor;

export const visualAppResourceEditors = f.store<
  RR<
    keyof typeof appResourceSubTypes | 'viewSet',
    | {
        readonly visual?: (props: AppResourceTabProps) => JSX.Element;
        readonly json?: (props: AppResourceTabProps) => JSX.Element;
        readonly xml?: (props: AppResourceTabProps) => JSX.Element;
      }
    | undefined
  >
>(() => ({
  viewSet: {
    visual: FormEditor,
    xml: generateXmlEditor(viewSetsSpec),
  },
  label: undefined,
  report: undefined,
  userPreferences: {
    visual: UserPreferencesEditor,
    json: AppResourceTextEditor,
  },
  defaultUserPreferences: {
    visual: UserPreferencesEditor,
    json: AppResourceTextEditor,
  },
  collectionPreferences: {
    // FEATURE: add visual editor
    json: AppResourceTextEditor,
  },
  leafletLayers: undefined,
  rssExportFeed: {
    visual: RssExportFeedEditor,
    xml: generateXmlEditor(exportFeedSpec),
  },
  expressSearchConfig: undefined,
  typeSearches: undefined,
  webLinks: {
    visual: WebLinkEditor,
    xml: generateXmlEditor(webLinksSpec),
  },
  uiFormatters: {
    visual: FieldFormattersEditor,
    xml: generateXmlEditor(fieldFormattersSpec),
  },
  dataObjectFormatters: {
    visual: DataObjectFormatter,
    xml: generateXmlEditor(formattersSpec),
  },
  searchDialogDefinitions: undefined,
  dataEntryTables: undefined,
  interactionsTables: undefined,
  otherXmlResource: undefined,
  otherJsonResource: undefined,
  otherPropertiesResource: undefined,
  otherAppResources: undefined,
}));
