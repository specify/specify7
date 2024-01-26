import type { IR, R, RA, WritableArray } from '../../utils/types';
import { multiSortFunction } from '../../utils/utils';
import type { SchemaLocation } from './traversal';
import { traverseSchema } from './traversal';
import type { ParsedDom } from './xml';

export const rootSchemaLanguage = 'en';

export type SchemaStrings = IR<{
  readonly strings: IR<string>;
  readonly locations: RA<SchemaLocation>;
}>;

type WritableSchemaStructure = R<{
  // eslint-disable-next-line functional/prefer-readonly-type
  strings: IR<string>;
  readonly locations: WritableArray<SchemaLocation>;
}>;

/**
 * Extract localizable strings from a parsed XML schema localization file
 */
export function parseSchemaLocalization(dom: ParsedDom): SchemaStrings {
  const structure: WritableSchemaStructure = {};
  traverseSchema(dom, (location, strings) => {
    const rawKey = strings[rootSchemaLanguage];
    if (rawKey === undefined) return strings;
    const key = trimSchemaKey(rawKey);
    const cutPart = rawKey.slice(key.length);
    structure[key] ??= { strings: {}, locations: [] };

    // Resolve differing translations of same string
    const resolved = Object.fromEntries(
      Object.entries(strings).map(([code, rawText]) => {
        /*
         * Only cut the numeric part from translation if it ends with the same
         * number. I.e, if English is "2nd time", and translation is "timo 2"
         * then don't cut the number.
         */
        const text =
          cutPart !== '' && rawText.endsWith(cutPart)
            ? rawText.slice(0, -cutPart.length)
            : rawText;
        const otherText = structure[key].strings[code] ?? '';
        return [
          code,
          otherText !== '' && text !== otherText
            ? pickBetterTranslation(text, otherText, key)
            : text,
        ];
      })
    );

    structure[key].strings = {
      ...structure[key].strings,
      ...resolved,
    };
    structure[key].locations.push(location);
    return strings;
  });
  return structure;
}

/**
 * To deduplicate the translations for cases like "Text1", "Text2", "Text3"
 * and etc, show only the "Text" part for translation
 */
export const trimSchemaKey = (key: string): string => key.replace(/\d+$/u, '');

/**
 * The heuristic for picking a more useful string when the same english string
 * has been translated differently in different places
 *
 * Currently, the code assumes that if English is the same, then the meaning is
 * the same. Without that assumption, the code would be quite a bit more
 * complicated.
 */
const pickBetterTranslation = (
  left: string,
  right: string,
  untranslated: string
): string =>
  [left, right].sort(
    multiSortFunction(
      // Pick a value that is not equal to English (thus is translated)
      (string) => string !== untranslated,
      true,
      // Shorter is better
      ({ length }) => length,
      // Maximize count of non-lowercase characters. i.e., URI is better than Uri
      (text) => text.replaceAll(/^[a-z]/gu, '').length,
      true
    )
  )[0];

export const exportsForTests = {
  pickBetterTranslation,
};
