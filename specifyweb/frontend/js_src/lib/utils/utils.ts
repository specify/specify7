/**
 * Collection of various helper methods
 *
 * @module
 */

import type { LocalizedString } from 'typesafe-i18n';

import type { KeysToLowerCase } from '../components/DataModel/helperTypes';
import { f } from './functools';
import type { IR, RA, RR } from './types';
import { filterArray, localized } from './types';

/**
 * Instead of writing code like `Object.entries(dict).find(()=>...)[0]`,
 * can use `Object.entries(dict).find(()=>...)[KEY]`.
 * Same for `VALUE`, instead of 0.
 * It is easier to read and less error-prone.
 */
export const KEY = 0;
export const VALUE = 1;

/**
 * Similarly to KEY and VALUE above, we commonly pass react getter and
 * setter as a two-tuple
 */
export const GET = 0;
export const SET = 1;
// REFACTOR: refactor the applicable 0/1 usages to use the above constants

export const capitalize = <T extends string>(string: T): Capitalize<T> =>
  (string.charAt(0).toUpperCase() + string.slice(1)) as Capitalize<T>;

export const unCapitalize = <T extends string>(string: T): Uncapitalize<T> =>
  (string.charAt(0).toLowerCase() + string.slice(1)) as Uncapitalize<T>;

export const upperToKebab = (value: string): string =>
  value.toLowerCase().split('_').join('-');

export const lowerToHuman = (value: string): LocalizedString =>
  localized(value.toLowerCase().split('_').map(capitalize).join(' '));

export const camelToKebab = (value: string): string =>
  value.replaceAll(/([a-z])([A-Z])/gu, '$1-$2').toLowerCase();

export const camelToHuman = (value: string): LocalizedString =>
  localized(
    capitalize(value.replaceAll(/([a-z])([A-Z])/gu, '$1 $2')).replace(
      /Dna\b/u,
      'DNA'
    )
  );

/** Type-safe variant of toLowerCase */
export const toLowerCase = <T extends string>(string: T): Lowercase<T> =>
  string.toLowerCase() as Lowercase<T>;

/**
 * Finds the point at which the source array begins to have values
 * different from the ones in the search array
 *
 * @example
 * Returns 0 if search array is empty
 * Returns -1 if source array is empty / is shorter than the search array
 * Examples:
 *   If:
 *     source is ['Accession','Accession Agents','#1','Agent','First Name'] and
 *     search is []
 *   returns 0
 *   If:
 *     source is ['Accession','Accession Agents','#1','Agent','First Name'] and
 *     search is ['Accession','Accession Agents',]
 *   returns 2
 *   If
 *     source is ['Accession','Accession Agents','#1','Agent','First Name'] and
 *     search is ['Accession','Accession Agents','#2']
 *   returns -1
 *
 */
export function findArrayDivergencePoint<T>(
  // The source array to use in the comparison
  source: RA<T>,
  // The search array to use in the comparison
  search: RA<T>
): number {
  if (source === null || search === null) return -1;

  const sourceLength = source.length;
  const searchLength = search.length;

  if (searchLength === 0) return 0;

  if (sourceLength === 0 || sourceLength < searchLength) return -1;

  return (
    mappedFind(Object.entries(source), ([index, sourceValue]) => {
      const searchValue = search[Number(index)];

      if (searchValue === undefined) return Number(index);
      else if (sourceValue === searchValue) return undefined;
      else return -1;
    }) ?? searchLength - 1
  );
}

/** Scale a number from original range into new range */
export const spanNumber =
  (
    minInput: number,
    maxInput: number,
    minOutput: number,
    maxOutput: number
  ): ((input: number) => number) =>
  (input: number): number =>
    ((input - minInput) / (maxInput - minInput)) * (maxOutput - minOutput) +
    minOutput;

/** Get Dictionary's key in a case insensitive way */
export const caseInsensitiveHash = <
  KEY extends string,
  DICTIONARY extends RR<KEY, unknown>,
>(
  dictionary: DICTIONARY,
  searchKey:
    | Capitalize<KEY>
    | KEY
    | Lowercase<KEY>
    | Uncapitalize<KEY>
    | Uppercase<KEY>
): DICTIONARY[KEY] =>
  searchKey in dictionary
    ? dictionary[searchKey as KEY]
    : (Object.entries(dictionary).find(
        ([key]) => (key as string).toLowerCase() === searchKey.toLowerCase()
      )?.[VALUE] as DICTIONARY[KEY]);

/** Generate a sort function for Array.prototype.sort */
export const sortFunction =
  <T, V extends Date | boolean | number | string | null | undefined>(
    mapper: (value: T) => V,
    reverse = false
  ): ((left: T, right: T) => -1 | 0 | 1) =>
  (left: T, right: T): -1 | 0 | 1 => {
    const [leftValue, rightValue] = reverse
      ? [mapper(right), mapper(left)]
      : [mapper(left), mapper(right)];
    if (leftValue === rightValue) return 0;
    return typeof leftValue === 'string' && typeof rightValue === 'string'
      ? (leftValue.localeCompare(rightValue) as -1 | 0 | 1)
      : (leftValue ?? 0) > (rightValue ?? 0)
        ? 1
        : -1;
  };

/** Like sortFunction, but can sort based on multiple fields */
export const multiSortFunction =
  <ORIGINAL_TYPE>(
    ...payload: readonly (
      | true
      | ((value: ORIGINAL_TYPE) => Date | boolean | number | string)
    )[]
  ): ((left: ORIGINAL_TYPE, right: ORIGINAL_TYPE) => -1 | 0 | 1) =>
  (left: ORIGINAL_TYPE, right: ORIGINAL_TYPE): -1 | 0 | 1 => {
    const mappers = filterArray(
      payload.map((value, index) =>
        typeof value === 'function'
          ? ([
              value,
              typeof payload[index + 1] === 'boolean'
                ? (payload[index + 1] as boolean)
                : false,
            ] as const)
          : undefined
      )
    );

    for (const [mapper, isReverse] of mappers) {
      const [leftValue, rightValue] = isReverse
        ? [mapper(right), mapper(left)]
        : [mapper(left), mapper(right)];
      if (leftValue === rightValue) continue;
      return typeof leftValue === 'string' && typeof rightValue === 'string'
        ? (leftValue.localeCompare(rightValue) as -1 | 0 | 1)
        : leftValue > rightValue
          ? 1
          : -1;
    }
    return 0;
  };

/** Split array in half according to a discriminator function */
export const split = <LEFT_ITEM, RIGHT_ITEM = LEFT_ITEM>(
  array: RA<LEFT_ITEM | RIGHT_ITEM>,
  // If returns true, item would go to the right array
  discriminator: (
    item: LEFT_ITEM | RIGHT_ITEM,
    index: number,
    array: RA<LEFT_ITEM | RIGHT_ITEM>
  ) => boolean
): readonly [left: RA<LEFT_ITEM>, right: RA<RIGHT_ITEM>] =>
  array
    .map((item, index) => [item, discriminator(item, index, array)] as const)
    .reduce<
      readonly [
        left: RA<LEFT_ITEM | RIGHT_ITEM>,
        right: RA<LEFT_ITEM | RIGHT_ITEM>,
      ]
    >(
      ([left, right], [item, isRight]) => [
        [...left, ...(isRight ? [] : [item])],
        [...right, ...(isRight ? [item] : [])],
      ],
      [[], []]
    ) as readonly [left: RA<LEFT_ITEM>, right: RA<RIGHT_ITEM>];

/**
 * Convert an array of [key,value] tuples to a RA<[key, RA<value>]>
 *
 * @remarks
 * KEY doesn't have to be a string. It can be of any time
 */
export const group = <KEY, VALUE>(
  entries: RA<readonly [key: KEY, value: VALUE]>
): RA<readonly [key: KEY, values: RA<VALUE>]> =>
  Array.from(
    entries
      // eslint-disable-next-line functional/prefer-readonly-type
      .reduce<Map<KEY, RA<VALUE>>>(
        (grouped, [key, value]) =>
          grouped.set(key, [...(grouped.get(key) ?? []), value]),
        new Map()
      )
      .entries()
  );

// Find a value in an array, and return it's mapped variant
export function mappedFind<ITEM, RETURN_TYPE>(
  array: RA<ITEM>,
  callback: (item: ITEM, index: number) => RETURN_TYPE | undefined
): RETURN_TYPE | undefined {
  let value = undefined;
  array.some((item, index) => {
    value = callback(item, index);
    return value !== undefined;
  });
  return value;
}

/**
 * Create a new object with given keys removed
 */
export function removeKey<
  DICTIONARY extends IR<unknown>,
  OMIT extends keyof DICTIONARY,
>(object: DICTIONARY, ...toOmit: RA<OMIT>): Omit<DICTIONARY, OMIT> {
  if (toOmit.length === 1) {
    const { [toOmit[0]]: _, ...newObject } = object;
    return newObject;
  } else {
    const newObject = Object.fromEntries(
      Object.entries<Omit<DICTIONARY, OMIT>>(object).filter(
        ([key]) => !f.includes(toOmit, key)
      )
    );
    return newObject as Omit<DICTIONARY, OMIT>;
  }
}

export const clamp = (min: number, value: number, max: number): number =>
  Math.max(min, Math.min(max, value));

/** Create a new array with a new item at a given position */
export const insertItem = <T>(
  array: RA<T>,
  index: number,
  newItem: T
): RA<T> => [...array.slice(0, index), newItem, ...array.slice(index)];

/** Create a new array with a given item replaced */
export const replaceItem = <T>(
  array: RA<T>,
  index: number,
  newItem: T
): RA<T> =>
  array[index] === newItem
    ? array
    : [
        ...array.slice(0, index),
        newItem,
        ...(index === -1 ? [] : array.slice(index + 1)),
      ];

/**
 * Create a new array without a given item
 *
 * @remarks
 * If you need to remove items often, consider using a Set instead
 */
export const removeItem = <T>(array: RA<T>, index: number): RA<T> =>
  index < 0
    ? [...array.slice(0, index - 1), ...array.slice(index)]
    : [...array.slice(0, index), ...array.slice(index + 1)];

/** Remove item from array if present, otherwise, add it */
export const toggleItem = <T>(array: RA<T>, item: T): RA<T> =>
  array.includes(item)
    ? array.filter((value) => value !== item)
    : [...array, item];

export const moveItem = <T>(
  array: RA<T>,
  index: number,
  direction: 'down' | 'up'
): RA<T> =>
  direction === 'up'
    ? index <= 0
      ? array
      : [
          ...array.slice(0, index - 1),
          array[index],
          array[index - 1],
          ...array.slice(index + 1),
        ]
    : index + 1 >= array.length
      ? array
      : [
          ...array.slice(0, index),
          array[index + 1],
          array[index],
          ...array.slice(index + 2),
        ];

/** Creates a new object with a given key replaced */
export const replaceKey = <T extends IR<unknown>>(
  object: T,
  targetKey: keyof T,
  newValue: T[keyof T]
): T =>
  object[targetKey] === newValue
    ? object
    : {
        // Despite what it looks like, this would preserve the order of keys
        ...object,
        [targetKey]: newValue,
      };

/** Convert an array of objects with IDs into a dictionary */
export const index = <T extends { readonly id: number }>(data: RA<T>): IR<T> =>
  Object.fromEntries(data.map((item) => [item.id, item]));

/** Escape all characters that have special meaning in regular expressions */
export const escapeRegExp = (string: string): string =>
  string.replaceAll(/[$()*+.?[\\\]^{|}]/g, '\\$&');

/** Recursively convert keys on an object to lowercase */
export const keysToLowerCase = <OBJECT extends IR<unknown>>(
  resource: OBJECT
): KeysToLowerCase<OBJECT> =>
  Object.fromEntries(
    Object.entries(resource).map(([key, value]) => [
      key.toLowerCase(),
      Array.isArray(value)
        ? value.map((value) =>
            typeof value === 'object' && value !== null
              ? keysToLowerCase(value)
              : (value as KeysToLowerCase<OBJECT>)
          )
        : typeof value === 'object' && value !== null
          ? keysToLowerCase(value as IR<unknown>)
          : value,
    ])
  ) as unknown as KeysToLowerCase<OBJECT>;

export const takeBetween = <T>(array: RA<T>, first: T, last: T): RA<T> =>
  array.slice(array.indexOf(first) + 1, array.indexOf(last) + 1);

/**
 * Split array into sub-arrays of at most chunkSize
 * Behavior is undefined if chunkSize is less than 1 or not a decimal
 */
export const chunk = <T>(array: RA<T>, chunkSize: number): RA<RA<T>> =>
  Array.from(
    Array.from({ length: Math.ceil(array.length / chunkSize) }),
    (_, index) => array.slice(index * chunkSize, (index + 1) * chunkSize)
  );

/** Convert seconds to minutes and seconds and return the string */
export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  const paddedSeconds = remainingSeconds.toString().padStart(2, '0');
  return `${minutes}:${paddedSeconds}`;
}

// Convert hex code color to hsl code color
type HSL = {
  readonly hue: number;
  readonly saturation: number;
  readonly lightness: number;
};
export function hexToHsl(hex: string): HSL {
  const r = Number.parseInt(hex.slice(1, 3), 16) / 255;
  const g = Number.parseInt(hex.slice(3, 5), 16) / 255;
  const b = Number.parseInt(hex.slice(5, 7), 16) / 255;

  const minComponent = Math.min(r, g, b);
  const maxComponent = Math.max(r, g, b);
  const delta = maxComponent - minComponent;

  let hue = 0;
  if (delta === 0) {
    hue = 0;
  } else if (maxComponent === r) {
    hue = ((g - b) / delta) % 6;
  } else if (maxComponent === g) {
    hue = (b - r) / delta + 2;
  } else {
    hue = (r - g) / delta + 4;
  }

  hue = Math.round(hue * 60);

  const lightness = (maxComponent + minComponent) / 2;
  const saturation =
    delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
  const sPercent = Math.round(saturation * 100);
  const lPercent = Math.round(lightness * 100);

  return { hue, saturation: sPercent, lightness: lPercent };
}
/*
 * Copied from:
 * https://underscorejs.org/docs/modules/throttle.html
 *
 * It was then modified to modernize and simplify the code, as well as, to
 * add the types
 */
export function throttle<ARGUMENTS extends RA<unknown>>(
  callback: (...rest: ARGUMENTS) => void,
  wait: number
): (...rest: ARGUMENTS) => void {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let previousArguments: ARGUMENTS | undefined;
  let previousTimestamp = 0;

  function later(): void {
    previousTimestamp = Date.now();
    timeout = undefined;
    callback(...previousArguments!);
  }

  return (...rest: ARGUMENTS): void => {
    const now = Date.now();
    const remaining = wait - (now - previousTimestamp);
    previousArguments = rest;
    if (remaining <= 0 || remaining > wait) {
      if (timeout !== undefined) {
        clearTimeout(timeout);
        timeout = undefined;
      }
      previousTimestamp = now;
      callback(...previousArguments);
    } else if (timeout === undefined) timeout = setTimeout(later, remaining);
  };
}

/**
 * Strips last occurrence of a delimiter in a string.
 * Eg. Converts ABC.0001.png to ABC.0001
 *
 */
const stripLastOccurrence = (source: string, delimiter: string) =>
  source.includes(delimiter)
    ? source.split(delimiter).slice(0, -1).join(delimiter)
    : source;

export const stripFileExtension = (source: string) =>
  stripLastOccurrence(source, '.');
