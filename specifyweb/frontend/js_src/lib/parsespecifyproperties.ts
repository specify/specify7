import type { IR } from './types';
import { filterArray } from './types';

export const parseSpecifyProperties = (props = ''): IR<string> =>
  Object.fromEntries(
    filterArray(
      props.split(';').map((line) => /([^=]+)=(.+)/.exec(line)?.slice(1, 3))
    )
  );
