import React from 'react';

import type { GetOrSet } from '../utils/types';

/**
 * Like React.useState, but updates the state whenever default value changes
 *
 * @remarks
 * During usage, make sure defaultValue isn't passed by reference.
 * If it does, either use useLiveState with callback or instead memoize defaultValue
 * with React.useMemo and then pass.
 */
export function useTriggerState<T>(defaultValue: T): GetOrSet<T> {
  const [state, setState] = React.useState<T>(defaultValue);

  /* Using layout effect rather than useEffect to update the state earlier */
  React.useLayoutEffect(() => setState(defaultValue), [defaultValue]);

  return [state, setState];
}
