import React from 'react';

import { f } from '../../utils/functools';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { Relationship } from '../DataModel/specifyField';
import { RecordSelectorFromPage } from '../FormSliders/RecordSelectorFromPage';
import { buildPageCacheKey } from './pageCache';
import { useDeleteBlockerPages } from './useDeleteBlockerPages';

export function DeleteBlockersPaginator({
  parentResource,
  relationship,
  dialog,
  onClose: handleClose,
  onAllBlockersDeleted: handleAllBlockersDeleted,
}: {
  readonly parentResource: SpecifyResource<AnySchema>;
  readonly relationship: Relationship;
  readonly dialog: false | 'modal' | 'nonModal';
  readonly onClose: () => void;
  readonly onAllBlockersDeleted: () => void;
}): JSX.Element {
  const {
    page,
    pageMetaData,
    pageSize,
    onNextPageFetch: handleNextPageFetch,
  } = useDeleteBlockerPages(
    parentResource,
    relationship,
    handleAllBlockersDeleted
  );

  const pageKey = React.useMemo(
    () =>
      buildPageCacheKey(
        parentResource,
        relationship.table.name,
        relationship.name
      ),
    [parentResource, relationship]
  );

  /*
   * FEAT: use the Relationships reference count in the paginator?
   * const referenceCount = useRelationshipReferenceCount(
   *   parentResource,
   *   relationship
   * );
   */

  return (
    <RecordSelectorFromPage
      dialog={dialog}
      page={page}
      pageKey={pageKey}
      pageMetaData={pageMetaData}
      pageSize={pageSize}
      table={relationship.table}
      title={undefined}
      onClose={handleClose}
      onNextPageFetch={handleNextPageFetch}
      onSaved={f.void}
      // Deleting a parent might not actually remove all of the blockers for
      // this relationship, but this behavior is currently OK as it lets the
      // blockers be re-updated and handles unrendering the Paginator (don't
      // have to worry about fetching and re-rendering the right page after
      // resource deletion, and how to handle the case where all records are
      // removed)
      onParentDeleted={handleAllBlockersDeleted}
    />
  );
}
