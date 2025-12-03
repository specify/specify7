import React from 'react';
import { useOutletContext } from 'react-router';

import { useLiveState } from '../../hooks/useLiveState';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { defined } from '../../utils/types';
import type { AppResourcesOutlet } from '../AppResources';
import type { AppResourceTabProps } from '../AppResources/TabDefinitions';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { Discipline } from '../DataModel/types';
import { createXmlContext, XmlEditor } from '../Formatters';
import { clearViewLocal, getViewSetApiUrl } from '../FormParse';
import { SafeOutlet } from '../Router/RouterUtils';
import { clearUrlCache } from '../RouterCommands/CacheBuster';
import type { SpecToJson } from '../Syncer';
import { updateXml } from '../Syncer/xmlToString';
import { getOriginalSyncerInput } from '../Syncer/xmlUtils';
import { formEditorRoutes } from './Routes';
import type { ViewSets } from './spec';
import { viewSetsSpec } from './spec';

export function FormEditor(props: AppResourceTabProps): JSX.Element {
  return (
    <XmlEditor
      context={FormEditorContext}
      props={props}
      rootTagName="viewset"
      routes={formEditorRoutes}
      spec={viewSetsSpec()}
    />
  );
}

export type FormEditorOutlet = {
  readonly viewSets: readonly [
    ViewSets,
    (viewSets: ViewSets, changedViewNames: RA<string>) => void,
  ];
  readonly disciplines: RA<SerializedResource<Discipline>>;
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

  const changedRef = React.useRef<ReadonlySet<string>>(new Set());
  const disciplines =
    useOutletContext<AppResourcesOutlet>().getSet[0].disciplines;

  return (
    <SafeOutlet<FormEditorOutlet>
      disciplines={disciplines}
      viewSets={[
        parsed,
        (parsed, changedViewNames): void => {
          changedRef.current = new Set([
            ...changedRef.current,
            ...changedViewNames,
          ]);
          setParsed(parsed);
          handleChange(() => updateXml(deserializer(parsed)));
          handleSetCleanup(async () =>
            Promise.all(
              Array.from(changedRef.current, async (viewName) =>
                clearUrlCache(getViewSetApiUrl(viewName)).then(() =>
                  clearViewLocal(viewName)
                )
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
