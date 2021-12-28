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

export function defined<T>(value: T | undefined): T {
  if (typeof value === 'undefined') throw new Error('Value is not defined');
  else return value;
}
