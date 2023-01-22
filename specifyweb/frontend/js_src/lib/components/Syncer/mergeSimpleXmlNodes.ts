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
  tagName: specs[0].tagName,
  attributes: mergeAttributes(specs.map((spec) => spec.attributes ?? {})),
  content: mergeContent(specs.map((spec) => spec.content)),
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
  content: RA<SimpleXmlNode['content']>
): SimpleXmlNode['content'] {
  const textContent = filterArray(
    content.map((content) =>
      content.type === 'Text' ? content.string : undefined
    )
  );
  const nodeContent = filterArray(
    content.map((content) =>
      content.type === 'Children' ? content.children : undefined
    )
  ).filter((children) => Object.keys(children).length > 0);
  if (textContent.length === 0)
    return {
      type: 'Children',
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
    return { type: 'Text', string: textContent.join(' ').trim() };
  }
}
