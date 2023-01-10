import type { IR, R, RA, WritableArray } from '../../utils/types';
import { jsonStringify } from '../../utils/utils';

/**
 * Spy on the calls to these console methods so that can include all console
 * messages as part of a crash report
 */
const logTypes = [
  'group',
  'groupEnd',
  'groupCollapsed',
  'log',
  'warn',
  'error',
  'info',
  'trace',
] as const;

export type LogMessage = {
  readonly message: RA<unknown>;
  readonly type: typeof logTypes[number];
  readonly date: string;
  readonly context: IR<unknown>;
};
export const consoleLog: WritableArray<LogMessage> = [];

let context: R<unknown> = {};
let timeout: ReturnType<typeof setTimeout> | undefined = undefined;

export const getLogContext = (): IR<unknown> => context;

export function setLogContext(
  newContext: IR<unknown>,
  merge: boolean = true
): void {
  context = {
    ...(merge ? context : undefined),
    ...Object.fromEntries(
      Object.entries(newContext)
        .filter(([_key, value]) => value !== undefined)
        .map(([key, value]) => [
          key,
          // Allows nesting contexts
          value === context ? context : toSafeValue(value),
        ])
    ),
  };

  /*
   * Reset context on next cycle. This way, you don't have to clear it manually.
   * Things like form parsing are done in a single cycle, so this works
   * perfectly.
   */
  if (timeout === undefined)
    timeout = setTimeout(() => {
      context = {};
      timeout = undefined;
    }, 0);
}

const toSafeValue = (value: unknown): unknown =>
  typeof value === 'function'
    ? value.toString()
    : value === undefined
    ? 'undefined'
    : typeof value === 'object'
    ? jsonStringify(value)
    : value;

export function interceptLogs(): void {
  logTypes.forEach((logType) => {
    /**
     * Read this if you are coming here from DevTools:
     * DevTools would show this file as an originator of all console messages,
     * which is not ideal as it masks the actual originator of the message.
     *
     * There are two ways to fix this:
     * 1. Disable console intercept when in development (not recommended, as
     *    it diverges the production environment from development environment)
     * 2. Add this file to "ignore list" in DevTools. Here is how:
     *    https://stackoverflow.com/q/7126822/8584605
     */

    const defaultFunction = console[logType];

    console[logType] = (...args: RA<unknown>): void => {
      const hasContext = Object.keys(context).length > 0;
      defaultFunction(...args, ...(hasContext ? [context] : []));
      consoleLog.push({
        message: args.map(toSafeValue),
        type: logType,
        date: new Date().toJSON(),
        context,
      });
    };
  });
}
