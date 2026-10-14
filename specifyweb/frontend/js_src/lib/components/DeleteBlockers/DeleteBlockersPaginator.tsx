import React from 'react';
import { SpecifyResource } from '../DataModel/legacyTypes';
import { AnySchema } from '../DataModel/helperTypes';
import { RecordSelectorFromPage } from '../FormSliders/RecordSelectorFromPage';
import { f } from '../../utils/functools';
import { Relationship } from '../DataModel/specifyField';
import { useDeleteBlockerPages } from './useDeleteBlockerPages';
import { buildPageCacheKey } from './pageCache';

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
    onResourceDeletion: handleResourceDeletion,
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

  // FEAT: use the Relationships reference count in the paginator?
  // const referenceCount = useRelationshipReferenceCount(
  //   parentResource,
  //   relationship
  // );

  return (
    <RecordSelectorFromPage
      page={page}
      pageKey={pageKey}
      pageSize={pageSize}
      pageMetaData={pageMetaData}
      dialog={dialog}
      table={relationship.table}
      title={undefined}
      onNextPageFetch={handleNextPageFetch}
      onClose={handleClose}
      onDelete={handleResourceDeletion}
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
