/**
 * Common TypeScript types
 *
 * @module
 */

// Record
export type R<V> = Record<string, V>;
// Immutable record
export type IR<V> = Readonly<Record<string, V>>;
// Immutable record with constrained keys
export type RR<K extends string | number | symbol, V> = Readonly<Record<K, V>>;
// Immutable Array
export type RA<V> = readonly V[];

// Cast a type as defined. Throw at runtime if it is not defined
export function defined<T>(value: T | undefined): T {
  if (typeof value === 'undefined') throw new Error('Value is not defined');
  else return value;
}

// Make some keys on a record optional
export type PartialBy<
  RECORD extends IR<unknown>,
  OPTIONAL_KEYS extends keyof RECORD
> = Omit<RECORD, OPTIONAL_KEYS> & Partial<Pick<RECORD, OPTIONAL_KEYS>>;

export type Writable<T> = {
  -readonly [K in keyof T]: T[K];
};
