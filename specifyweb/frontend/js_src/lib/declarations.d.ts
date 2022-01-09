import type { RA } from './types';

// Workaround for https://github.com/microsoft/TypeScript/issues/17002
declare global {
  interface ArrayConstructor {
    // eslint-disable-next-line @typescript-eslint/method-signature-style
    isArray(argument: RA<any> | any): argument is RA<any>;
  }
}
