import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { ping } from '../../utils/ajax/ping';

/**
 * Trigger an error for test purposes.
 * Also helps to verify if back-end is running in debug mode
 */
export function TestErrorCommand(): null {
  useAsyncState(
    React.useCallback(async () => ping('/api/test_error/'), []),
    true
  );
  return null;
}
