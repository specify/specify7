import type { RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { group } from '../../utils/utils';
import type { SimpleXmlNode } from './xmlToJson';

/**
 * Do basic merging of multiple SimpleXmlNode
 */
export const mergeSimpleXmlNodes = (
  specs: RA<SimpleXmlNode>
): SimpleXmlNode => ({
  type: 'SimpleXmlNode',
  tagName: specs[0]?.tagName ?? '',
  attributes: mergeAttributes(specs.map((spec) => spec.attributes ?? {})),
  ...mergeContent(specs),
});

const mergeAttributes = (
  attributes: RA<SimpleXmlNode['attributes']>
): SimpleXmlNode['attributes'] =>
  Object.fromEntries(
    attributes.flatMap((attributes) =>
      Object.entries(attributes).map(([name, value]) => [name, value] as const)
    )
  );

function mergeContent(
  content: RA<SimpleXmlNode>
): Pick<SimpleXmlNode, 'children' | 'text'> {
  const textContent = filterArray(content.map(({ text }) => text));
  const nodeContent = content
    .map(({ children }) => children)
    .filter((children) => Object.keys(children).length > 0);
  if (textContent.length === 0)
    return {
      text: undefined,
      children: Object.fromEntries(
        group(nodeContent.flatMap((content) => Object.entries(content))).map(
          ([key, values]) => [key, values.flat()]
        )
      ),
    };
  else {
    if (nodeContent.length > 0)
      throw new Error(
        "Can't merge nodes that contain both text and node children"
      );
    return { text: textContent.join(' ').trim(), children: {} };
  }
}
