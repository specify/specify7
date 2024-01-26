import React from 'react';

/**
 * Like React.useEffect, but does not execute on first render.
 * Passed callback must be wrapped in React.useCallback
 */
export function useReadyEffect(callback: () => void): void {
  const isFirstRender = React.useRef(true);
  React.useEffect(() => {
    if (isFirstRender.current) isFirstRender.current = false;
    else callback();
  }, [callback]);
}
