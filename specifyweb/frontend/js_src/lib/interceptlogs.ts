import { jsonStringify } from './helpers';
import type { RA } from './types';

/**
 * Spy on the calls to these console so that can include all console
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
export const consoleLog: {
  readonly message: RA<unknown>;
  readonly type: typeof logTypes[number];
  readonly date: string;
}[] = [];

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
    // eslint-disable-next-line no-console
    const defaultFunction = console[logType];
    // eslint-disable-next-line no-console
    console[logType] = (...args: RA<unknown>): void => {
      defaultFunction(...args);
      consoleLog.push({
        message: args.map((value) =>
          typeof value === 'function'
            ? value.toString()
            : value === undefined
            ? 'undefined'
            : typeof value === 'object'
            ? jsonStringify(value)
            : value
        ),
        type: logType,
        date: new Date().toJSON(),
      });
    };
  });
}
