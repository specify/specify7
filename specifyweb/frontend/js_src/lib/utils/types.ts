/**
 * Common TypeScript types. Used extensively thoughout the front-end
 *
 * @module
 */
import type { LocalizedString } from 'typesafe-i18n';

// Record
export type R<V> = Record<string, V>;
// Immutable record
export type IR<V> = Readonly<Record<string, V>>;
// Immutable record with constrained keys
export type RR<K extends number | string | symbol, V> = Readonly<Record<K, V>>;
// Immutable Array
export type RA<V> = readonly V[];

export type GetSet<T> = readonly [T, (value: T) => void];
export type GetOrSet<T> = readonly [
  T,
  (value: T | ((oldValue: T) => T)) => void,
];

export type ValueOf<T> = T[keyof T];

/**
 * It is a widely used convention in TypeScript to use T[] to denote arrays.
 * However, this creates a mutable array type.
 * This is why, RA<T> has been used across the codebase.
 * In rare cases when a mutable array is needed, this type should be used, for
 * the following reasons:
 * - It makes it explicitly known that the value is meant to be mutated
 * - It doesn't trigger the "functional/prefer-readonly-type" ESLint rule.
 */
// eslint-disable-next-line functional/prefer-readonly-type
export type WritableArray<T> = T[];

/** Cast a type as defined. Throws at runtime if it is not defined */
export function defined<T>(value: T | undefined, message?: string): T {
  // eslint-disable-next-line functional/no-throw-statement
  if (value === undefined) throw new Error(message ?? 'Value is not defined');
  else return value;
}

/** Filter undefined items out of the array */
export const filterArray = <T>(array: RA<T | undefined>): RA<T> =>
  array.filter((item): item is T => item !== undefined);

/** Make some keys on a record optional */
export type PartialBy<
  RECORD extends IR<unknown>,
  OPTIONAL_KEYS extends keyof RECORD,
> = Omit<RECORD, OPTIONAL_KEYS> & Partial<Pick<RECORD, OPTIONAL_KEYS>>;

/**
 * Like Partial, but recursively applies to nested records and arrays
 */
export type DeepPartial<RECORD extends IR<unknown>> = {
  readonly [KEY in keyof RECORD]?: RECORD[KEY] extends RA<IR<unknown>>
    ? RA<DeepPartial<RECORD[KEY][number]>>
    : RECORD[KEY] extends IR<unknown>
      ? DeepPartial<RECORD[KEY]>
      : RECORD[KEY];
};

// eslint-disable-next-line functional/prefer-readonly-type
export type Writable<T> = {
  -readonly [K in keyof T]: T[K];
};

/**
 * Inspired by https://stackoverflow.com/a/69676731
 * Constructs a tuple type which must contain exactly one of every possible
 * type of VALUES along with the values in RESULT
 *
 * @remarks
 * While the RESULT parameter can be explicitly provided, it is primarily used
 * to recursively generate the tuple
 *
 * @example
 * ```ts
 * type Colors = RestrictedTuple<'blue' | 'green' | 'red'>;
 * const missing: Colors = ['blue']; // Invalid
 * const duplicates: Colors = ['blue', 'blue', 'red']; // Invalid
 * const wrongColor: Colors = ['green', 'blue', 'yellow']; // Invalid
 * const wrongLength: Colors = ['blue', 'red', 'green', 'green']; // Invalid
 * const rightColors: Colors = ['blue', 'red', 'green']; // Valid
 * ```
 */
export type RestrictedTuple<
  VALUES extends string,
  RESULT extends RA<unknown> = readonly [],
> = ValueOf<{
  readonly [KEY in VALUES]: Exclude<VALUES, KEY> extends never
    ? readonly [KEY, ...RESULT]
    : RestrictedTuple<Exclude<VALUES, KEY>, readonly [KEY, ...RESULT]>;
}>;

/**
 * Cast type to writable. Equivalent to doing "as Writable<T>", except this
 * way, don't have to manually specify the generic type
 */
export const writable = <T>(value: T): Writable<T> => value;

/**
 * "typeof value === 'function'" does not narrow the type in some cases where
 * a generic is involved (in particular, when the generic itself could be a
 * function)
 * See more: https://github.com/microsoft/TypeScript/issues/37663
 * Note, this is not completely type safe, so prefer typeof value === 'function'
 * unless that doesn't work
 */
export const isFunction = <T>(
  value: T
): value is T & ((...args: RA<unknown>) => unknown) =>
  typeof value === 'function';

/**
 * Allows to overwrite a read-only property in a type-safe way.
 * In most cases it is recommended to change the typing rather or use a callback
 * rather than use this utility.
 * This utility is preferred over adding "// @ts-expect-error" because:
 *  - This is more type safe (ts-expect-error disables all errors, not just
 *    the read-only error)
 *  - Using this utility makes it easy to see all the places that overwrite a
 *    read only property
 */
export function overwriteReadOnly<
  KEY extends string,
  OBJECT extends { readonly [key in KEY]?: unknown },
>(object: OBJECT, key: KEY, value: unknown): void {
  // @ts-expect-error Overwriting read-only
  object[key] = value;
}

/**
 * Set a global variable when in development mode.
 *
 * Exposing the variables in global scope makes debugging easier.
 *
 * @remarks
 * Using this function helps easily find all the places were global variables
 * were set, and removes the need to silence the TypeScript error separately
 * in each place
 */
export function setDevelopmentGlobal(name: string, value: unknown): void {
  if (process.env.NODE_ENV === 'development')
    // @ts-expect-error
    globalThis[name] = value;
}

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
 * ensure<RA<TableName>>(tools);
 * ```
 *
 * REFACTOR: update typescript, and replace this function with TypeScript's satisfies operator
 */
export const ensure =
  <T>() =>
  <V extends T>(value: V): V extends T ? V : never =>
    value as V extends T ? V : never;

/**
 * We define "LocalizedString" as string that can be shown to the user, not
 * necessarily a string that has been translated (for example, Collection name
 * should be considered localized, even if it's not translated)
 *
 * This function marks a string as localized, thus making it eligible for being
 * shown to the user. UI elements like buttons and dialogs require that only
 * localized strings be used. For example, output of a catalog number formatter
 * function is considered localized, as well as output from the
 * internationalization helpers.
 *
 * @remarks
 *
 * LocalizedString is a useful type provided by typesafe-i18n library.
 * It's equivalent to string, but in places where LocalizedString is required,
 * providing string results in a type error (but not the other way around).
 *
 * This makes it perfect for enforcing for example that a dialog header string
 * must be localized.
 *
 * Often times, when localized value is missing or a default value is needed,
 * empty string is used. However, empty string is not a LocalizedString, so
 * this hack is needed
 *
 * @example Valid use case
 * localized('')
 *
 * @example Invalid use case
 * ```ts
 * // Wrong:
 * localized(table.name)
 * // Should use table label instead (unless there is a good reason to use
 * // table name)
 * table.label
 * ```
 *
 * Generics are needed to transform types like `string | undefined` into
 * `LocalizedString | undefined`
 */
export const localized = <T>(
  string: T
): Exclude<T, string> | (T extends string ? LocalizedString : never) =>
  string as Exclude<T, string> | (T extends string ? LocalizedString : never);
