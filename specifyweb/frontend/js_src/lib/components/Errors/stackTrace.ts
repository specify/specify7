import { errorContext } from '../../hooks/useErrorContext';
import { f } from '../../utils/functools';
import type { IR } from '../../utils/types';
import { jsonStringify, removeKey } from '../../utils/utils';
import { softFail } from './Crash';
import { consoleLog } from './interceptLogs';

let resolvedStackTrace: IR<unknown> = { stackTrace: 'loading' };
f.all({
  tablePermissions: import('../Permissions').then(({ getTablePermissions }) =>
    getTablePermissions()
  ),
  systemInformation: import('../InitialContext/systemInfo').then(
    ({ getSystemInfo }) => getSystemInfo()
  ),
  operationPermissions: import('../Permissions').then(
    ({ getOperationPermissions }) => getOperationPermissions()
  ),
  errorContext: Array.from(errorContext),
  schema: import('../DataModel/schema').then(({ schema }) =>
    removeKey(schema, 'models')
  ),
  remotePrefs: import('../InitialContext/remotePrefs').then(
    ({ remotePrefs }) => remotePrefs
  ),
  user: import('../UserPreferences/helpers').then(({ getRawPreferences }) =>
    getRawPreferences.user()
  ),
  userInformation: import('../InitialContext/userInformation').then(
    ({ userInformation }) => userInformation
  ),
})
  .then((data) => {
    resolvedStackTrace = data;
    return data;
  })
  .catch(softFail);

/**
 * The stack trace is about 83KB in size
 */
export const produceStackTrace = (message: unknown): string =>
  jsonStringify({
    message,
    ...resolvedStackTrace,
    href: globalThis.location.href,
    consoleLog,
    pageHtml: document.documentElement.outerHTML,
    localStorage: { ...localStorage },
    // Network log and page load telemetry
    eventLog: globalThis.performance.getEntries(),
    navigator: {
      userAgent: navigator.userAgent,
      language: navigator.language,
    },
  });
