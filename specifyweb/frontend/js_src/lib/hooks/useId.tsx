import React from 'react';

import type { R } from '../utils/types';

const idStore: R<number> = {};
/**
 * A hook that returns a unique string ID generator that is unique
 * and unchanging for the lifecycle of a component
 *
 * @remarks
 * No matter which prefix is chosen, the final ID is guaranteed to be unique
 * among all components. Thus, you shouldn't worry about prefixes being globally
 * unique. The specific prefix does not matter at all, except it makes debugging
 * easier.
 *
 * Update:
 * React 18 added a useId hook that serves a similar purpose. However, there
 * are some advantages to using this useId implementation:
 *   - Generated IDs use a human-readable prefix, rather than `:r0:` to make
 *     debugging easier. React's implementation is better at avoiding conflicts,
 *     but it shouldn't be a problem since IDs are not widely used in Specify 7,
 *     other than for accessibility in forms.
 *   - React.useId generates only one ID, where as it is common to need several
 *     IDs at once. While you could use that ID and manually concat different
 *     suffixes, this useId implementation returns a suffix-awere function to
 *     begin with. If you don't need a suffix, then just call this hook like this:
 *     ```js
 *     const id = useId('somePrefix')('');
 *     ```
 */
export function useId(prefix: string): (suffix: string) => string {
  const id = React.useRef(-1);

  const resolvedPrefix = `${prefix}-`;

  if (!(resolvedPrefix in idStore)) idStore[resolvedPrefix] = 0;

  if (id.current === -1) {
    id.current = idStore[resolvedPrefix];
    idStore[resolvedPrefix] += 1;
  }

  return React.useCallback(
    (suffix = ''): string =>
      `${resolvedPrefix}${id.current}${suffix ? `-${suffix}` : ''}`,
    [resolvedPrefix]
  );
}
