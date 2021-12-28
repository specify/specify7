import type { IR } from './types';

export default (props = ''): IR<string> =>
  Object.fromEntries(
    props
      .split(';')
      .map((line) => /([^=]+)=(.+)/.exec(line)?.slice(1, 3))
      .filter((match): match is [string, string] => Array.isArray(match))
  );
