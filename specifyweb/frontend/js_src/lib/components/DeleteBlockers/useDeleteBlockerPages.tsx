import React from 'react';
import { SpecifyResource } from '../DataModel/legacyTypes';
import { AnySchema } from '../DataModel/helperTypes';
import { Relationship } from '../DataModel/specifyField';
import { DeleteBlockerLRUPage } from './pageCache';
import { PageMetaData } from '../FormSliders/RecordSelectorFromPage';
import { useDeleteBlockerStore } from './Context';

export function useDeleteBlockerPages(
  resource: SpecifyResource<AnySchema>,
  relationship: Relationship
): {
  readonly page: DeleteBlockerLRUPage | undefined;
  readonly pageMetaData: PageMetaData;
  readonly pageSize: number;
  readonly onNextPageFetch: (
    previous: DeleteBlockerLRUPage,
    direction: 'next' | 'previous' | 'first' | 'last'
  ) => Promise<void>;
} {
  const store = useDeleteBlockerStore();

  const [pageCursor, setPageCursor] = React.useState<{
    readonly anchor: number | null | 'last';
    readonly backwards: boolean;
  }>({
    anchor: null,
    backwards: false,
  });

  const deleteBlockerPage = React.useSyncExternalStore(store.subscribe, () =>
    store.getCachedPage(resource, relationship, pageCursor.anchor)
  );

  // When the cursor changes, this useEffect tells the DeleteBlockerStore to
  // fetch the page
  // The useSyncExternalStore will update deleteBlockerPage when the promise
  // resolves and the blockers are cached
  React.useEffect(() => {
    store.filterBlockers(
      resource,
      relationship,
      pageCursor.anchor,
      pageCursor.backwards
    );
  }, [store, resource, relationship, pageCursor]);

  async function handleNextPageFetch(
    previousPage: DeleteBlockerLRUPage,
    direction: 'next' | 'previous' | 'first' | 'last'
  ) {
    const backwards = direction === 'previous' || direction === 'last';

    if (direction === 'last') {
      setPageCursor(() => ({
        anchor: 'last',
        backwards: true,
      }));
      return;
    }
    if (direction === 'first') {
      setPageCursor(() => ({
        anchor: null,
        backwards: false,
      }));
      return;
    }
    if (previousPage.ids.length === 0) {
      setPageCursor(() => ({
        anchor: previousPage.anchor,
        backwards,
      }));
      return;
    }
    setPageCursor(() => ({
      anchor: previousPage.ids.at(-1) ?? null,
      backwards,
    }));
  }

  const isFirstPage =
    deleteBlockerPage?.anchor === null && !pageCursor.backwards;

  const isLastPage =
    deleteBlockerPage?.complete === true ||
    (deleteBlockerPage?.anchor === null && pageCursor.backwards);

  return {
    page: deleteBlockerPage,
    pageMetaData:
      isFirstPage && isLastPage
        ? 'single'
        : isFirstPage
          ? 'first'
          : isLastPage
            ? 'last'
            : undefined,
    pageSize: store.pageSize(),
    onNextPageFetch: handleNextPageFetch,
  };
}
