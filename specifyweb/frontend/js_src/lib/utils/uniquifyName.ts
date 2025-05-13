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
  if (!usedNames.includes(name)) return localized(name);
  const { prefix, suffix } = format[type];
  const reSuffix = new RegExp(
    `${escapeRegExp(prefix)}(\\d+)${escapeRegExp(suffix)}$`,
    'u'
  );
  const matchedSuffix = reSuffix.exec(name);
  const [{ length }, indexString] = matchedSuffix ?? ([[], '0'] as const);
  const strippedName = length > 0 ? name.slice(0, -1 * length) : name;
  const indexRegex = new RegExp(
    `^${escapeRegExp(strippedName)}${reSuffix.source}`,
    'u'
  );
  const newIndex =
    Math.max(
      ...filterArray([
        f.parseInt(indexString),
        ...usedNames.map((name) => f.parseInt(indexRegex.exec(name)?.[1]) ?? 1),
      ])
    ) + 1;
  const uniquePart = `${prefix}${newIndex}${suffix}`;
  const newName =
    newIndex === 1 && length === 0
      ? strippedName
      : `${strippedName}${uniquePart}`;

  return newName.length > maxLength
    ? getUniqueName(
        name.slice(0, -1 * uniquePart.length),
        usedNames,
        maxLength,
        type
      )
    : localized(newName);
}
