import { json } from '@codemirror/lang-json';
import { xml } from '@codemirror/lang-xml';
import { indentUnit, StreamLanguage } from '@codemirror/language';
import { properties } from '@codemirror/legacy-modes/mode/properties';
import type { Diagnostic } from '@codemirror/lint';
import { lintGutter, openLintPanel } from '@codemirror/lint';
import type { Extension } from '@codemirror/state';
import { EditorState } from '@codemirror/state';
import { okaidia } from '@uiw/codemirror-theme-okaidia';
import { xcodeLight } from '@uiw/codemirror-theme-xcode';
import type { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import CodeMirror from '@uiw/react-codemirror';
import { EditorView } from 'codemirror';
import React from 'react';

import type {
  SpAppResource,
  SpAppResourceDir,
  SpViewSetObj as SpViewSetObject,
} from '../datamodel';
import type { SerializedResource } from '../datamodelutils';
import { serializeResource } from '../datamodelutils';
import { f } from '../functools';
import { commonText } from '../localization/common';
import { hasToolPermission } from '../permissions';
import { createResource } from '../resource';
import { toTable } from '../specifymodel';
import type { RA } from '../types';
import {
  AppResourceDownload,
  AppResourceIcon,
  AppResourceLoad,
} from './appresourceeditorcomponents';
import {
  getAppResourceExtension,
  useAppResourceData,
} from './appresourceshooks';
import { Container, DataEntry, Form } from './basic';
import { jsonLinter, xmlLinter } from '../codemirrorlinters';
import { AppTitle } from './common';
import { LoadingContext } from './contexts';
import { DeleteButton } from './deletebutton';
import { useBooleanState } from './hooks';
import { Dialog } from './modaldialog';
import { useDarkMode, usePref } from './preferenceshooks';
import { deserializeResource } from './resource';
import { BaseResourceView } from './resourceview';
import { SaveButton } from './savebutton';

const linterKey = `parseError:${'spAppResourceDatas'.toLowerCase()}`;

export function AppResourceEditor({
  resource,
  directory,
  onSaved: handleSaved,
  onDeleted: handleDeleted,
}: {
  readonly resource: SerializedResource<SpAppResource | SpViewSetObject>;
  readonly directory: SerializedResource<SpAppResourceDir>;
  readonly onDeleted: () => void;
  readonly onSaved: (
    resource: SerializedResource<SpAppResource | SpViewSetObject>,
    directory: SerializedResource<SpAppResourceDir>
  ) => void;
}): JSX.Element | null {
  const appResource = React.useMemo(
    () => deserializeResource(resource),
    [resource]
  );
  const { resourceData, setResourceData, isChanged } =
    useAppResourceData(resource);

  const isReadOnly = !hasToolPermission(
    'resources',
    appResource.isNew() ? 'create' : 'update'
  );
  const [isEditingMeta, handleEditingMeta, handleEditedMeta] =
    useBooleanState();
  const formRef = React.useRef<HTMLFormElement | null>(null);

  const isDarkMode = useDarkMode();
  const [lineWrap] = usePref('appResources', 'behavior', 'lineWrap');
  const [indentSize] = usePref('appResources', 'behavior', 'indentSize');
  const [indentWithTab] = usePref('appResources', 'behavior', 'indentWithTab');
  const indentCharacter = indentWithTab ? '\t' : ' '.repeat(indentSize);

  const mode = getAppResourceExtension(resource);
  const [extensions, setExtensions] = React.useState<Extension[]>([]);
  React.useEffect(() => {
    function handleLinted(results: RA<Diagnostic>): void {
      const hasErrors = results.length > 0;
      if (hasErrors)
        appResource.saveBlockers?.add(
          linterKey,
          undefined,
          results.map(({ message }) => message).join('\n')
        );
      else appResource.saveBlockers?.remove(linterKey);
    }

    const language =
      mode === 'json'
        ? [json(), jsonLinter(handleLinted)]
        : mode === 'properties'
        ? [StreamLanguage.define(properties)]
        : [xml(), xmlLinter(handleLinted)];
    setExtensions([
      ...language,
      ...(lineWrap ? [EditorView.lineWrapping] : []),
      indentUnit.of(indentCharacter),
      EditorState.tabSize.of(indentSize),
      lintGutter(),
    ]);

    return (): void => appResource.saveBlockers?.remove(linterKey);
  }, [appResource, mode, lineWrap, indentCharacter, indentSize]);

  const codeMirrorRef = React.useRef<ReactCodeMirrorRef | null>(null);
  const loading = React.useContext(LoadingContext);

  return typeof resourceData === 'object' ? (
    <Container.Base className="flex-1 overflow-hidden">
      <BaseResourceView
        isLoading={false}
        resource={appResource}
        mode="edit"
        isSubForm={false}
      >
        {({ title, formatted, form }): JSX.Element => (
          <>
            <DataEntry.Header>
              <AppResourceIcon resource={resource} />
              <h3 className="whitespace-nowrap overflow-auto text-2xl">
                {formatted}
              </h3>
              <DataEntry.Edit onClick={handleEditingMeta} />
              <AppTitle title={formatted} type="form" />
              <span className="flex-1 -ml-4" />
              <AppResourceLoad
                onLoaded={(data: string, mimeType: string): void => {
                  setResourceData({
                    ...resourceData,
                    data,
                  });
                  toTable(appResource, 'SpAppResource')?.set(
                    'mimeType',
                    mimeType
                  );
                }}
              />
              <AppResourceDownload
                resource={resource}
                data={resourceData?.data ?? ''}
              />
            </DataEntry.Header>
            <Form forwardRef={formRef} className="flex-1 overflow-hidden">
              <CodeMirror
                value={resourceData.data ?? ''}
                onChange={(data: string): void =>
                  setResourceData({
                    ...resourceData,
                    data,
                  })
                }
                theme={isDarkMode ? okaidia : xcodeLight}
                readOnly={isReadOnly}
                ref={codeMirrorRef}
                /*
                 * FEATURE: provide supported attributes for autocomplete
                 *   https://codemirror.net/examples/autocompletion/
                 *   https://github.com/codemirror/lang-xml#api-reference
                 */
                extensions={extensions}
              />
            </Form>
            <DataEntry.Footer>
              {!appResource.isNew() &&
              hasToolPermission('resources', 'delete') ? (
                <DeleteButton
                  resource={appResource}
                  onDeleted={handleDeleted}
                />
              ) : undefined}
              <span className="flex-1 -ml-2" />
              {formRef.current !== null &&
              hasToolPermission(
                'resources',
                appResource.isNew() ? 'create' : 'update'
              ) ? (
                <SaveButton
                  resource={appResource}
                  form={formRef.current}
                  canAddAnother={false}
                  saveRequired={isChanged}
                  onIgnored={(): void => {
                    const editorView = codeMirrorRef.current?.view;
                    f.maybe(editorView, openLintPanel);
                  }}
                  onSaving={(): false => {
                    loading(
                      (async (): Promise<void> => {
                        const resourceDirectory =
                          typeof directory.id === 'number'
                            ? directory
                            : await createResource(
                                'SpAppResourceDir',
                                directory
                              );

                        if (appResource.isNew())
                          appResource.set(
                            'spAppResourceDir',
                            resourceDirectory.resource_uri
                          );
                        await appResource.save();

                        const appResourceData = deserializeResource({
                          ...resourceData,
                          spAppResource:
                            toTable(appResource, 'SpAppResource')?.get(
                              'resource_uri'
                            ) ?? null,
                          spViewSetObj:
                            toTable(appResource, 'SpViewSetObj')?.get(
                              'resource_uri'
                            ) ?? null,
                          recordset_info: null,
                        });
                        await appResourceData.save();

                        handleSaved(
                          serializeResource(appResource),
                          resourceDirectory
                        );
                      })()
                    );

                    return false;
                  }}
                />
              ) : undefined}
            </DataEntry.Footer>
            {isEditingMeta && (
              <Dialog
                header={title}
                buttons={commonText('close')}
                onClose={handleEditedMeta}
              >
                {form()}
              </Dialog>
            )}
          </>
        )}
      </BaseResourceView>
    </Container.Base>
  ) : null;
}
