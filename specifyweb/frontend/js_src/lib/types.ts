/**
 * Common TypeScript types
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
  if (typeof value === 'undefined') error('Value is not defined');
  else return value;
}

/** Filter undefined items out of the array */
export const filterArray = <T>(array: RA<T | undefined>): RA<T> =>
  array.filter((item): item is T => typeof item !== 'undefined');

// Make some keys on a record optional
export type PartialBy<
  RECORD extends IR<unknown>,
  OPTIONAL_KEYS extends keyof RECORD
> = Omit<RECORD, OPTIONAL_KEYS> & Partial<Pick<RECORD, OPTIONAL_KEYS>>;

export type Writable<T> = {
  -readonly [K in keyof T]: T[K];
};

// "typeof value === 'function'" does not narrow the type in some cases
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
 * explicitly specify first generic, but leave the second imlplicit.
 *
 * The function is needed as `const value: SomeType = {...} as const;` would
 * cast the value to `SomeType` and lose the information from the `as const`
 * assertion.
 */
export const ensure =
  <T>() =>
  <V extends T>(value: V): V extends T ? V : never =>
    value as V extends T ? V : never;
