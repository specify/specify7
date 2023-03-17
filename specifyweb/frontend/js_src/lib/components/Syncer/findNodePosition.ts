import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import type { LogPathPart } from '../Errors/logContext';

type Position = {
  readonly from: number;
  readonly to: number;
};

export function findNodePosition(xml: string, path: RA<LogPathPart>): Position {
  const element = findElement(xml, path);
  return {
    from: element.from,
    to: Math.max(element.from, element.to),
  };
}

const findElement = (xml: string, path: RA<LogPathPart>): Position =>
  path.reduce<Position & { readonly tagName?: string }>(
    (parent, part) => {
      const { from, tagName } = parent;
      if (part.type === 'Root') return parent;
      else if (part.type === 'Attribute') {
        const endPosition = xml.indexOf('>', from);
        const node = xml.slice(from, endPosition);
        const match = new RegExp(`${part.attribute}="([^"]+)"`, 'u').exec(node);
        if (match === null) return { from, to: endPosition };
        const newFrom = from + match.index;
        return {
          from: newFrom,
          to: newFrom + match[0].length,
        };
      } else if (part.type === 'Content') {
        const endPosition = xml.indexOf('>', from);
        const closing =
          typeof tagName === 'string' && xml.at(endPosition - 1) !== '/'
            ? findClosing(xml.slice(from))
            : undefined;
        return typeof closing === 'number'
          ? {
              from: endPosition + 1,
              to: from + closing,
            }
          : {
              from: endPosition + 1,
              to: endPosition + 1,
            };
      } else if (part.type === 'Child')
        return findChildPosition(xml, part.tagName, 0, from);
      else if (part.type === 'Children') {
        return {
          tagName: part.tagName,
          from,
          to: from,
        };
      } else if (part.type === 'Index')
        return findChildPosition(xml, tagName, part.index, from);
      else {
        console.error('Unknown path part', { path, part });
        return parent;
      }
    },
    { from: 0, to: 0 }
  );

function findChildPosition(
  xml: string,
  tagName: string | undefined,
  index: number,
  from: number
): Position & { readonly tagName: string | undefined } {
  if (tagName === undefined) return { tagName, from, to: from };
  const newFrom = xml.indexOf('>', from) + 1;
  const rawPosition = findChild(xml.slice(newFrom), tagName, index);
  const position = rawPosition === undefined ? from : rawPosition + newFrom;
  return {
    tagName,
    from: position,
    to: position,
  };
}

/**
 * Scan the string for closing of current tag
 *
 * Handles nested tags of same tagName (i.e, <cell> inside of <cell>)
 */
const findClosing = (string: string): number | undefined =>
  finder(string, f.true, undefined);

/** Find the next nth instance of a direct child with a given tagName */
function findChild(
  xml: string,
  tagName: string,
  index: number
): number | undefined {
  let currentIndex = 0;
  return finder(
    xml,
    (part) => {
      if (part.startsWith(`</${tagName}`)) currentIndex += 1;
      return false;
    },
    (part) => {
      if (
        part.startsWith(`<${tagName} `) ||
        part.startsWith(`<${tagName}>`) ||
        part.startsWith(`<${tagName}/>`)
      ) {
        if (currentIndex === index) return true;
        else if (part.endsWith('/>')) currentIndex += 1;
      }
      return false;
    }
  );
}

function finder(
  xml: string,
  tagEnd: ((part: string) => boolean) | undefined,
  tagStart: ((part: string) => boolean) | undefined
): number | undefined {
  let depth = 0;
  let match: RegExpExecArray | null;
  let isInComment = false;
  reTag.lastIndex = 0;
  while ((match = reTag.exec(xml)) !== null) {
    const [part] = match;
    if (part === '<!--') isInComment = true;
    else if (part === '-->') isInComment = false;
    else if (isInComment) continue;
    else if (part.startsWith('</')) {
      depth -= 1;
      if (depth < 0) return undefined;
      if (depth === 0 && tagEnd?.(part) === true) return match.index;
    } else if (part.startsWith('<')) {
      // Skip CDATA
      if (part[1] === '!') continue;
      if (depth === 0 && tagStart?.(part) === true) return match.index;
      else if (!part.endsWith('/>')) depth += 1;
    }
  }
  return undefined;
}

const reTag = /<!--|-->|<\/?[^/>]+\/?>/gu;

export const exportsForTests = {
  findChild,
  findClosing,
};
