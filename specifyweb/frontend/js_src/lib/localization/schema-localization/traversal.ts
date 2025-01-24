import type { IR, R } from '../../utils/types';
import type { ParsedDom, ParsedNode } from './xml';
import { toParsedNode, toUnparsedNode, traverseDom } from './xml';

export type SchemaLocation = {
  readonly tableName: string;
  readonly fieldName: string | undefined;
  readonly type: 'description' | 'name';
};

export const traverseSchema = (
  dom: ParsedDom,
  callback: (location: SchemaLocation, entries: IR<string>) => IR<string>
): ParsedDom =>
  traverseDom(dom, (path, typeNode, rawNode) => {
    // Check if we are in a field name or field description
    const type =
      typeNode?.tagName === 'names'
        ? 'name'
        : typeNode?.tagName === 'descs'
          ? 'description'
          : undefined;
    if (type === undefined) return typeNode;

    // Get field name and table name
    const parent = path.at(-1);
    const container = path.at(-3);
    const fieldName =
      parent?.tagName === 'desc' ? extractNodeName(parent) : undefined;
    const resolvedContainer =
      typeof fieldName === 'string' ? container : parent;
    const tableName =
      resolvedContainer?.tagName === 'container'
        ? extractNodeName(resolvedContainer)
        : undefined;
    if (tableName === undefined) return typeNode;

    const entries: R<string> = {};
    traverseParent(rawNode, (code, text) => {
      entries[code] = text;
      return text;
    });

    const updatedEntries = callback(
      {
        tableName,
        fieldName,
        type,
      },
      entries
    );

    if (updatedEntries === entries) return typeNode;

    const updates = Object.entries(updatedEntries).filter(
      ([key, value]) => value !== entries[key]
    );
    if (updates.length === 0) return typeNode;

    const newEntries = updates.filter(
      ([key, value]) => !(key in entries) && value !== ''
    );

    const updatedNode = traverseParent(
      rawNode,
      (code, text) => updatedEntries[code] ?? text
    );

    return {
      ...updatedNode,
      children: [
        ...(updatedNode.children ?? []),
        ...newEntries.map(([code, text]) => entryToNode(code, text)),
      ],
    };
  });

function extractNodeName(node: ParsedNode | undefined): string | undefined {
  const tableName = node?.attributes['@_name']?.trim() ?? '';
  return tableName === '' ? undefined : tableName;
}

const traverseParent = (
  node: ParsedDom[number],
  callback: (code: string, text: string) => string
): ParsedNode =>
  toParsedNode(
    traverseDom([node], (path, node) => {
      // Check we are in a text node
      const text =
        typeof node.text === 'string' ? (node.text?.trim() ?? '') : '';
      if (text === '' || path.at(-1)?.tagName !== 'text') return node;

      // Reconstruct weblate language code
      const string = path.at(-2);
      if (string?.tagName !== 'str') return node;
      const { '@_language': language = '', '@_country': country = '' } =
        string.attributes;
      if (language === '') return node;
      const code = `${language.trim()}${
        country === '' ? '' : `_${country.trim().toUpperCase()}`
      }`;

      const updatedText = callback(code, text);
      return updatedText === node.text
        ? node
        : {
            ...node,
            text: updatedText,
          };
    })[0]
  );

function entryToNode(code: string, text: string): ParsedDom[number] {
  const [language, country] = code.split('_');
  return toUnparsedNode({
    attributes: {
      '@_language': language,
      ...(country === undefined ? {} : { '@_country': country }),
    },
    text: undefined,
    tagName: 'str',
    children: [
      toUnparsedNode({
        attributes: {},
        text: undefined,
        tagName: 'version',
        children: [
          toUnparsedNode({
            attributes: {},
            text: 0,
            tagName: undefined,
            children: [],
          }),
        ],
      }),
      toUnparsedNode({
        attributes: {},
        text: undefined,
        tagName: 'text',
        children: [
          toUnparsedNode({
            attributes: {},
            text,
            tagName: undefined,
            children: [],
          }),
        ],
      }),
      toUnparsedNode({
        attributes: {
          '@_reference': '../../..',
        },
        text: undefined,
        tagName: 'itemName',
        children: [],
      }),
      toUnparsedNode({
        attributes: {
          '@_reference': '../../..',
        },
        text: undefined,
        tagName: 'itemDesc',
        children: [],
      }),
    ],
  });
}
