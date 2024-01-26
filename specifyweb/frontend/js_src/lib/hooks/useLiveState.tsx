import React from 'react';

import type { GetOrSet } from '../utils/types';
import { useReadyEffect } from './useReadyEffect';

/**
 * A synchronous version of useAsyncState
 * Like React.useMemo, but with setState
 *
 * @remarks
 * Like React.useState, but default value must always be a function, and when
 * function changes, default value is recalculated and reapplied.
 *
 * Thus, wrap the callback in React.useCallback with dependency array that
 * would determine when the state is recalculated.
 *
 * @example
 * This will call getDefaultValue to get new default value every time
 * dependency changes
 * ```js
 * const [value, setValue] = useLiveState(
 *   React.useCallback(
 *     getDefaultValue,
 *     [dependency]
 *   )
 * );
 * ```
 */
export function useLiveState<T>(callback: () => T): GetOrSet<T> {
  const [state, setState] = React.useState<T>(callback);

  useReadyEffect(React.useCallback(() => setState(callback()), [callback]));

  return [state, setState];
}
