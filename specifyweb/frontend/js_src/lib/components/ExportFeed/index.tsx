import React from 'react';

import type { GetSet } from '../../utils/types';
import type { AppResourceTabProps } from '../AppResources/TabDefinitions';
import { createXmlContext, XmlEditor } from '../Formatters';
import { toReactRoutes } from '../Router/RouterUtils';
import { updateXml } from '../Syncer/xmlToString';
import { ExportFeedEditor } from './Editor';
import type { ExportFeedDefinition } from './spec';
import { exportFeedSpec } from './spec';

export function RssExportFeedEditor(props: AppResourceTabProps): JSX.Element {
  return (
    <XmlEditor
      context={RssExportFeedContext}
      props={props}
      rootTagName="channel"
      routes={exportFeedRoutes}
      spec={exportFeedSpec()}
    />
  );
}

const exportFeedRoutes = toReactRoutes([
  {
    index: true,
    element: <Editor />,
  },
]);

function Editor(): JSX.Element {
  const {
    parsed: [parsed, setParsed],
    syncer: { deserializer },
    onChange: handleChange,
  } = React.useContext(RssExportFeedContext)!;
  const definition: GetSet<ExportFeedDefinition> = [
    parsed,
    (definition): void => {
      setParsed(definition);
      handleChange(() => updateXml(deserializer(definition)));
    },
  ];
  return <ExportFeedEditor definition={definition} />;
}

export const RssExportFeedContext = createXmlContext(exportFeedSpec());
