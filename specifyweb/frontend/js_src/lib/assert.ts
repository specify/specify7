import type { RA } from './types';

export function assert(value: unknown, message?: string): void {
  if (!Boolean(value)) error(message ?? 'Assertion failed');
}

/**
 * Allows throwing errors from expressions, not just statements
 *
 * @remarks
 * There is a proposal for fixing this:
 * https://github.com/tc39/proposal-throw-expressions
 */
export function error(message: string | Error, ...rest: RA<unknown>): never {
  if (rest.length > 0) console.error('Error details: ', ...rest);
  breakpoint();
  throw message instanceof Error ? message : new Error(message);
}

/**
 * Before an error is thrown, this function is called
 * Setting a breakpoint in this function would break on most front-end errors
 *
 * There is a "Pause on caught exceptions" checkbox in Chrome's DevTools,
 * but it produces lot's of false positives, because babel's polyfills
 * throw and catch several exceptions during initialization
 */
export function breakpoint(): void {
  /* Blank */
}
