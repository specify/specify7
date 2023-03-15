import React from 'react';
import type { RouteObject } from 'react-router';
import { useLocation, useRoutes } from 'react-router-dom';

import { useErrorContext } from '../../hooks/useErrorContext';
import { useTriggerState } from '../../hooks/useTriggerState';
import { resourcesText } from '../../localization/resources';
import type { GetOrSet, WritableArray } from '../../utils/types';
import { parseXml } from '../AppResources/codeMirrorLinters';
import type { AppResourceTabProps } from '../AppResources/TabDefinitions';
import { error } from '../Errors/assert';
import { NotFoundView } from '../Router/NotFoundView';
import { useStableLocation } from '../Router/RouterState';
import type { BaseSpec, SpecToJson, Syncer } from '../Syncer';
import { syncers } from '../Syncer/syncers';
import type { SimpleXmlNode, XmlNode } from '../Syncer/xmlToJson';
import { toSimpleXmlNode, xmlToJson } from '../Syncer/xmlToJson';
import { formattersRoutes } from './Routes';
import { formattersSpec } from './spec';

export function DataObjectFormatter(props: AppResourceTabProps): JSX.Element {
  return (
    <XmlEditor
      props={props}
      rootTagName="formatters"
      routes={formattersRoutes}
      spec={formattersSpec()}
      context={FormattersContext}
    />
  );
}

export function XmlEditor<SPEC extends BaseSpec<SimpleXmlNode>>({
  props,
  rootTagName,
  routes,
  spec,
  context: Context,
}: {
  readonly props: AppResourceTabProps;
  readonly rootTagName: string;
  readonly routes: WritableArray<RouteObject>;
  readonly spec: SPEC;
  readonly context: React.Context<XmlEditorContext<SPEC>>;
}): JSX.Element {
  const xmlNode = React.useMemo(() => {
    const parsed = parseXml(
      props.data === null || props.data.length === 0
        ? `<${rootTagName} />`
        : props.data
    );
    return typeof parsed === 'string' ? parsed : xmlToJson(parsed);
  }, [props.data, rootTagName]);
  const location = useStableLocation(useLocation());
  const jsxElement = useRoutes(routes, location);

  const syncer = React.useMemo(() => syncers.object(spec), [spec]);
  const { serializer } = syncer;
  const parsed = useTriggerState(
    React.useMemo(
      () =>
        serializer(
          toSimpleXmlNode(
            typeof xmlNode === 'object'
              ? xmlNode
              : error('Unable to edit invalid XML')
          )
        ),
      [serializer, xmlNode]
    )
  );

  useErrorContext('initialXml', xmlNode);
  useErrorContext('items', parsed[0]);

  return typeof xmlNode === 'string' ? (
    <>
      {resourcesText.failedParsingXml()}
      <pre>{xmlNode}</pre>
    </>
  ) : (
    <Context.Provider
      value={{
        ...props,
        xmlNode,
        syncer,
        parsed,
      }}
    >
      {jsxElement ?? <NotFoundView container={false} />}
    </Context.Provider>
  );
}

export type XmlEditorContext<SPEC extends BaseSpec<SimpleXmlNode>> =
  | (Omit<AppResourceTabProps, 'data'> & {
      readonly xmlNode: XmlNode;
      readonly syncer: Syncer<SimpleXmlNode, SpecToJson<SPEC>>;
      readonly parsed: GetOrSet<SpecToJson<SPEC>>;
    })
  | undefined;

export function createXmlContext<SPEC extends BaseSpec<SimpleXmlNode>>(
  spec: SPEC
): React.Context<XmlEditorContext<SPEC>> {
  void spec;
  const context = React.createContext<XmlEditorContext<SPEC>>(undefined);
  context.displayName = 'XmlEditorContext';
  return context;
}

export const FormattersContext = createXmlContext(formattersSpec());
