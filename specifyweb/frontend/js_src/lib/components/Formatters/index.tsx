import React from 'react';
import { resourcesText } from '../../localization/resources';
import { parseXml } from '../AppResources/codeMirrorLinters';
import type { AppResourceTabProps } from '../AppResources/TabDefinitions';
import { createXmlNode } from '../Syncer/xmlUtils';
import { useLocation, useRoutes } from 'react-router-dom';
import { formattersRoutes } from './Routes';
import { NotFoundView } from '../Router/NotFoundView';
import { useStableLocation } from '../Router/RouterState';

export function DataObjectFormatter(props: AppResourceTabProps): JSX.Element {
  const payload = React.useMemo(() => {
    const { data, ...rest } = props;
    const element =
      data === null ? createXmlNode('formatters') : parseXml(data);
    return typeof element === 'string'
      ? element
      : {
          ...rest,
          element,
        };
  }, [props]);
  const location = useStableLocation(useLocation());
  const jsxElement = useRoutes(formattersRoutes, location);

  return typeof payload === 'string' ? (
    <>
      {resourcesText.failedParsingXml()}
      <pre>{payload}</pre>
    </>
  ) : (
    <FormattersContext.Provider value={payload}>
      {jsxElement ?? <NotFoundView container={false} />}
    </FormattersContext.Provider>
  );
}

export const FormattersContext = React.createContext<
  | (Omit<AppResourceTabProps, 'data'> & {
      readonly element: Element;
    })
  | undefined
>(undefined);
FormattersContext.displayName = 'FormattersContext';
