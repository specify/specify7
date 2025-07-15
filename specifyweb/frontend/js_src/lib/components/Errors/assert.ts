import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';

export function assert(
  value: unknown,
  message: string = 'Assertion failed'
): void {
  if (!Boolean(value)) error(message);
}

export const errorDetails: unique symbol = Symbol('Error Details');

/**
 * Allows throwing errors from expressions, not just statements
 *
 * @remarks
 * There is a proposal for fixing this:
 * https://github.com/tc39/proposal-throw-expressions
 */
export function error(message: Error | string, ...rest: RA<unknown>): never {
  if (rest.length > 0) console.error('Error details: ', ...rest);
  breakpoint();
  const error = message instanceof Error ? message : new Error(message);
  // This is for the "Copy Error Message" feature:
  if (!(errorDetails in error))
    Object.defineProperty(error, errorDetails, {
      value: rest,
    });
  throw error;
}

/**
 * Throw an error, but only if in development mode.
 * Otherwise, log the error
 *
 * REFACTOR: use this instead of error whenever possible
 */
export const softError =
  process.env.NODE_ENV === 'production' ? console.error : error;

/**
 * Before an error is thrown, this function is called.
 *
 * Setting a breakpoint in this function would break on most front-end errors.
 *
 * There is a "Pause on caught exceptions" checkbox in Chrome's DevTools,
 * but it produces lot's of false positives, because babel's polyfills
 * throw and catch several exceptions during initialization
 */
export function breakpoint(): void {
  /* Breakpoint */
  /*
   * FEATURE: turn this on in development
   * debugger;
   */
}

/**
 * Wrap a function in this to call a breakpoint when function is called
 *
 * Usually, you can just set a breakpoint inside a function, but that is hard
 * for functions defined by third party libraries
 */
export const tap = <ARGS extends RA<never>, RETURN>(
  callback: (...args: ARGS) => RETURN
) => f.tap(breakpoint, callback);
