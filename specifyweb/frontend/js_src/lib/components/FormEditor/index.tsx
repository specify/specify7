import React from 'react';

import type { GetSet } from '../../utils/types';
import type { AppResourceTabProps } from '../AppResources/TabDefinitions';
import { createXmlContext, XmlEditor } from '../Formatters';
import { SafeOutlet } from '../Router/RouterUtils';
import { updateXml } from '../Syncer/xmlToJson';
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
    xmlNode,
    parsed: [parsed, setParsed],
    syncer: { deserializer },
    onChange: handleChange,
  } = React.useContext(FormEditorContext)!;
  const viewSets: GetSet<ViewSets> = [
    parsed,
    (parsed): void => {
      setParsed(parsed);
      handleChange(() => updateXml(xmlNode, deserializer(parsed)));
    },
  ];
  return <SafeOutlet<FormEditorOutlet> viewSets={viewSets} />;
}

export const FormEditorContext = createXmlContext(viewSetsSpec());
