/**
 * Localization utilities and localization string resolver
 *
 * @module
 */

import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';
import { typesafeI18nObject } from 'typesafe-i18n';

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
export type Value = Partial<RR<MetaKeys, string>> & RR<Language, string>;
export type Dictionary = IR<Value>;

type ExtractLanguage<DICT extends Dictionary> = {
  readonly [KEY in keyof DICT]: DICT[KEY][typeof DEFAULT_LANGUAGE];
};

export const rawDictionary: unique symbol = Symbol('Raw Dictionary');
// FIXME: allow missing localizations for non-base language?
/**
 * Wrap localization strings in a resolver.
 * Localization string may accept some arguments.
 */
export function createDictionary<DICT extends Dictionary>(dictionary: DICT) {
  const resolver = typesafeI18nObject(
    LANGUAGE,
    Object.fromEntries(
      Object.entries(dictionary).map(([key, value]) => [key, value[LANGUAGE]])
    ) as ExtractLanguage<typeof dictionary>,
    {}
  );
  // @ts-expect-error This is used by ./__tests__/localization.ts
  resolver[rawDictionary] = dictionary;
  return resolver;
}

/**
 * Make whitespace insensitive string suitable to go into a
 * whitespace sensitive place (e.g [title] attribute)
 *
 * New lines are ignored. To provide an explicit new line, use <br>
 */
export const whitespaceSensitive = (string: string): string =>
  string
    .trim()
    .split('\n')
    .map(f.trim)
    .filter(Boolean)
    .join(' ')
    .replace(/<br>\s?/u, '\n');

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
  readonly components: IR<(label: string) => JSX.Element>;
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

    const jsx = (
      <React.Fragment key={groupIndex}>
        {component(group.groups?.label ?? '')}
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
