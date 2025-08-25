import React from 'react';

/**
 * Provides a boolean which is set to true if some condition is met after a
 * provided timeout period. Useful to reduce layout/UI shifts when some
 * asynchronous operation is resolving
 *
 * Example:
 * ```js
 *  const somePromise = usePromise();
 *  const isLoading = somePromise === undefined;
 *  // 2 seconds
 *  const timeOut = 2 * SECONDS;
 *
 *  const [showLoadingScreen] = useDelay(isLoading, timeOut);
 *
 *  // show loading screen if has been fetching for over 2 seconds
 *  return isLoading && showLoadingScreen ? <LoadingScreen/> : ...
 *
 * ```
 */
export function useDelay(useDelay: boolean, timeOut: number): boolean {
  const [isInDelay, setInDelay] = React.useState<boolean>(false);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );

  React.useEffect(() => {
    if (timeoutRef.current !== undefined)
      globalThis.clearTimeout(timeoutRef.current);
    if (useDelay)
      timeoutRef.current = globalThis.setTimeout(
        () => setInDelay(true),
        timeOut
      );
  }, [useDelay, setInDelay]);

  return isInDelay;
}
