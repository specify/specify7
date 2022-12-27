import type { IR } from '../../../utils/types';

export const generateInit =
  (dictionary: IR<string>): ((name: string) => string | undefined) =>
  (name) =>
    dictionary[name];
