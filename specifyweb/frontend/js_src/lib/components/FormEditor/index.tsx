import React from 'react';

import { useLiveState } from '../../hooks/useLiveState';
import type { GetSet } from '../../utils/types';
import { defined } from '../../utils/types';
import type { AppResourceTabProps } from '../AppResources/TabDefinitions';
import { createXmlContext, XmlEditor } from '../Formatters';
import { SafeOutlet } from '../Router/RouterUtils';
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
  readonly viewSets: GetSet<ViewSets>;
};

export function FormEditorWrapper(): JSX.Element {
  const {
    parsed: [initialParsed],
    syncer: { deserializer },
    onChange: handleChange,
  } = React.useContext(FormEditorContext)!;

  const originalParsed = React.useRef<ViewSets | undefined>(undefined);

  const [parsed, setParsed] = useLiveState<ViewSets>(
    React.useCallback(() => {
      originalParsed.current = injectRawXml(initialParsed);
      return originalParsed.current;
    }, [initialParsed])
  );

  const viewSets: GetSet<ViewSets> = [
    parsed,
    (parsed): void => {
      setParsed(parsed);
      handleChange(() =>
        // FIXME: detect modified views and clean their cache on save
        updateXml(deserializer(parsed))
      );
    },
  ];
  return <SafeOutlet<FormEditorOutlet> viewSets={viewSets} />;
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
    raw: {
      ...defined(
        getOriginalSyncerInput(definition),
        'Unable to attach raw form definitions to parsed form definitions'
      ),
      attributes: {},
    },
  })),
});

export const exportsForTests = { injectRawXml };
