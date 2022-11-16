import { json } from '@codemirror/lang-json';
import { xml } from '@codemirror/lang-xml';
import { indentUnit, StreamLanguage } from '@codemirror/language';
import { properties } from '@codemirror/legacy-modes/mode/properties';
import type { Diagnostic } from '@codemirror/lint';
import { lintGutter } from '@codemirror/lint';
import type { Extension } from '@codemirror/state';
import { EditorState } from '@codemirror/state';
import { EditorView } from 'codemirror';
import React from 'react';

import { getResourceType } from './filtersHelpers';
import { jsonLinter, xmlLinter } from './codeMirrorLinters';
import type { SpAppResource, SpViewSetObj } from '../DataModel/types';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { adminText } from '../../localization/admin';
import { commonText } from '../../localization/common';
import type { RA } from '../../utils/types';
import { getAppResourceExtension } from './hooks';
import { LoadingContext } from '../Core/Contexts';
import { downloadFile, FilePicker, fileToText } from '../Molecules/FilePicker';
import { Dialog } from '../Molecules/Dialog';
import { DataEntry } from '../Atoms/DataEntry';
import { Button } from '../Atoms/Button';
import { useBooleanState } from '../../hooks/useBooleanState';
import { appResourceSubTypes, appResourceTypes } from './types';
import { SerializedResource } from '../DataModel/helperTypes';
import { usePref } from '../UserPreferences/usePref';

export const appResourceIcon = (
  type: ReturnType<typeof getResourceType>
): JSX.Element =>
  type === 'viewSet'
    ? appResourceTypes.viewSets.icon
    : appResourceSubTypes[type].icon;

export function AppResourceEditButton({
  title,
  children,
}: {
  readonly title: string;
  readonly children: JSX.Element;
}): JSX.Element {
  const [isEditingMeta, handleEditingMeta, handleEditedMeta] =
    useBooleanState();
  return (
    <>
      <DataEntry.Edit onClick={handleEditingMeta} />
      {isEditingMeta && (
        <Dialog
          buttons={commonText('close')}
          header={title}
          onClose={handleEditedMeta}
        >
          {children}
        </Dialog>
      )}
    </>
  );
}

export function AppResourceLoad({
  onLoaded: handleLoaded,
}: {
  readonly onLoaded: (data: string, mimeType: string) => void;
}): JSX.Element {
  const [isOpen, handleOpen, handleClose] = useBooleanState();
  const loading = React.useContext(LoadingContext);
  return (
    <>
      <Button.Green className="whitespace-nowrap" onClick={handleOpen}>
        {adminText('loadFile')}
      </Button.Green>
      {isOpen && (
        <Dialog
          buttons={commonText('cancel')}
          header={adminText('loadFile')}
          onClose={handleClose}
        >
          <FilePicker
            acceptedFormats={undefined}
            onSelected={(file): void =>
              loading(
                fileToText(file)
                  .then((data) => handleLoaded(data, file.type))
                  .finally(handleClose)
              )
            }
          />
        </Dialog>
      )}
    </>
  );
}

export function AppResourceDownload({
  resource,
  data,
}: {
  readonly resource: SerializedResource<SpAppResource | SpViewSetObj>;
  readonly data: string;
}): JSX.Element {
  const loading = React.useContext(LoadingContext);
  return (
    <Button.Green
      className="whitespace-nowrap"
      disabled={data.length === 0}
      onClick={(): void =>
        loading(
          downloadFile(
            `${resource.name}.${getAppResourceExtension(resource)}`,
            data
          )
        )
      }
    >
      {commonText('download')}
    </Button.Green>
  );
}

const linterKey = `parseError:${'spAppResourceDatas'.toLowerCase()}`;

export function useCodeMirrorExtensions(
  resource: SerializedResource<SpAppResource | SpViewSetObj>,
  appResource: SpecifyResource<SpAppResource | SpViewSetObj>
): RA<Extension> {
  const [lineWrap] = usePref('appResources', 'behavior', 'lineWrap');
  const [indentSize] = usePref('appResources', 'behavior', 'indentSize');
  const [indentWithTab] = usePref('appResources', 'behavior', 'indentWithTab');
  const indentCharacter = indentWithTab ? '\t' : ' '.repeat(indentSize);

  const mode = getAppResourceExtension(resource);
  const [extensions, setExtensions] = React.useState<RA<Extension>>([]);
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

  return extensions;
}
