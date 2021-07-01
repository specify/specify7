import type { RA, RR } from '../components/wbplanview';

type Value = string | JSX.Element;
type Dictionary = RR<string, Value | ((...args: RA<never>) => Value)>;

function assertExhaustive(key: string): never {
  throw new Error(
    `Trying to access a value for a non existent localization key "${key}"`
  );
}

export const createDictionary =
  <DICT extends Dictionary>(dictionary: DICT) =>
  <KEY extends Extract<keyof typeof dictionary, string>>(
    key: KEY
  ): typeof dictionary[typeof key] =>
    key in dictionary ? dictionary[key] : assertExhaustive(key);

