import React from 'react';
import { useLocation, useRoutes } from 'react-router-dom';

import { resourcesText } from '../../localization/resources';
import { parseXml } from '../AppResources/codeMirrorLinters';
import type { AppResourceTabProps } from '../AppResources/TabDefinitions';
import { NotFoundView } from '../Router/NotFoundView';
import { useStableLocation } from '../Router/RouterState';
import { createXmlNode } from '../Syncer/xmlUtils';
import { formattersRoutes } from './Routes';

export function DataObjectFormatter(props: AppResourceTabProps): JSX.Element {
  const element = React.useMemo(
    () =>
      props.data === null ? createXmlNode('formatters') : parseXml(props.data),
    [props.data]
  );
  const location = useStableLocation(useLocation());
  const jsxElement = useRoutes(formattersRoutes, location);

  return typeof element === 'string' ? (
    <>
      {resourcesText.failedParsingXml()}
      <pre>{element}</pre>
    </>
  ) : (
    <FormattersContext.Provider
      value={{
        element,
        ...props,
      }}
    >
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
