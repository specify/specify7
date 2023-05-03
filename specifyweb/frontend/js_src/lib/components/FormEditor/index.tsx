import React from 'react';

import { useLiveState } from '../../hooks/useLiveState';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { defined } from '../../utils/types';
import type { AppResourceTabProps } from '../AppResources/TabDefinitions';
import { createXmlContext, XmlEditor } from '../Formatters';
import { getViewSetApiUrl } from '../FormParse';
import { SafeOutlet } from '../Router/RouterUtils';
import { clearUrlCache } from '../RouterCommands/CacheBuster';
import type { SpecToJson } from '../Syncer';
import { updateXml } from '../Syncer/xmlToJson';
import { getOriginalSyncerInput } from '../Syncer/xmlUtils';
import { formEditorRoutes } from './Routes';
import type { ViewSets } from './spec';
import { viewSetsSpec } from './spec';

export function FormEditor(props: AppResourceTabProps): JSX.Element {
  return (
    <XmlEditor
      context={FormEditorContext}
      props={props}
      rootTagName="viewsets"
      routes={formEditorRoutes}
      spec={viewSetsSpec()}
    />
  );
}

export type FormEditorOutlet = {
  readonly viewSets: readonly [
    ViewSets,
    (viewSets: ViewSets, changedViewNames: RA<string>) => void
  ];
};

export function FormEditorWrapper(): JSX.Element {
  const {
    parsed: [initialParsed],
    syncer: { deserializer },
    onChange: handleChange,
    onSetCleanup: handleSetCleanup,
  } = React.useContext(FormEditorContext)!;

  const originalParsed = React.useRef<ViewSets | undefined>(undefined);

  const [parsed, setParsed] = useLiveState<ViewSets>(
    React.useCallback(() => {
      originalParsed.current = injectRawXml(initialParsed);
      return originalParsed.current;
    }, [initialParsed])
  );

  const [changed, setChanged] = React.useState<ReadonlySet<string>>(new Set());

  return (
    <SafeOutlet<FormEditorOutlet>
      viewSets={[
        parsed,
        (parsed, changedViewNames): void => {
          setChanged((changed) => new Set([...changed, ...changedViewNames]));
          setParsed(parsed);
          handleChange(() => updateXml(deserializer(parsed)));
          handleSetCleanup(async () =>
            Promise.all(
              Array.from(changed, async (viewName) =>
                clearUrlCache(getViewSetApiUrl(viewName))
              )
            ).then(f.void)
          );
        },
      ]}
    />
  );
}

export const FormEditorContext = createXmlContext(viewSetsSpec());

/**
 * Syncer provides a way to access SimpleXmlNode, but we need XmlNode (as the
 * latter keeps the comments, which are commonly used in form definitions)
 * This code adds a "raw" prop for each viewDef with the XmlNode
 */
const injectRawXml = (
  initialParsed: SpecToJson<ReturnType<typeof viewSetsSpec>>
): ViewSets => ({
  ...initialParsed,
  viewDefs: initialParsed.viewDefs.map((definition) => ({
    ...definition,
    // Add XmlNode
    raw: defined(
      getOriginalSyncerInput(definition),
      'Unable to attach raw form definitions to parsed form definitions'
    ),
  })),
});

export const exportsForTests = { injectRawXml };
