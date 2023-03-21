/* An enum of HTTP status codes back-end commonly returns */
import type { RR } from '../types';

export const Http = {
  // You may add other codes as needed
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  FORBIDDEN: 403,
  CONFLICT: 409,
  TOO_LARGE: 413,
  MISDIRECTED: 421,
  HUGE_HEADER: 431,
  SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
  INSUFFICIENT_STORAGE: 507,
} as const;

/**
 * Human-friendly explanation of a likely cause of a given HTTP code
 */
export const httpCodeToErrorMessage: RR<number, string> = {
  [Http.CREATED]:
    'This error is likely caused by a bug in Specify. Please report it.',
  [Http.NO_CONTENT]:
    'This error is likely caused by a bug in Specify. Please report it.',
  [Http.BAD_REQUEST]:
    'This error is likely caused by a bug in Specify. Please report it.',
  [Http.NOT_FOUND]: `
    This error happened because you tried to access a resource that has been
    deleted or moved to a different location.
  `,
  [Http.FORBIDDEN]: `
    This error happened because you tried to access a resource you don't have
    access to, or your session has expired. Please try logging in again, or
    repeat the action as a user with more permissions
  `,
  // This error code is used by the front-end when request was aborted
  [Http.MISDIRECTED]: `
    This error happened because Specify failed to send a request to the server.
    Please try again, and if the problem persists, contact your system
    administrator.
  `,
  [Http.CONFLICT]: `
    This error happened because the resource you tried to update has already
    been modified by someone else. Please refresh the page and try again.
  `,
  [Http.TOO_LARGE]: `
    This error happened because you tried to upload a file that is larger than
    the configured server limit. Either contact your system administrator about
    increasing the limit, or try uploading a smaller file.
  `,
  [Http.HUGE_HEADER]:
    'Please try clearing your cookies or using a different browser.',
  [Http.SERVER_ERROR]: `
    This error may indicate a misconfiguration or a bug in Specify. Please
    double check your configuration and report this issue.
  `,
  [Http.UNAVAILABLE]: `
    This error happened because the server is overloaded or this resource is
    currently unavailable. Please try logging in again later.
  `,
  [Http.BAD_GATEWAY]: `
    This error likely happened because the server is down, is not yet started,
    or in a process of being restarted. If this issue does not resolve after a
    few minutes, contact your system administrator.
  `,
  [Http.GATEWAY_TIMEOUT]: `
    This error likely happened because the server is overloaded or you sent a
    large request. Please try again later.
  `,
  [Http.INSUFFICIENT_STORAGE]: `
    This error likely happened because the server has run out of storage space.
  `,
};
