/**
 * Capture log output to a variable. Allows attaching log output to
 * stack traces.
 *
 * Similar to "Output Buffering" in PHP
 * (https://www.php.net/outcontrol)
 */

import type { IR, RA, WritableArray } from '../../utils/types';
import { deduplicateLogContext, getLogContext } from './logContext';

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
  // Context is not a real type, but is used by deduplicateLogContext()
  readonly type: typeof logTypes[number] | 'context';
  readonly date: string;
  readonly context: IR<unknown>;
};
export const consoleLog: WritableArray<LogMessage> = [];

export function serializeConsoleLog(
  log: RA<LogMessage>
): ReturnType<typeof deduplicateLogContext> {
  const { consoleLog, sharedLogContext } = deduplicateLogContext(log);
  return {
    consoleLog: consoleLog.map(({ message, context, ...rest }) => ({
      ...rest,
      message: message.map(toSafeObject),
      context: toSafeObject(context) as IR<unknown>,
    })),
    sharedLogContext,
  };
}

/**
 * Syncer emits validation messages as console.log (convenient,
 * and familiar). Since we intercept console.log calls anyway,
 * we can capture the log output to an array and then present that
 * in the UI as validation messages.
 */
let redirectLog = false;
let temporaryLog: typeof consoleLog = [];
export function captureLogOutput<T>(
  callback: () => T
): readonly [typeof consoleLog, T] {
  if (redirectLog) throw new Error('Already capturing log output');
  redirectLog = true;
  try {
    const result = callback();
    return [temporaryLog, result];
  } finally {
    redirectLog = false;
    temporaryLog = [];
  }
}

/**
 * Convert any value to a JSON serializable object
 *
 * Most of the time this in not needed. It is needed when serializing
 * unknown data type (i.e, in error messages)
 */
export function toSafeObject(object: unknown): unknown {
  const cache = new Set<unknown>();

  function convert(value: unknown): unknown {
    if (typeof value === 'function') return value.toString();
    else if (value === undefined || value === null) return null;
    else if (Array.isArray(value)) return value.map(convert);
    else if (typeof value === 'object')
      if (cache.has(value)) return '[Circular]';
      else {
        cache.add(value);
        // Note: this removes Symbols
        return Object.fromEntries(
          Object.entries(value).map(([key, value]) => [key, convert(value)])
        );
      }
    else return value;
  }

  return convert(object);
}

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
      const context = getLogContext();
      const hasContext = Object.keys(context).length > 0;

      // Silencing https://github.com/reactjs/react-modal/issues/808
      if (
        args[0] ===
        "React-Modal: Cannot register modal instance that's already open"
      )
        return;

      /**
       * If actively redirecting log output, don't print to console
       * (printing object to console prevents garbage collection
       * on that object), unless in development
       */
      if (process.env.NODE_ENV === 'development' || !redirectLog)
        defaultFunction(...args, ...(hasContext ? [context] : []));

      const store = redirectLog ? temporaryLog : consoleLog;
      store.push({
        message: args,
        type: logType,
        date: new Date().toJSON(),
        context,
      });
    };
  });
}
