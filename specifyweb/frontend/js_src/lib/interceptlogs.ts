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
    // eslint-disable-next-line no-console
    const defaultFunction = console[logType];
    // eslint-disable-next-line no-console
    console[logType] = (...args: RA<unknown>): void => {
      defaultFunction(...args);
      consoleLog.push({
        message: args.map((value) =>
          typeof value === 'function'
            ? value.toString()
            : typeof value === 'undefined'
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
