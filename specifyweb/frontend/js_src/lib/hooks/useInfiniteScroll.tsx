import React from 'react';

import { raise } from '../components/Errors/Crash';
import { useBooleanState } from './useBooleanState';

/**
 * Helps fetch more records when user is approaching the bottom of a list
 */
export function useInfiniteScroll(
  handleFetch: (() => Promise<unknown>) | undefined,
  scroller: React.RefObject<HTMLElement | null>
): {
  readonly isFetching: boolean;
  readonly handleScroll: (event: React.UIEvent<HTMLElement>) => void;
} {
  const isFetchingRef = React.useRef<boolean>(false);
  const [isFetching, handleFetching, handleFetched] = useBooleanState();

  const doFetch = React.useCallback(async (): Promise<void> => {
    if (isFetchingRef.current || handleFetchRef.current === undefined) return;
    isFetchingRef.current = true;
    handleFetching();
    await handleFetchRef.current();
    isFetchingRef.current = false;
    await new Promise((resolve) => setTimeout(resolve, 0));
    // Fetch until there is a scroll bar
    if (
      scroller.current !== null &&
      // Check if element is rendered
      scroller.current.scrollHeight !== 0 &&
      scroller.current.scrollHeight <= scroller.current.clientHeight
    )
      doFetch().catch(raise);
    handleFetched();
  }, [scroller, handleFetching, handleFetched]);

  const handleFetchRef = React.useRef(handleFetch);
  React.useEffect(() => {
    handleFetchRef.current = handleFetch;
    if (scroller.current !== null) void doFetch();
  }, [scroller, doFetch, handleFetch]);

  return {
    isFetching,
    handleScroll: ({ target }): void =>
      isScrolledBottom(target as HTMLElement) ? undefined : void doFetch(),
  };
}

const threshold = 20;
const isScrolledBottom = (scrollable: HTMLElement): boolean =>
  scrollable.scrollHeight - scrollable.scrollTop - scrollable.clientHeight >
  threshold;
