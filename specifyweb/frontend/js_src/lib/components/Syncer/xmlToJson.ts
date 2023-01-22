import type { State } from 'typesafe-reducer';

import type { IR, RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { group, insertItem, replaceItem } from '../../utils/utils';
import { error } from '../Errors/assert';

type XmlNode = State<
  'XmlNode',
  {
    readonly tagName: string;
    readonly attributes: IR<string>;
    readonly children: RA<Comment | Text | XmlNode>;
  }
>;

type Comment = State<'Comment', { readonly comment: string }>;
type Text = State<'Text', { readonly string: string }>;

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

export function jsonToXml(node: XmlNode): Element {
  const element = document.createElement(node.tagName);
  Object.entries(node.attributes).forEach(([name, value]) =>
    value === undefined ? undefined : element.setAttribute(name, value)
  );
  node.children.forEach((child) =>
    element.append(
      child.type === 'Text'
        ? document.createTextNode(child.string)
        : child.type === 'Comment'
        ? document.createComment(child.comment)
        : jsonToXml(child)
    )
  );
  return element;
}

/**
 * Like XmlNode, but even easier to work with, thanks to the following
 * assumptions:
 * - Comment notes are never included in SortedXmlNode as it's assumed they are
 *   never modified by it.
 * - All attributes and tagNames are case-insensitive (thus converted to lower
 *   case)
 * - Node can have either text content, or children nodes, but not both
 * - Nodes that have text content, can not have comments in between text content
 *   (i.e `<node>text<!--comment-->text</node>`)
 *   However, whitespace is allowed: `<node>    <!--comment-->text</node>`
 * - Text content can have leading and trailing whitespace trimmed without
 *   affecting semantics
 * - The order of children of the same tagName matters, but the order of
 *   children of different tagNames does not matter
 * - When merging SortedXmlNode back with XmlNode, the attributes in XmlNode
 *   are kept, unless they are explicitly set to undefined in "updated".
 */
export type SimpleXmlNode = State<
  'SimpleXmlNode',
  {
    readonly tagName: string;
    readonly attributes: IR<string | undefined>;
    readonly content: SimpleChildren | Text;
  }
>;

type SimpleChildren = State<
  'Children',
  { readonly children: IR<RA<SimpleXmlNode>> }
>;

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
      return {
        type: 'SimpleXmlNode',
        tagName: node.tagName,
        attributes: node.attributes,
        content: {
          type: 'Text',
          string,
        },
      };
  }
  return {
    type: 'SimpleXmlNode',
    tagName: node.tagName,
    attributes: node.attributes,
    content: {
      type: 'Children',
      children: Object.fromEntries(
        group(children.map((node) => [node.tagName, toSimpleXmlNode(node)]))
      ),
    },
  };
}

/*
 * FIXME: a way to apply updates to xml
 * FIXME: a way to resolve xml node position to original position in the source
 * FIXME: a way to keep track of path (both json and xml)
 */

export const fromSimpleXmlNode = (
  old: XmlNode | undefined,
  updated: SimpleXmlNode
): XmlNode => formatXmlNode(fromSimpleNode(old, updated));

const fromSimpleNode = (
  old: XmlNode | undefined,
  updated: SimpleXmlNode
): XmlNode => ({
  type: 'XmlNode',
  tagName: updated.tagName,
  attributes: Object.fromEntries(
    filterArray(
      Object.keys({
        ...old?.attributes,
        ...updated.attributes,
      }).map((key) =>
        key in updated.attributes && updated.attributes[key] === undefined
          ? undefined
          : [key.toLowerCase(), updated.attributes[key] ?? old!.attributes[key]]
      )
    )
  ),
  children: mergeChildren(old?.children ?? [], updated.content),
});

function mergeChildren(
  oldChildren: XmlNode['children'],
  newChildren: SimpleXmlNode['content']
): XmlNode['children'] {
  if (newChildren.type === 'Text') {
    const textNodes = filterArray(
      oldChildren.map((cell, index) =>
        cell.type === 'Text' ? ([cell, index] as const) : undefined
      )
    );
    const nonEmptyNode = textNodes.find(
      ([child]) => child.string.trim().length > 0
    )?.[1];

    return nonEmptyNode === undefined
      ? [...oldChildren, newChildren]
      : removeDuplicateText(
          replaceItem(oldChildren, nonEmptyNode, newChildren),
          nonEmptyNode
        );
  } else {
    const writableChildren = Object.fromEntries(
      Object.entries(newChildren.children).map(
        ([tagName, items]) => [tagName, Array.from(items)] as const
      )
    );
    const replacedChildren = filterArray(
      oldChildren.map((child) => {
        if (child.type !== 'XmlNode') return child;
        const newChildren = writableChildren[child.tagName];
        const newChild = newChildren?.shift();
        return newChild === undefined
          ? undefined
          : fromSimpleXmlNode(child, newChild);
      })
    );
    return Object.values(writableChildren)
      .flat()
      .reduce((children, newChild) => {
        const insertionIndex = children.findLastIndex(
          (child) =>
            child.type === 'XmlNode' && child.tagName === newChild.tagName
        );
        const newNode = fromSimpleXmlNode(undefined, newChild);
        return insertionIndex === -1
          ? [...children, newNode]
          : insertItem(children, insertionIndex + 1, newNode);
      }, replacedChildren);
  }
}

/**
 * If there was a comment in between text nodes, that information is
 * lost and all text nodes are concatenated into a single node.
 * Thus, need to make sure to remove all other text nodes
 */
const removeDuplicateText = (
  nodes: XmlNode['children'],
  insertedNode: number
): XmlNode['children'] =>
  nodes.filter(
    (node, index) =>
      index === insertedNode ||
      node.type !== 'Text' ||
      node.string.trim().length === 0
  );

export const formatXmlNode = (
  node: XmlNode,
  indentation: string = ''
): XmlNode => ({
  ...node,
  children: formatXmlChildren(node.children, indentation),
});

const indent = '\t';

const formatXmlChildren = (
  children: XmlNode['children'],
  indentation: string
): XmlNode['children'] =>
  trimTextNodes([
    ...children
      .map((child) =>
        child.type === 'Text'
          ? { ...child, string: child.string.trim() }
          : child.type === 'XmlNode'
          ? formatXmlNode(child, `${indentation}${indent}`)
          : child
      )
      .flatMap((child) => [
        {
          type: 'Text',
          string: `\n${indentation}${indent}`,
        } as const,
        child,
      ]),
    {
      type: 'Text',
      string: `\n${indentation}`,
    } as const,
  ]);

const trimTextNodes = (children: XmlNode['children']): XmlNode['children'] =>
  removeWhitespaceNode(
    children.reduce<XmlNode['children']>((children, child) => {
      const lastChild = children.at(-1);
      if (lastChild?.type === 'Text' && child.type === 'Text') {
        const joinedString = `${lastChild.string}${child.string}`;
        return [
          ...children.slice(0, -1),
          {
            ...lastChild,
            string: joinedString.trim() === '' ? child.string : joinedString,
          },
        ];
      } else return [...children, child];
    }, [])
  );

function removeWhitespaceNode(
  children: XmlNode['children']
): XmlNode['children'] {
  if (children.length === 1 && children[0].type === 'Text') {
    if (children[0].string.trim().length === 0) return [];
    return [
      {
        ...children[0],
        string: children[0].string.trim(),
      },
    ];
  } else if (
    children.length === 3 &&
    children[1].type !== 'XmlNode' &&
    children[0].type === 'Text' &&
    children[2].type === 'Text' &&
    children[0].string.trim().length === 0 &&
    children[2].string.trim().length === 0
  )
    return [children[1]];
  else return children;
}
