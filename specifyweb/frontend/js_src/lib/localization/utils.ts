import type { RA, RR } from '../components/wbplanview';

type Dictionary = RR<string, string | ((...args: RA<never>) => string)>;

export const createDictionary =
  <DICT extends Dictionary>(dictionary: DICT) =>
  <KEY extends keyof typeof dictionary>(
    key: KEY
  ): typeof dictionary[typeof key] =>
    dictionary[key];
