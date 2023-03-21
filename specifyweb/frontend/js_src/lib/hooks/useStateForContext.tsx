import React from 'react';

import type { GetOrSet } from '../utils/types';

/**
 * React.useState returns an array of two elements. First is the value of the
 * state. Second is the callback to change the state.
 * The callback function has a stable reference (the same function is always
 * returned)
 * The state value also has a stable reference, unless state is manually
 * changed.
 * However, the array in which the state and the callback are wrapped changes
 * on each render. This is a problem if you want to pass down the array in a
 * context.
 *
 * This hooks memoizes the array that contains the state and the callback. The
 * array only changes when the state changes.
 */
export function useStateForContext<T>(defaultValue: T): GetOrSet<T> {
  const [state, setState] = React.useState(defaultValue);
  return React.useMemo(() => [state, setState], [state]);
}
