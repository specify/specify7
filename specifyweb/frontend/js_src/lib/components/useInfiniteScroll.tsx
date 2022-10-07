import React from 'react';

import { crash } from './errorboundary';
import { useBooleanState } from './hooks';

/**
 * Helps fetch more records when user is approaching the bottom of a list
 */
export function useInfiniteScroll(
  handleFetch: (() => Promise<void>) | undefined,
  scrollerRef: React.RefObject<HTMLElement | null>
): {
  readonly isFetching: boolean;
  readonly handleScroll: (event: React.UIEvent<HTMLElement>) => void;
} {
  const isFetchingRef = React.useRef<boolean>(false);
  const [isFetching, handleFetching, handleFetched] = useBooleanState();
  const doFetch = React.useCallback(async (): Promise<void> => {
    if (isFetchingRef.current || handleFetch === undefined) return undefined;
    isFetchingRef.current = true;
    handleFetching();
    await handleFetch();
    isFetchingRef.current = false;
    await new Promise((resolve) => setTimeout(resolve, 0));
    // Fetch until there is a scroll bar
    if (
      scrollerRef.current !== null &&
      scrollerRef.current.scrollHeight === scrollerRef.current.clientHeight
    )
      doFetch().catch(crash);
    handleFetched();
  }, [handleFetch, scrollerRef, handleFetching, handleFetched]);

  React.useEffect(() => void doFetch(), []);

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
