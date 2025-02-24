import type { XmlNode } from './xmlToJson';

/**
 * When "mergeChildren" adds new children, it doesn't add proper indentation
 * for them. This takes care of that
 */
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

/**
 * Remove redundant whitespace-only text nodes
 */
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
