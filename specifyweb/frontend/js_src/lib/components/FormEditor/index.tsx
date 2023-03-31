import React from 'react';

import { useLiveState } from '../../hooks/useLiveState';
import type { GetSet } from '../../utils/types';
import { filterArray } from '../../utils/types';
import type { AppResourceTabProps } from '../AppResources/TabDefinitions';
import { createXmlContext, XmlEditor } from '../Formatters';
import { SafeOutlet } from '../Router/RouterUtils';
import { fromSimpleXmlNode } from '../Syncer/fromSimpleXmlNode';
import { createSimpleXmlNode, jsonToXml } from '../Syncer/xmlToJson';
import { xmlToString } from '../Syncer/xmlUtils';
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
    parsed: [initialParsed],
    syncer: { deserializer },
    onChange: handleChange,
  } = React.useContext(FormEditorContext)!;

  const originalParsed = React.useRef<ViewSets | undefined>(undefined);

  // FIXME: add tests
  /**
   * The syncer library is not great at one thing:
   * Giving you access to raw xml node. When I was designing it, I didn't consider
   * such need. It turned out to be needed because we want an xml editor for
   * a form definition.
   * Syncer provides a way to access SimpleXmlNode, but we need XmlNode (as the
   * latter keeps the comments, which are commonly used in form definitions)
   * This ugly adds a "raw" prop for each viewDef with the XmlNode
   */
  const [parsed, setParsed] = useLiveState<ViewSets>(
    React.useCallback(() => {
      const rawViewDefs = xmlNode.children.find(
        (node) => node.type === 'XmlNode' && node.tagName === 'viewdefs'
      );
      const indexedViewDefs =
        rawViewDefs?.type === 'XmlNode'
          ? filterArray(
              rawViewDefs.children.map((node) =>
                node.type === 'XmlNode' && node.tagName === 'viewdef'
                  ? node
                  : undefined
              )
            )
          : [];
      if (initialParsed.viewDefs.length !== indexedViewDefs.length)
        throw new Error(
          'Unable to attach raw form definitions to parsed form definitions'
        );
      const withRaw = {
        ...initialParsed,
        viewDefs: initialParsed.viewDefs.map((definition, index) => ({
          ...definition,
          // Add XmlNode
          raw: indexedViewDefs[index],
        })),
      };
      originalParsed.current = withRaw;
      return withRaw;
    }, [xmlNode, initialParsed])
  );
  // FIXME: add tests for JSON editor of forms

  // FIXME: add tests
  /**
   * The big block above added raw XmlNode to each viewDef
   * This block below runs the syncer on the whole document, then adds
   * modified XmlNode to each viewDef, and finally converts it all back to XML
   * string
   */
  const viewSets: GetSet<ViewSets> = [
    parsed,
    (parsed): void => {
      setParsed(parsed);
      // FIXME: detect modified views and clean their cache on save
      handleChange(() => {
        const newXmlNode = fromSimpleXmlNode(
          xmlNode,
          deserializer({
            ...parsed,
            viewDefs: parsed.viewDefs.map((definition) => ({
              ...definition,
              /*
               * Run the syncer with a blank raw. "raw" is part of the syncer
               * just for the JSON editor
               */
              raw: createSimpleXmlNode('viewDef'),
            })),
          })
        );
        const updatedNode =
          newXmlNode.type === 'XmlNode'
            ? {
                ...newXmlNode,
                children: newXmlNode.children.map((node) => {
                  if (node.type !== 'XmlNode' || node.tagName !== 'viewdefs')
                    return node;
                  if (node.children.length !== parsed.viewDefs.length)
                    throw new Error(
                      'Unable to attach raw form definitions to parsed form definitions'
                    );
                  return {
                    ...node,
                    children: node.children.map((child, index) =>
                      child.type === 'XmlNode' && child.tagName === 'viewdef'
                        ? {
                            ...child,
                            children: parsed.viewDefs[index].raw.children,
                          }
                        : child
                    ),
                  };
                }),
              }
            : newXmlNode;
        return xmlToString(jsonToXml(updatedNode));
      });
    },
  ];
  return <SafeOutlet<FormEditorOutlet> viewSets={viewSets} />;
}

export const FormEditorContext = createXmlContext(viewSetsSpec());
