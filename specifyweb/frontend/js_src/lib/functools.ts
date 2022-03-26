/** A storage for f.store */
import { breakpoint, error } from './assert';
import type { IR, RA } from './types';

const store = new Map<() => unknown, unknown>();

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
  log: (...args: RA<unknown>): undefined => void console.log(...args),
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
  notEqual:
    (value: unknown) =>
    (secondValue: unknown): boolean =>
      secondValue !== value,
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
   * Like f.includes, but for sets
   */
  has: <T>(set: Set<T>, item: unknown): item is T => set.has(item as T),
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
  /**
   * Wrap a pure function that does not need any arguments in this
   * call to remember and return its return value
   */
  store:
    <RETURN>(callback: () => RETURN): (() => RETURN) =>
    (): RETURN => {
      if (!store.has(callback)) store.set(callback, callback());
      return store.get(callback) as RETURN;
    },
  unique: <ITEM>(array: RA<ITEM>): RA<ITEM> => Array.from(new Set(array)),
} as const;
