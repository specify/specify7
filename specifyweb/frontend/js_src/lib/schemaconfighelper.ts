import { RA } from './components/wbplanview';

export const sortObjectsByKey = <KEY extends string, T extends Record<KEY, unknown>>(
  objects: RA<T>,
  key: KEY
): RA<T> =>
  Array.from(objects).sort(({ [key]: keyLeft }, { [key]: keyRight }) =>
    keyLeft > keyRight ? 1 : keyLeft === keyRight ? 0 : -1
  );