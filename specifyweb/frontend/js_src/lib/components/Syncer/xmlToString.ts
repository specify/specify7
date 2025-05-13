import { userPreferences } from '../Preferences/userPreferences';
import { formatXmlAttributes } from './formatXmlAttributes';
import { fromSimpleXmlNode } from './fromSimpleXmlNode';
import type { SimpleXmlNode } from './xmlToJson';
import { jsonToXml } from './xmlToJson';

/**
 * Handles being called with the Document or with the root element
 * Adds XML declaration, but only if not already present
 * Converts `<a></a>` to `<a />`
 * Splits attributes into multiple lines for long lines
 */
export function xmlToString(xml: Node, insertDeclaration = true): string {
  const document =
    xml.ownerDocument === null ? (xml as Document) : xml.ownerDocument;
  const isRoot =
    xml.ownerDocument === null ||
    xml.parentNode === document ||
    xml.parentElement === xml.ownerDocument.documentElement;
  if (isRoot) {
    const hasXmlDeclaration =
      document.firstChild instanceof ProcessingInstruction &&
      document.firstChild.target === 'xml';
    if (!hasXmlDeclaration && insertDeclaration) {
      const processingInstruction = document.createProcessingInstruction(
        'xml',
        'version="1.0" encoding="UTF-8"'
      );
      document.insertBefore(processingInstruction, document.firstChild);
    }
  }
  /*
   * If element to be serialized is the root element, then serialize the
   * document element instead (this way XML declaration would be included)
   */
  const element = isRoot ? document : xml;
  return postProcessXml(new XMLSerializer().serializeToString(element));
}

/** Convert `<a></a>` to `<a />` */
const reEmptyTag = /<(?<name>[^\s/>]+)(?<attributes>[^<>]*)><\/\k<name>>/gu;

export function postProcessXml(xml: string): string {
  // Insert new line after XML Declaration
  const formatted = xml
    .replace(/^<\?xml.*?\?>\n?/u, (match) => `${match.trim()}\n`)
    // Use self-closing tags for empty elements
    .replaceAll(reEmptyTag, '<$<name>$<attributes> />');
  // Split attributes into multiple lines for long lines
  return userPreferences.get('appResources', 'behavior', 'splitLongXml')
    ? formatXmlAttributes(formatted)
    : formatted;
}

/**
 * Given original parsed XML and an array of updates, apply the updates and
 * covert it all back to XML string
 */
export const updateXml = (updated: SimpleXmlNode): string =>
  xmlToString(jsonToXml(fromSimpleXmlNode(updated)));
