import { breakpoint, error } from '../components/Errors/assert';
import type { IR, RA } from './types';
import { filterArray } from './types';

/** A storage for f.store */
const store = new Map<() => unknown, unknown>();

/**
 * A collection of helper functions for functional programming style
 * Kind of like underscore or ramda, but typesafe
 */
export const f = {
  /** Return void */
  void: (): void => undefined,
  undefined: (): undefined => undefined,
  array: (): RA<never> => [],
  /** Create a new version of the passed function that accepts only 1 argument */
  unary:
    <ARGUMENT, RETURN>(
      callback: (argument: ARGUMENT) => RETURN
    ): ((argument: ARGUMENT) => RETURN) =>
    (argument) =>
      callback(argument),
  /** Create a new version of the passed function that does not accept arguments */
  zero:
    <RETURN>(callback: () => RETURN) =>
    (): RETURN =>
      callback(),
  id: <T>(value: T): T => value,
  trim: (value: string) => value.trim(),
  /**
   * Like console.error but return type is undefined instead of void, thus it
   * can be used in ternary expressions without type errors
   * Also, calls a breakpoint()
   */
  error(...args: RA<unknown>): undefined {
    breakpoint();
    console.error(...args);
    return undefined;
  },
  /**
   * Like console.log, but return type is undefined instead of void to allow
   * using this in expressions without a type error
   */
  log(...args: RA<unknown>): undefined {
    console.log(...args);
    return undefined;
  },
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
   * Call the second argument with the first if not undefined.
   * Else return undefined
   * Can replace undefined case with an alternative branch using nullish
   * coalescing operator:
   * ```js
   * f.maybe(undefinedOrNot, calledOnNotUndefined) ?? calledOnUndefined()
   * ```
   */
  maybe: <VALUE, RETURN>(
    value: VALUE | undefined | void,
    callback: (value: VALUE) => RETURN
  ): RETURN | undefined => (value === undefined ? undefined : callback(value)),
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
  has: <T>(set: ReadonlySet<T>, item: unknown): item is T => set.has(item as T),
  /**
   * Intercept function arguments without affecting it
   * Useful for debugging or logging
   */
  tap:
    <ARGUMENTS extends RA<unknown>, RETURN>(
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
   * call to remember and return its return value.
   *
   * @remarks
   * Useful not just for performance reasons, but also for delaying evaluation
   * of an object until the first time it is needed (i.e., if object is in
   * the global scope, and depends on the datamodel, delaying evaluation
   * allows for creation of the object only after schema is loaded)
   *
   * Additionally, this function has commonly used to avoid circular by delaying
   * creation of an object until it is needed for the first time.
   *
   */
  store:
    <RETURN>(callback: () => RETURN): (() => RETURN) =>
    (): RETURN => {
      if (!store.has(callback)) store.set(callback, callback());
      return store.get(callback) as RETURN;
    },
  unique: <ITEM>(array: RA<ITEM>): RA<ITEM> => Array.from(new Set(array)),
  /**
   * Since TypeScript is unaware of the NaN type, returning undefined
   * is a safer choice
   */
  parseInt(value: string | undefined): number | undefined {
    if (value === undefined) return undefined;
    const number = Number.parseInt(value);
    return Number.isNaN(number) ? undefined : number;
  },
  /** Like f.parseInt, but for floats */
  parseFloat(value: string | undefined): number | undefined {
    if (value === undefined) return undefined;
    const number = Number.parseFloat(value);
    return Number.isNaN(number) ? undefined : number;
  },
  /**
   * Round a number to the nearest step value, where step could be a float
   *
   * @example
   * ```js
   * f.round(6, 2);  // 6
   * f.round(5, 2);  // 6
   * f.round(4, 2.1);  // 4.2
   * ```
   */
  round: (number: number, step: number): number =>
    Math.round(number / step) * step,
  true: (): true => true,
  flat: <T>(array: RA<RA<T>>): RA<T> => array.flat(),
  toString: (value: unknown): string =>
    (value as { readonly toString: () => string } | undefined)?.toString() ??
    '',
  min(...array: RA<number | undefined>): number | undefined {
    const data = filterArray(array);
    return data.length === 0 ? undefined : Math.min(...data);
  },
  max(...array: RA<number | undefined>): number | undefined {
    const data = filterArray(array);
    return data.length === 0 ? undefined : Math.max(...data);
  },
} as const;
