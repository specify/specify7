import type { LocalizedString } from 'typesafe-i18n';

import { f } from './functools';
import type { RA } from './types';
import { filterArray, localized } from './types';
import { escapeRegExp } from './utils';

const format = {
  title: {
    prefix: ' (',
    suffix: ')',
  },
  name: {
    prefix: '_',
    suffix: '',
  },
} as const;

const isHighSurrogate = (codeUnit: number): boolean =>
  codeUnit >= 0xd8_00 && codeUnit <= 0xdb_ff;

/**
 * Truncate a string to at most maxLength UTF-16 code units, without splitting
 * a surrogate pair
 */
function truncateName(name: string, maxLength: number): string {
  if (name.length <= maxLength) return name;
  const safeLength =
    maxLength > 0 && isHighSurrogate(name.charCodeAt(maxLength - 1))
      ? maxLength - 1
      : maxLength;
  return name.slice(0, safeLength);
}

export function getUniqueName(
  name: string,
  usedNames: RA<string>,
  /**
   * In the process of making the name unique, its length may increase.
   * This trims the string if needed, while still keeping it unique
   *
   * @remarks
   * Can get this number from SQL schema for a given field
   */
  maxLength: number = Number.POSITIVE_INFINITY,
  type: keyof typeof format = 'title'
): LocalizedString {
  const { prefix, suffix } = format[type];
  const reSuffix = new RegExp(
    `${escapeRegExp(prefix)}(\\d+)${escapeRegExp(suffix)}$`,
    'u'
  );

  let truncatedName = truncateName(name, maxLength);
  while (usedNames.includes(truncatedName)) {
    const matchedSuffix = reSuffix.exec(truncatedName);
    const [{ length }, indexString] = matchedSuffix ?? ([[], '0'] as const);
    const strippedName =
      length > 0 ? truncatedName.slice(0, -1 * length) : truncatedName;
    const indexRegex = new RegExp(
      `^${escapeRegExp(strippedName)}${reSuffix.source}`,
      'u'
    );
    const newIndex =
      Math.max(
        ...filterArray([
          f.parseInt(indexString),
          ...usedNames.map(
            (name) => f.parseInt(indexRegex.exec(name)?.[1]) ?? 1
          ),
        ])
      ) + 1;
    const uniquePart = `${prefix}${newIndex}${suffix}`;
    const newName =
      newIndex === 1 && length === 0
        ? strippedName
        : `${strippedName}${uniquePart}`;
    if (newName.length <= maxLength) return localized(newName);

    const shortenedName = truncateName(
      truncatedName,
      Math.max(maxLength - uniquePart.length, 0)
    );
    /*
     * If the base name can't be shortened any further (it is already empty),
     * no `${base}${prefix}${index}${suffix}` name fits within maxLength.
     * Fall back to a bounded search over suffix-only candidates.
     */
    if (shortenedName === truncatedName)
      return findBoundedFallback(usedNames, maxLength, prefix, suffix);
    truncatedName = shortenedName;
  }
  return localized(truncatedName);
}

/**
 * Search for a unique truncated `${prefix}${index}${suffix}` name within
 * maxLength. If none is found after a bounded number of attempts, give up on
 * uniqueness and return a truncated name to guarantee termination.
 */
function findBoundedFallback(
  usedNames: RA<string>,
  maxLength: number,
  prefix: string,
  suffix: string
): LocalizedString {
  for (let index = 2; index <= usedNames.length + 2; index += 1) {
    const candidate = truncateName(`${prefix}${index}${suffix}`, maxLength);
    if (!usedNames.includes(candidate)) return localized(candidate);
  }
  return localized(truncateName(`${prefix}2${suffix}`, maxLength));
}
