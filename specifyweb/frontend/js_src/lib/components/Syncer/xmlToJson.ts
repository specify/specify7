import type { State } from 'typesafe-reducer';

import type { IR, RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { group } from '../../utils/utils';
import { error } from '../Errors/assert';
import { setOriginalSyncerInput } from './xmlUtils';

export type XmlNode = State<
  'XmlNode',
  {
    readonly tagName: string;
    readonly attributes: IR<string>;
    readonly children: RA<Comment | Text | XmlNode>;
  }
>;

type Comment = State<'Comment', { readonly comment: string }>;
type Text = State<'Text', { readonly string: string }>;

/**
 * Convert a mutable XML element to immutable JSON
 */
export const xmlToJson = (element: Element): XmlNode => ({
  type: 'XmlNode',
  tagName: element.tagName,
  attributes: Object.fromEntries(
    Array.from(element.attributes, (attribute) => [
      attribute.name.toLowerCase(),
      attribute.value,
    ])
  ),
  children: Array.from(element.childNodes, (node) =>
    node instanceof Comment
      ? {
          type: 'Comment',
          comment: node.data,
        }
      : node instanceof Text
      ? {
          type: 'Text',
          string: node.data,
        }
      : node instanceof Element
      ? xmlToJson(node)
      : error('Unknown element type', node)
  ),
});

/**
 * Reverse conversion to JSON
 */
export function jsonToXml(node: XmlNode): Element {
  const xmlDocument = document.implementation.createDocument(null, null);
  const element = xmlDocument.createElement(node.tagName);
  xmlDocument.append(element);
  Object.entries(node.attributes).forEach(([name, value]) =>
    value === undefined ? undefined : element.setAttribute(name, value)
  );
  node.children.forEach((child) =>
    element.append(
      child.type === 'Text'
        ? xmlDocument.createTextNode(child.string)
        : child.type === 'Comment'
        ? xmlDocument.createComment(child.comment)
        : jsonToXml(child)
    )
  );
  return element;
}

/**
 * Like XmlNode, but even easier to work with, thanks to the following
 * assumptions:
 * - Node can have either text content, or children nodes, but not both
 * - Nodes that have text content, can not have comments in between text content
 *   (i.e `<node>text<!--comment-->text</node>`)
 *   However, whitespace is allowed: `<node>    <!--comment-->text</node>`
 * - Text content can have leading and trailing whitespace trimmed without
 *   affecting semantics
 * - The order of children of the same tagName matters, but the order of
 *   children of different tagNames does not matter
 *
 * Behavior to keep in mind:
 * - When merging SortedXmlNode back with XmlNode, the attributes in XmlNode
 *   are kept, unless they are explicitly set to undefined in "updated".
 *   Similarly, all children in XmlNode are kept, unless there is an explicit
 *   entry for that key in content.children object.
 * - Comment notes are never included in SimpleXmlNode as it's assumed they are
 *   never modified by it. Merging SimpleXmlNode back into XmlNode preserves
 *   the comments
 * - When converting to SimpleXmlNode, both lower case and camel case versions
 *   of attributes and tag names are accepted. When converting back, attributes
 *   are converted to lower case, but tag names are left as is.
 */
export type SimpleXmlNode = State<
  'SimpleXmlNode',
  {
    readonly tagName: string;
    readonly attributes: IR<string | undefined>;
    readonly text: string | undefined;
    readonly children: IR<RA<SimpleXmlNode>>;
  }
>;

export type SimpleChildren = IR<RA<SimpleXmlNode>>;

/**
 * Convert jsonified XML into a simpler format that is easier to work with
 * (but with some constraints - see definition of SimpleXmlNode)
 */
export function toSimpleXmlNode(node: XmlNode): SimpleXmlNode {
  const children = filterArray(
    node.children.map((node) => (node.type === 'XmlNode' ? node : undefined))
  );
  const textContent = filterArray(
    node.children.map((node) =>
      node.type === 'Text' ? node.string : undefined
    )
  );
  if (children.length === 0) {
    const string = textContent.join(' ').trim();
    if (string.length > 0)
      return setOriginalSyncerInput(
        {
          type: 'SimpleXmlNode',
          tagName: node.tagName,
          attributes: node.attributes,
          text: string,
          children: {},
        },
        node
      );
  }
  return setOriginalSyncerInput(
    {
      type: 'SimpleXmlNode',
      tagName: node.tagName,
      attributes: node.attributes,
      text: undefined,
      children: Object.fromEntries(
        group(children.map((node) => [node.tagName, toSimpleXmlNode(node)]))
      ),
    },
    node
  );
}

export const createSimpleXmlNode = (tagName: string = ''): SimpleXmlNode => ({
  type: 'SimpleXmlNode',
  tagName,
  attributes: {},
  text: undefined,
  children: {},
});
