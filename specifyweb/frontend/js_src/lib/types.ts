/**
 * Common TypeScript types. Used extensively thoughout the front-end
 *
 * @module
 */
import { error } from './assert';

// Record
export type R<V> = Record<string, V>;
// Immutable record
export type IR<V> = Readonly<Record<string, V>>;
// Immutable record with constrained keys
export type RR<K extends string | number | symbol, V> = Readonly<Record<K, V>>;
// Immutable Array
export type RA<V> = readonly V[];

/** Cast a type as defined. Throws at runtime if it is not defined */
export function defined<T>(value: T | undefined): T {
  if (value === undefined) error('Value is not defined');
  else return value;
}

/** Filter undefined items out of the array */
export const filterArray = <T>(array: RA<T | undefined>): RA<T> =>
  array.filter((item): item is T => item !== undefined);

/** Make some keys on a record optional */
export type PartialBy<
  RECORD extends IR<unknown>,
  OPTIONAL_KEYS extends keyof RECORD
> = Omit<RECORD, OPTIONAL_KEYS> & Partial<Pick<RECORD, OPTIONAL_KEYS>>;

export type Writable<T> = {
  -readonly [K in keyof T]: T[K];
};

/**
 * "typeof value === 'function'" does not narrow the type in some cases where
 * a generic is involed
 * See more: https://github.com/microsoft/TypeScript/issues/37663
 */
export const isFunction = <T>(
  value: T
): value is T & ((...args: RA<unknown>) => unknown) =>
  typeof value === 'function';

/**
 * Makes sure object extends a certain type
 *
 * @remarks
 * Call this function with a generic parameter of desired type.
 * The function returns another function which accepts an "as const" object.
 * If that object does not extend the type given specified the first function
 * a type error is thrown.
 *
 * The function has to return a function because typescript does not allow to
 * explicitly specify first generic, while leave the second implicit.
 *
 * The function is needed since `const value: SomeType = {...} as const;` would
 * cast the value to `SomeType` and lose the information from the `as const`
 * assertion.
 *
 * The disadvantage of this function is that "Go to definition" IDE feature
 * doesn't work as good when an `as const` object is wrapped in "ensure". For
 * use cases where that feature is important, instead of wrapping the
 * object in ensure, add an ensure line after object definition. A disadvantage
 * of not wrapping the object is that IDE won't be able to do autocompletion
 * inside the object from the type information and the type error, if present,
 * is going to be thrown at the "ensure" line, rather than in the exact place
 * inside the object where the error originated.
 *
 * @example Wrapping an `as const` object
 * ```ts
 * const tools = ensure<keoyf Tables>()(['CollectionObject','Locality'] as const);
 * ```
 *
 * @example Usage without wrapping
 * ```ts
 * const tools = ['CollectionObject', 'Locality'] as const;
 * ensure<RA<tools>>(tools);
 * ```
 */
export const ensure =
  <T>() =>
  <V extends T>(value: V): V extends T ? V : never =>
    value as V extends T ? V : never;
