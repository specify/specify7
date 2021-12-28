import { load } from './initialcontext';
import type { IR, R } from './types';

const prefs: R<string> = {};

export const fetchContext = load<string>(
  '/context/remoteprefs.properties',
  'text/plain'
).then((text) =>
  text
    .split('\n')
    .filter((line) => !line.startsWith('#'))
    .forEach((line) => {
      const match = /([^=]+)=(.+)/.exec(line);
      if (match) prefs[match[1]] = match[2];
    })
);

export default prefs as IR<string>;
