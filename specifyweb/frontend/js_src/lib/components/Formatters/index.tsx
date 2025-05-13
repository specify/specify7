import React from 'react';
import type { RouteObject } from 'react-router';
import { useLocation, useRoutes } from 'react-router-dom';

import { useErrorContext } from '../../hooks/useErrorContext';
import { useTriggerState } from '../../hooks/useTriggerState';
import { resourcesText } from '../../localization/resources';
import type { GetOrSet, WritableArray } from '../../utils/types';
import { parseXml } from '../AppResources/parseXml';
import type { AppResourceTabProps } from '../AppResources/TabDefinitions';
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
      context={FormattersContext}
      props={props}
      rootTagName="formatters"
      routes={formattersRoutes}
      spec={formattersSpec()}
    />
  );
}

export type XmlEditorProps<SPEC extends BaseSpec<SimpleXmlNode>> = {
  readonly props: AppResourceTabProps;
  readonly rootTagName: string;
  readonly routes: WritableArray<RouteObject>;
  readonly spec: SPEC;
  readonly context: React.Context<XmlEditorContext<SPEC> | undefined>;
};

export function XmlEditor<SPEC extends BaseSpec<SimpleXmlNode>>({
  context: Context,
  ...rest
}: XmlEditorProps<SPEC>): JSX.Element {
  return (
    <WrappedXmlEditor {...rest}>
      {(props): JSX.Element => (
        <Context.Provider value={props}>
          <RenderRoutes routes={rest.routes} />
        </Context.Provider>
      )}
    </WrappedXmlEditor>
  );
}

function RenderRoutes({
  routes,
}: {
  readonly routes: WritableArray<RouteObject>;
}): JSX.Element {
  const location = useStableLocation(useLocation());
  const jsxElement = useRoutes(routes, location);
  return jsxElement ?? <NotFoundView container={false} />;
}

function WrappedXmlEditor<SPEC extends BaseSpec<SimpleXmlNode>>({
  props,
  rootTagName,
  spec,
  children,
}: Omit<XmlEditorProps<SPEC>, 'context' | 'routes'> & {
  readonly children: (props: XmlEditorContext<SPEC>) => JSX.Element;
}): JSX.Element {
  const xmlNode = React.useMemo(() => {
    const parsed = parseXml(
      props.data === null || props.data.length === 0
        ? `<${rootTagName} />`
        : props.data
    );
    return typeof parsed === 'string' ? parsed : xmlToJson(parsed);
  }, [props.data, rootTagName]);

  const syncer = React.useMemo(() => syncers.object(spec), [spec]);
  const { serializer } = syncer;
  const parsed = useTriggerState(
    React.useMemo(
      () =>
        typeof xmlNode === 'object'
          ? serializer(toSimpleXmlNode(xmlNode))
          : (undefined as never),
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
    children({
      ...props,
      xmlNode,
      syncer,
      parsed,
    })
  );
}

export type XmlEditorContext<SPEC extends BaseSpec<SimpleXmlNode>> = Omit<
  AppResourceTabProps,
  'data'
> & {
  readonly xmlNode: XmlNode;
  readonly syncer: Syncer<SimpleXmlNode, SpecToJson<SPEC>>;
  readonly parsed: GetOrSet<SpecToJson<SPEC>>;
};

export function createXmlContext<SPEC extends BaseSpec<SimpleXmlNode>>(
  spec: SPEC
): React.Context<XmlEditorContext<SPEC> | undefined> {
  void spec;
  const context = React.createContext<XmlEditorContext<SPEC> | undefined>(
    undefined
  );
  context.displayName = 'XmlEditorContext';
  return context;
}

export const FormattersContext = createXmlContext(formattersSpec());
