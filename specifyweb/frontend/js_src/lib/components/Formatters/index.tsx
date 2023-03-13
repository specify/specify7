import React from 'react';
import { useLocation, useRoutes } from 'react-router-dom';

import { resourcesText } from '../../localization/resources';
import { parseXml } from '../AppResources/codeMirrorLinters';
import type { AppResourceTabProps } from '../AppResources/TabDefinitions';
import { NotFoundView } from '../Router/NotFoundView';
import { useStableLocation } from '../Router/RouterState';
import type { XmlNode } from '../Syncer/xmlToJson';
import { xmlToJson } from '../Syncer/xmlToJson';
import { formattersRoutes } from './Routes';

export function DataObjectFormatter(props: AppResourceTabProps): JSX.Element {
  const xmlNode = React.useMemo(() => {
    const parsed = parseXml(
      props.data === null || props.data.length === 0
        ? '<formatters />'
        : props.data
    );
    return typeof parsed === 'string' ? parsed : xmlToJson(parsed);
  }, [props.data]);
  const location = useStableLocation(useLocation());
  const jsxElement = useRoutes(formattersRoutes, location);

  return typeof xmlNode === 'string' ? (
    <>
      {resourcesText.failedParsingXml()}
      <pre>{xmlNode}</pre>
    </>
  ) : (
    <FormattersContext.Provider
      value={{
        xmlNode,
        ...props,
      }}
    >
      {jsxElement ?? <NotFoundView container={false} />}
    </FormattersContext.Provider>
  );
}

export const FormattersContext = React.createContext<
  | (Omit<AppResourceTabProps, 'data'> & {
      readonly xmlNode: XmlNode;
    })
  | undefined
>(undefined);
FormattersContext.displayName = 'FormattersContext';
