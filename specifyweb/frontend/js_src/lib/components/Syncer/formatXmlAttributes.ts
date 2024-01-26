import type { WritableArray } from '../../utils/types';
import { getIndent } from '../AppResources/EditorComponents';
import { xmlStringTraverse } from './findNodePosition';

const maxLineLength = 80;

/**
 * This assumes xml string was output by XMLSerializer thus most of the
 * formatting has already been done
 */
export function formatXmlAttributes(xml: string): string {
  const updates: WritableArray<{
    readonly start: number;
    readonly end: number;
    readonly replacement: string;
  }> = [];
  const indentCharacter = getIndent();
  xmlStringTraverse(
    xml,
    (match) => {
      const [part] = match;
      const lastNewLine = xml.lastIndexOf('\n', match.index);
      const lineStart = lastNewLine === -1 ? 0 : lastNewLine + '\n'.length;
      const indentString = xml.slice(lineStart, match.index);
      const extraIndent = `${indentString}${indentCharacter}`;
      const lineLength = part.length + indentString.length;
      if (lineLength > maxLineLength)
        updates.push({
          start: match.index,
          end: match.index + part.length,
          replacement: formatTag(part, indentString, extraIndent),
        });
    },
    () => undefined
  );
  return updates.reduceRight(
    (xml, { start, end, replacement }) =>
      `${xml.slice(0, start)}${replacement}${xml.slice(end)}`,
    xml
  );
}

const reTag = /(?<open><\w+)(?<attributes>\s[^/>]*)?(?<close>\/?>)/u;

function formatTag(part: string, indent: string, extraIndent: string): string {
  const match = reTag.exec(part);
  if (match === null) return part;
  const { open, attributes = '', close } = match.groups!;
  if (attributes.length === 0) return part;
  return `${open}${formatAttributes(
    attributes,
    extraIndent
  )}\n${indent}${close}`;
}

const reAttribute = /\s[^=]+="[^"]*"/gu;

const formatAttributes = (part: string, indent: string): string =>
  part.replaceAll(reAttribute, (match) => `\n${indent}${match.trim()}`);
