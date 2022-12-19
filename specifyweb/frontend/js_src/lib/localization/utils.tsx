/**
 * Localization utilities and localization string resolver
 *
 * @module
 */

import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';
import { typesafeI18nObject } from 'typesafe-i18n';

import { formatNumber } from '../components/Atoms/Internationalization';
import { error } from '../components/Errors/assert';
import { f } from '../utils/functools';
import type { IR, RR } from '../utils/types';

export const languages = ['en-us', 'ru-ru'] as const;
/** This allows to hide unfinished localizations in production */
export const enabledLanguages =
  process.env.NODE_ENV === 'development' ? languages : ['en-us', 'ru-ru'];

export type Language = typeof languages[number];
export const DEFAULT_LANGUAGE = 'en-us';
export const LANGUAGE: Language =
  (typeof document === 'object' &&
  f.includes(languages, document.documentElement.lang)
    ? document.documentElement.lang
    : undefined) ?? DEFAULT_LANGUAGE;

export const localizationMetaKeys = ['comment'] as const;
type MetaKeys = typeof localizationMetaKeys[number];
export type LocalizationEntry = Partial<RR<MetaKeys | Language, string>> &
  RR<typeof DEFAULT_LANGUAGE, string>;
export type LocalizationDictionary = IR<LocalizationEntry>;

type ExtractLanguage<DICT extends LocalizationDictionary> = {
  readonly [KEY in keyof DICT]: DICT[KEY][typeof DEFAULT_LANGUAGE];
};

const formatters = {
  formatted: formatNumber,
} as const;

export const rawDictionary: unique symbol = Symbol('Raw Dictionary');

/**
 * Wrap localization strings in a resolver.
 * Localization string may accept some arguments.
 */
export function createDictionary<DICT extends LocalizationDictionary>(
  dictionary: DICT
) {
  const resolver = typesafeI18nObject(
    LANGUAGE,
    Object.fromEntries(
      Object.entries(dictionary).map(([key, value]) => [
        key,
        value[LANGUAGE] ?? value[DEFAULT_LANGUAGE],
      ])
    ) as ExtractLanguage<typeof dictionary>,
    formatters
  );
  // @ts-expect-error This is used by ./__tests__/localization.ts
  resolver[rawDictionary] = dictionary;
  return resolver;
}

/**
 * Make whitespace insensitive string suitable to go into a
 * whitespace sensitive place (e.g [title] attribute)
 *
 * New lines are ignored, unless the line is completely blank
 */
export const whitespaceSensitive = (string: LocalizedString): string =>
  string
    .trim()
    .split('\n')
    .map(f.trim)
    .map((part, index, items) =>
      part.length === 0
        ? index + 1 === items.length || index === 0
          ? ''
          : '\n'
        : `${index === 0 || items[index - 1] === '' ? '' : ' '}${part}`
    )
    .filter(Boolean)
    .join('');

const reJsx = /<(?<name>\w+)(?:>(?<label>[^<]*)<\/\k<name>>|\s?\/>)/gu;

/**
 * Convert a string to JSX elements. See tests for usages
 *
 * Inspired by
 * https://github.com/ivanhofer/typesafe-i18n#how-do-i-render-a-component-inside-a-translation
 *
 * Note: tested JSX expressions are not supported
 */
export function StringToJsx({
  string,
  components,
}: {
  readonly string: LocalizedString;
  readonly components: IR<
    JSX.Element | ((label: LocalizedString) => JSX.Element)
  >;
}): JSX.Element {
  let index = 0;
  const usedComponents = new Set<string>();
  const groups = string.matchAll(reJsx);
  const result = Array.from(groups, (group, groupIndex) => {
    const prefix = string.slice(index, group.index);
    index += prefix.length + group[0].length;

    const name = group.groups?.name ?? '';
    const component = components[name];
    if (component === undefined)
      error(`Trying to convert invalid string to JSX`, {
        string,
        group,
        components: Object.keys(components),
        index,
      });
    usedComponents.add(name);

    const label = group.groups?.label ?? '';
    const jsx = (
      <React.Fragment key={groupIndex}>
        {typeof component === 'function'
          ? component(label as LocalizedString)
          : component}
      </React.Fragment>
    );

    return [prefix, jsx];
  }).flat();

  // Check for unused components. Allows to catch localization mistakes
  if (process.env.NODE_END === 'development') {
    const unusedGroups = Object.keys(components).filter(
      (name) => !usedComponents.has(name)
    );
    if (unusedGroups.length > 0)
      error(`JSX string has unused components`, {
        string,
        components: Object.keys(components),
        unusedGroups,
      });
  }

  return (
    <>
      {result}
      {string.slice(index)}
    </>
  );
}
