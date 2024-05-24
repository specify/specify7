import React from 'react';

import type { GetSet, RA } from '../../utils/types';
import type { AppResourceTabProps } from '../AppResources/TabDefinitions';
import { createXmlContext, XmlEditor } from '../Formatters';
import { SafeOutlet } from '../Router/RouterUtils';
import { updateXml } from '../Syncer/xmlToString';
import { WebLinkList } from './List';
import { webLinkRoutes } from './Routes';
import type { WebLink } from './spec';
import { webLinksSpec } from './spec';

export function WebLinkEditor(props: AppResourceTabProps): JSX.Element {
  return (
    <XmlEditor
      context={WebLinksContext}
      props={props}
      rootTagName="vector"
      routes={webLinkRoutes}
      spec={webLinksSpec()}
    />
  );
}

export type WebLinkOutlet = {
  readonly items: GetSet<RA<WebLink>>;
};

export function WebLinkEditorWrapper(): JSX.Element {
  const {
    parsed: [parsed, setParsed],
    syncer: { deserializer },
    onChange: handleChange,
  } = React.useContext(WebLinksContext)!;
  const items: GetSet<RA<WebLink>> = [
    parsed.webLinks,
    (webLinks): void => {
      const newParsed = { ...parsed, webLinks };
      setParsed(newParsed);
      handleChange(() => updateXml(deserializer(newParsed)));
    },
  ];
  return (
    <>
      <WebLinkList items={items} />
      <SafeOutlet<WebLinkOutlet> items={items} />
    </>
  );
}

export const WebLinksContext = createXmlContext(webLinksSpec());
