import React from 'react';
import { SpecifyResource } from '../DataModel/legacyTypes';
import { AnySchema } from '../DataModel/helperTypes';
import { RecordSelectorFromPage } from '../FormSliders/RecordSelectorFromPage';
import { f } from '../../utils/functools';
import { Relationship } from '../DataModel/specifyField';
import { useDeleteBlockerPages } from './useDeleteBlockerPages';
import { useReferenceCount } from './useReferenceCount';
import { blockerPageToCacheKey, buildPageCacheKey } from './pageCache';

export function DeleteBlockersPaginator({
  parentResource,
  relationship,
  dialog,
  onClose: handleClose,
}: {
  readonly parentResource: SpecifyResource<AnySchema>;
  readonly relationship: Relationship;
  readonly dialog: false | 'modal' | 'nonModal';
  readonly onClose: () => void;
}): JSX.Element {
  const {
    page,
    pageMetaData,
    pageSize,
    onNextPageFetch: handleNextPageFetch,
    onResourceDeletion: handleResourceDeletion,
  } = useDeleteBlockerPages(parentResource, relationship);

  const referenceCount = useReferenceCount(parentResource, relationship);

  return (
    <RecordSelectorFromPage
      page={page}
      pageKey={React.useMemo(
        () =>
          buildPageCacheKey(
            parentResource,
            relationship.table.name,
            relationship.name
          ),
        [parentResource, relationship]
      )}
      pageSize={pageSize}
      pageMetaData={pageMetaData}
      dialog={dialog}
      table={relationship.table}
      title={undefined}
      totalCount={referenceCount}
      onNextPageFetch={handleNextPageFetch}
      onClose={handleClose}
      onDelete={handleResourceDeletion}
      onSaved={f.void}
    />
  );
}
