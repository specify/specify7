import { filterArray } from '../../utils/types';
import { insertItem, replaceItem } from '../../utils/utils';
import { error } from '../Errors/assert';
import { formatXmlNode } from './formatXmlNode';
import type { SimpleChildren, SimpleXmlNode, XmlNode } from './xmlToJson';
import { getOriginalSyncerInput } from './xmlUtils';

/**
 * Apply the changes made to SimpleXmlNode onto the XmlNode
 * (of if XmlNode is undefined, convert SimpleXmlNode to XmlNode)
 */
export const fromSimpleXmlNode = (updated: SimpleXmlNode): XmlNode =>
  formatXmlNode(fromSimpleNode(updated));

const fromSimpleNode = (
  updated: SimpleXmlNode,
  old = getOriginalSyncerInput(updated)
): XmlNode => ({
  type: 'XmlNode',
  tagName:
    old?.tagName ??
    (updated.tagName ||
      error(
        'Unable to retrieve the tag name for a node. \n' +
          'This likely happened because you forgot to use spread operator when ' +
          'mutating the JSON. For example, instead of `const parsed = {webLinks};` ' +
          'do `const parsed = {...oldParsed, webLinks};'
      )),
  attributes: Object.fromEntries(
    filterArray(
      Object.keys({
        ...old?.attributes,
        ...updated.attributes,
      }).map((key) => {
        /*
         * If attribute was explicitly set to undefined, remove it.
         * If attribute is missing from the attributes object, reuse the old
         * value (this would be the case for unknown attributes - those that are
         * not part of the syncer's spec)
         */
        if (key in updated.attributes && updated.attributes[key] === undefined)
          return undefined;
        const value = updated.attributes[key] ?? old?.attributes[key];
        return value === undefined ? undefined : [key.toLowerCase(), value];
      })
    )
  ),
  children: mergeChildren(old?.children ?? [], updated),
});

const mergeChildren = (
  oldChildren: XmlNode['children'],
  newNode: SimpleXmlNode
): XmlNode['children'] =>
  Object.keys(newNode.children).length > 0
    ? mergeNodes(oldChildren, newNode.children)
    : mergeText(oldChildren, newNode.text ?? '');

function mergeText(
  oldChildren: XmlNode['children'],
  string: string
): XmlNode['children'] {
  const textNodes = filterArray(
    oldChildren.map((cell, index) =>
      cell.type === 'Text' ? ([cell, index] as const) : undefined
    )
  );
  const nonEmptyNode = textNodes.find(
    ([child]) => child.string.trim().length > 0
  )?.[1];

  const newChild = { type: 'Text', string } as const;
  return nonEmptyNode === undefined
    ? [...oldChildren, newChild]
    : removeDuplicateText(
        replaceItem(oldChildren, nonEmptyNode, newChild),
        nonEmptyNode
      );
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

function mergeNodes(
  oldChildren: XmlNode['children'],
  newChildren: SimpleChildren
): XmlNode['children'] {
  const writableChildren = Object.fromEntries(
    Object.entries(newChildren).map(
      ([tagName, items]) =>
        [
          tagName,
          items.map((item) => ({
            ...item,
            tagName,
          })),
        ] as const
    )
  );
  /*
   * Try to replace as many as possible rather than removing and adding
   * so as to preserve the order of comments adjacent to the elements
   */
  const replacedChildren = filterArray(
    oldChildren.map((child) => {
      if (child.type !== 'XmlNode') return child;
      const newChildren = writableChildren[child.tagName];
      const newChild = newChildren?.shift();
      /*
       * This happens if child is unknown (i.e, not part of the syncer's spec)
       */
      return newChildren === undefined
        ? child
        : // Child was removed
          newChild === undefined
          ? undefined
          : // Child was modified
            fromSimpleXmlNode(newChild);
    })
  );
  return Object.values(writableChildren)
    .flat()
    .reduce((children, newChild) => {
      /*
       * Insert new nodes after the last child, not at the end of the element.
       * This makes a difference if there are other xml nodes (with a different
       * tag name) or comments after the last matching child
       */
      const insertionIndex = children.findLastIndex(
        (child) =>
          child.type === 'XmlNode' && child.tagName === newChild.tagName
      );
      const newNode = fromSimpleXmlNode(newChild);
      return insertionIndex === -1
        ? [...children, newNode]
        : insertItem(children, insertionIndex + 1, newNode);
    }, replacedChildren);
}
