import React from 'react';

import { useBooleanState } from './useBooleanState';
import { crash } from '../components/Errors/Crash';

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
    handleFetched();
    // Fetch until there is a scroll bar
    setTimeout(
      (): void =>
        scrollerRef.current !== null &&
        scrollerRef.current.scrollWidth !== scrollerRef.current.clientWidth
          ? void doFetch().catch(crash)
          : undefined,
      0
    );
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
