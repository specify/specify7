/**
 * Very simple and fast XML formatter.
 * Originally based on https://jsfiddle.net/fbn5j7ya/
 */
export function formatXml(
  xmlString: string,
  separator = '\t',
  newLine = '\n'
): string {
  let formatted = '';
  let indent = '';
  const nodes = xmlString.slice(1, -1).split(/>\s*</u);
  if (nodes[0].startsWith('?')) formatted += `<${nodes.shift()!}>${newLine}`;
  nodes.forEach((node) => {
    if (node.startsWith('/')) indent = indent.slice(separator.length);
    formatted += `${indent}<${node}>${newLine}`;
    if (!node.startsWith('/') && !node.endsWith('/') && !node.includes('</'))
      indent += separator;
  });
  return formatted;
}

export const createXmlNode = (name: string): Element =>
  document.implementation.createDocument(null, name).documentElement;

/**
 * Create a new XML element based on an old one, but with a different tagName.
 * Old element is removed.
 * Loosely based on https://stackoverflow.com/a/15086834/8584605
 */
export function renameXmlNode(element: Element, newTagName: string): Element {
  const newElement = createXmlNode(newTagName);
  Array.from(element.children, (child) => newElement.append(child));

  Array.from(element.attributes, (attribute) =>
    newElement.attributes.setNamedItem(attribute.cloneNode() as Attr)
  );

  element.parentNode?.replaceChild(newElement, element);
  element.remove();

  return newElement;
}
