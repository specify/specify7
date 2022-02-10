import type { RA } from './types';

export function assert(value: unknown, message: string): void {
  if (!value) throw new Error(message);
}

/**
 * Allows throwing errors from expressions, not just statements
 *
 * @remarks
 * There is a proposal for fixing this:
 * https://github.com/tc39/proposal-throw-expressions
 */
export function error(message: string, ...rest: RA<unknown>): never {
  if (rest.length > 0) console.error('Error details: ', ...rest);
  throw new Error(message);
}
