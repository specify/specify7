import type { IR } from '../../utils/types';
import { overwriteReadOnly } from '../../utils/types';

const dictionary: IR<boolean> = {
  '(prefers-reduced-motion: reduce)': false,
  '(prefers-contrast: more)': false,
  '(prefers-color-scheme: dark)': true,
  '(prefers-reduced-transparency: reduce)': false,
};

Object.defineProperty(globalThis, 'matchMedia', {
  value: (query: string) => {
    if (!(query in dictionary))
      throw new Error(`Unmocked matchMedia query: ${query}`);
    const result = dictionary[query];
    const eventTarget = new EventTarget() as MediaQueryList;
    overwriteReadOnly(eventTarget, 'matches', result);
    return eventTarget;
  },
});
