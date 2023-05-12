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
    return newMapped === mapped ? node : toUnparsedNode(newMapped);
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
    ':@': node.attributes,
    '#text': node.text,
    ...(typeof node.tagName === 'string'
      ? { [node.tagName]: node.children }
      : {}),
  } as ParsedDom[number]);
