/**
 * Collection of various helper methods used during the mapping process
 *
 * @module
 */

import { breakpoint, error } from './assert';
import type { IR, RA, RR } from './types';
import type { SplitMappingPath } from './wbplanviewmappinghelper';

export const capitalize = <T extends string>(string: T): Capitalize<T> =>
  (string.charAt(0).toUpperCase() + string.slice(1)) as Capitalize<T>;

export const unCapitalize = <T extends string>(string: T): Uncapitalize<T> =>
  (string.charAt(0).toLowerCase() + string.slice(1)) as Uncapitalize<T>;

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

      if (typeof searchValue === 'undefined') return Number(index);
      else if (sourceValue === searchValue) return undefined;
      else return -1;
    }) ?? searchLength - 1
  );
}

export const extractDefaultValues = (
  splitMappingPaths: RA<SplitMappingPath>,
  emptyStringReplacement = ''
): IR<string> =>
  Object.fromEntries(
    splitMappingPaths
      .map(
        ({ headerName, columnOptions }) =>
          [
            headerName,
            columnOptions.default === ''
              ? emptyStringReplacement
              : columnOptions.default,
          ] as [string, string]
      )
      .filter(([, defaultValue]) => defaultValue !== null)
  );

export const upperToKebab = (value: string): string =>
  value.toLowerCase().split('_').join('-');

export const camelToKebab = (value: string): string =>
  value.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();

export const camelToHuman = (value: string): string =>
  capitalize(value.replace(/([a-z])([A-Z])/g, '$1 $2')).replace(/Dna\b/, 'DNA');

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
  DICTIONARY extends RR<KEY, unknown>
>(
  dictionary: DICTIONARY,
  searchKey:
    | KEY
    | Lowercase<KEY>
    | Uppercase<KEY>
    | Capitalize<KEY>
    | Uncapitalize<KEY>
): DICTIONARY[KEY] =>
  Object.entries(dictionary).find(
    ([key]) => key.toLowerCase() === searchKey.toLowerCase()
  )?.[1] as DICTIONARY[KEY];

/** Generate a sort function for Array.prototype.sort */
export const sortFunction =
  <T, V extends boolean | number | string>(
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
      : leftValue > rightValue
      ? 1
      : -1;
  };

export const sortObjectsByKey = <
  KEY extends string | number | symbol,
  T extends Record<KEY, boolean | number | string>
>(
  objects: RA<T>,
  key: KEY
): RA<T> => Array.from(objects).sort(sortFunction(({ [key]: value }) => value));

/** Split array in half according to a discriminator function */
export const split = <ITEM>(
  array: RA<ITEM>,
  discriminator: (item: ITEM, index: number) => boolean
): Readonly<[left: RA<ITEM>, right: RA<ITEM>]> =>
  array
    .map((item, index) => [item, discriminator(item, index)] as const)
    .reduce<Readonly<[left: RA<ITEM>, right: RA<ITEM>]>>(
      ([left, right], [item, isRight]) => [
        [...left, ...(isRight ? [] : [item])],
        [...right, ...(isRight ? [item] : [])],
      ],
      [[], []]
    );

/** Convert an array of [key,value] tuples to a Dict[key, value[]]*/
export const group = <KEY extends PropertyKey, VALUE>(
  entries: RA<Readonly<[key: KEY, value: VALUE]>>
): RR<KEY, RA<VALUE>> =>
  entries.reduce(
    (grouped, [key, value]) => ({
      ...grouped,
      [key]: [...(grouped[key] ?? []), value],
    }),
    // eslint-disable-next-line @typescript-eslint/prefer-reduce-type-parameter
    {} as RR<KEY, RA<VALUE>>
  );

// Find a value in an array, and return it's mapped variant
export function mappedFind<ITEM, RETURN_TYPE>(
  array: RA<ITEM>,
  callback: (item: ITEM, index: number) => RETURN_TYPE | undefined
): RETURN_TYPE | undefined {
  let value = undefined;
  array.some((item, index) => {
    value = callback(item, index);
    return typeof value !== 'undefined';
  });
  return value;
}

export const omit = <
  DICTIONARY extends IR<unknown>,
  OMIT extends keyof DICTIONARY
>(
  object: DICTIONARY,
  toOmit: RA<OMIT>
): {
  readonly [KEY in keyof DICTIONARY as KEY extends OMIT
    ? never
    : KEY]: DICTIONARY[KEY];
} =>
  // @ts-expect-error
  Object.fromEntries(
    Object.entries(object).filter(([key]) => !f.includes(toOmit, key))
  );

export const clamp = (min: number, max: number, value: number) =>
  Math.min(max, Math.max(min, value));

/**
 * A collection of helper functions for functional programming style
 * Kind of like underscore or ramda, but typesafe
 */
export const f = {
  /** Return void */
  void: (): void => undefined,
  undefined: (): undefined => undefined,
  /** Call first argument */
  exec: <T>(function_: (...args: RA<never>) => T): T => function_(),
  array: (): RA<never> => [],
  unary:
    <ARGUMENT, RETURN>(
      callback: (argument: ARGUMENT) => RETURN
    ): ((argument: ARGUMENT) => RETURN) =>
    (argument) =>
      callback(argument),
  id: <T>(value: T): T => value,
  trim: (value: string) => value.trim(),
  /**
   * Like console.log but return type is undefined instead of void, thus it
   * can be used in ternary expressions without type errors
   * Also, calls a breakpoint()
   */
  error(...args: RA<unknown>): undefined {
    breakpoint();
    console.log(...args);
    return undefined;
  },
  /** An alternative way to declare a variable */
  var: <VALUE, RETURN>(
    value: VALUE,
    callback: (value: VALUE) => RETURN
  ): RETURN => callback(value),
  /** Like Promise.all, but accepts a dictionary instead of an array */
  all: async <T extends IR<unknown>>(dictionary: {
    readonly [PROMISE_NAME in keyof T]:
      | Promise<T[PROMISE_NAME]>
      | T[PROMISE_NAME];
  }): Promise<T> =>
    Object.fromEntries(
      await Promise.all(
        Object.entries(dictionary).map(async ([promiseName, promise]) => [
          promiseName,
          await promise,
        ])
      )
    ),
  sum: (array: RA<number>): number =>
    array.reduce((total, value) => total + value, 0),
  never: (): never => error('This should never get called'),
  equal:
    (value: unknown) =>
    (secondValue: unknown): boolean =>
      secondValue === value,
  /**
   * If need to support internationalization, consider using localeCompare
   *
   * Example of case-insensitive comparison:
   * ```js
   * a.localeCompare(b, LANGUAGE, { sensitivity: 'base' })
   * ```
   */
  looseEqual:
    (value: string) =>
    (secondValue: string): boolean =>
      value.toString() == secondValue.toLowerCase(),
  /**
   * Call the second argument with the first if not undefined.
   * Else return undefined
   * Can replace undefined case with an alternative branch using nullish
   * coalescing operator:
   * ```js
   * f.maybe(undefinedOrNot, calledOnNotUndefined) ?? calledOnUndefined()
   * ```
   */
  maybe: <VALUE, RETURN>(
    value: VALUE | undefined,
    callback: (value: VALUE) => RETURN
  ): RETURN | undefined =>
    typeof value === 'undefined' ? undefined : callback(value),
  /**
   * A better typed version of Array.prototype.includes
   *
   * It allows first argument to be of any type, but if value is present
   * in the array, its type is changed using a type predicate
   */
  includes: <T>(array: RA<T>, item: unknown): item is T =>
    array.includes(item as T),
  /**
   * Intercept function arguments without affecting it
   * Useful for debugging or logging
   */
  tap:
    <ARGUMENTS extends RA<never>, RETURN>(
      tapFunction: (...args: ARGUMENTS) => void,
      action: (...args: ARGUMENTS) => RETURN
    ) =>
    (...args: ARGUMENTS): RETURN => {
      tapFunction(...args);
      return action(...args);
    },
  /**
   * Calls a function without any arguments.
   * Useful when mapping over a list of functions
   */
  call: <RETURN>(callback: () => RETURN): RETURN => callback(),
} as const;
