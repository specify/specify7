import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import type { LogPathPart } from '../Errors/logContext';

type Position = {
  readonly from: number;
  readonly to: number;
};

/**
 * "findNodePosition" is called with the raw XML string and a path to an
 * error, and it's job is to find the position in the string at which to
 * show the error underline
 */
export function findNodePosition(xml: string, path: RA<LogPathPart>): Position {
  // Strip xml declaration if present
  const declaration = xml.startsWith('<?') ? xml.indexOf('>') + 1 : 0;
  const element = findElement(xml.slice(declaration), path);
  return {
    from: element.from + declaration,
    to: Math.max(element.from, element.to) + declaration,
  };
}

/**
 * Reduce over the path, progressively getting closer and closer to the
 * position at which the error occurs - until reached the end of the
 * path, at which point return the resulting position
 */
const findElement = (xml: string, path: RA<LogPathPart>): Position =>
  path.reduce<Position & { readonly tagName?: string }>(
    (parent, part) => {
      const { from, tagName } = parent;
      if (part.type === 'Root') return parent;
      else if (part.type === 'Attribute') {
        const endPosition = xml.indexOf('>', from);
        const node = xml.slice(from, endPosition);
        // Handle virtual attribute name like "initialize abC"
        const name = part.attribute.includes(' ')
          ? part.attribute.split(' ')[0]
          : part.attribute;
        const match = new RegExp(`\\b${name}="([^"]+)"`, 'u').exec(node);
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

/**
 * In a given "xml" string, starting from index "from", find the
 * position of the nth (where n is determined by "index")
 * occurrence of the "tagName" element
 */
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
  finder(string, undefined, f.true);

/** Find the next nth instance of a direct child with a given tagName */
function findChild(
  xml: string,
  tagName: string,
  targetIndex: number
): number | undefined {
  let index = 0;
  return finder(
    xml,
    (part) => {
      const start = `<${tagName}`;
      if (
        part.startsWith(start) &&
        /*
         * I.e, if tagName is 'format', startsWith() would also match
         * <formatter>, thus have to check for that. Using startsWith() in place
         * of regex as a performance optimization.
         */
        !/\w/u.test(part.charAt(start.length))
      ) {
        if (index === targetIndex) return true;
        else if (part.endsWith('/>')) index += 1;
      }
      return false;
    },
    (part) => {
      const end = `</${tagName}`;
      if (part.startsWith(end) && !/\w/u.test(part.charAt(end.length)))
        index += 1;
      return false;
    }
  );
}

/**
 * Traverse the root-level nodes in the xml string until found one
 * that matches the conditions
 */
function finder(
  xml: string,
  tagStart: ((part: string) => boolean) | undefined,
  tagEnd: ((part: string) => boolean) | undefined
): number | undefined {
  let depth = 0;
  return (
    xmlStringTraverse(
      xml,
      (match) => {
        if (depth === 0 && tagStart?.(match[0]) === true) return match.index;
        else if (!match[0].endsWith('/>')) depth += 1;
        return undefined;
      },
      (match) => {
        depth -= 1;
        if (depth < 0) return null;
        if (depth === 0 && tagEnd?.(match[0]) === true) return match.index;
        return undefined;
      }
    ) ?? undefined
  );
}

/**
 * When encountered an opening or closing xml tag, call a callback
 * that decided whether to continue iterating or stop
 */
export function xmlStringTraverse<T>(
  xml: string,
  /**
   * Return anything other than undefined to stop the traversal
   */
  startMatch: (match: RegExpExecArray) => T | undefined,
  endMatch: (match: RegExpExecArray) => T | undefined
): T | undefined {
  let match: RegExpExecArray | null;
  reTag.lastIndex = 0;
  while ((match = reTag.exec(xml)) !== null) {
    const [part] = match;
    if (part === '<!--') {
      const commentEnd = xml.indexOf('-->', reTag.lastIndex);
      if (commentEnd === -1) return undefined;
      reTag.lastIndex = commentEnd + 3;
    } else if (part.startsWith('</')) {
      const end = endMatch(match);
      if (end !== undefined) return end;
    } else if (part.startsWith('<')) {
      // Ignore xml declarations
      if (part.endsWith('?>')) continue;
      else if (part.startsWith('<![CDATA[')) {
        const cdataEnd = ']]>';
        reTag.lastIndex =
          xml.indexOf(cdataEnd, reTag.lastIndex) + cdataEnd.length;
      } else {
        const start = startMatch(match);
        if (start !== undefined) return start;
      }
    }
  }
  return undefined;
}

const reTag = /<!--|<!\[CDATA\[|<[\s\S]*?>/gu;

export const exportsForTests = {
  findChild,
  findClosing,
};
