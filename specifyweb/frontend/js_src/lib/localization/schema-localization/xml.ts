import type {
  X2jOptionsOptional,
  XmlBuilderOptionsOptional,
} from 'fast-xml-parser';
import { XMLBuilder, XMLParser } from 'fast-xml-parser';

import { postProcessXml } from '../../components/Syncer/xmlToString';
import type { IR, RA } from '../../utils/types';

export type ParsedDom = RA<
  Partial<{
    readonly [tagName: string]: ParsedDom;
  }> & {
    readonly '#text'?: boolean | number | string;
    readonly ':@'?: {
      readonly [ATTRIBUTE in `@_${string}`]: string;
    };
  }
>;

export type ParsedNode = {
  readonly attributes: IR<string>;
  readonly text: boolean | number | string | undefined;
  readonly tagName: string | undefined;
  readonly children: ParsedDom | undefined;
};

/**
 * Recursively traverse the DOM and apply mapper to each node.
 */
export const traverseDom = (
  dom: ParsedDom,
  mapper: (
    path: RA<ParsedNode>,
    dom: ParsedNode,
    rawNode: ParsedDom[number]
  ) => ParsedNode,
  path: RA<ParsedNode> = []
): ParsedDom =>
  dom.map((node) => {
    const parsedNode = toParsedNode(node);
    const mappedChildren =
      parsedNode.children === undefined
        ? undefined
        : traverseDom(parsedNode.children, mapper, [...path, parsedNode]);
    const mapped = {
      ...parsedNode,
      children: mappedChildren,
    };
    const newMapped = mapper(path, mapped, node);
    return newMapped === mapped && parsedNode.children === mappedChildren
      ? node
      : toUnparsedNode(newMapped);
  });

export function toParsedNode(node: ParsedDom[number]): ParsedNode {
  const { ':@': attributes = {}, '#text': text, ...rest } = node;
  const tagName = Object.keys(rest)[0];
  const children = rest[tagName];
  return {
    attributes,
    text,
    tagName,
    children,
  };
}

export const toUnparsedNode = (node: ParsedNode): ParsedDom[number] =>
  ({
    ...(Object.keys(node.attributes).length > 0
      ? { ':@': node.attributes }
      : {}),
    ...(node.text === undefined ? {} : { '#text': node.text }),
    ...(typeof node.tagName === 'string'
      ? { [node.tagName]: node.children }
      : {}),
  }) as ParsedDom[number];

/**
 * It's important to use the same setting for parser and builder
 */
const parserBuilderSettings: Pick<
  XmlBuilderOptionsOptional,
  keyof X2jOptionsOptional & keyof XmlBuilderOptionsOptional
> = {
  ignoreAttributes: false,
  preserveOrder: true,
  commentPropName: '#comment',
};

/**
 * XML parser to use when running in Node.js
 * If in browser, use parseXml() instead
 */
export function nodeParseXml(xmlString: string): ParsedDom {
  const parser = new XMLParser({ ...parserBuilderSettings });
  return parser.parse(xmlString);
}

/**
 * XML builder to use when running in Node.js
 * If in browser, use xmlToString() instead
 */
export function nodeUnparseXml(dom: ParsedDom): string {
  const parser = new XMLBuilder({
    ...parserBuilderSettings,
    format: true,
    suppressUnpairedNode: true,
  });
  return postProcessXml(parser.build(dom) as string);
}
