import React from 'react';
import { SpecifyResource } from '../DataModel/legacyTypes';
import { AnySchema } from '../DataModel/helperTypes';
import { Relationship } from '../DataModel/specifyField';
import { useScreenSize } from '../../hooks/useScreenSize';
import { DeleteBlockersAside } from './DeleteBlockersAside';
import { DeleteBlockersPaginator } from './DeleteBlockersPaginator';
import { DeleteBlockerResource } from './store';
import { RA } from '../../utils/types';
import { useLiveState } from '../../hooks/useLiveState';

// BUG: For formatted records which have a lot of text but little/no word
// wrapping (like Attachment records which format to their file path), this is
// still inadequate as the navigation controls can render far "off-screen"
export const MIN_DELETEBLOCKER_CONTAINER_WIDTH = 768;

export function DeleteBlockers({
  blockers,
  useSmallLayout: initialUseSmallLayout = false,
}: {
  readonly blockers: RA<DeleteBlockerResource> | undefined;
  readonly useSmallLayout?: boolean;
}) {
  const [paginatorKey, setPaginatorKey] = React.useState<
    | undefined
    | {
        readonly resource: SpecifyResource<AnySchema>;
        readonly relationship: Relationship;
        readonly relationshipKey: string | undefined;
      }
  >(undefined);

  const isLargeScreen = useScreenSize('lg');

  const useSmallLayout = initialUseSmallLayout || !isLargeScreen;

  const [isPaginatorDialogOpen, setPaginatorDialogOpen] = useLiveState(
    React.useCallback(() => useSmallLayout, [useSmallLayout])
  );

  const handleSetPaginatorKey = React.useCallback(
    (
      resource: SpecifyResource<AnySchema>,
      relationship: Relationship,
      relationshipKey: string
    ) => {
      setPaginatorKey(() => ({
        resource,
        relationship,
        relationshipKey,
      }));
    },
    [useSmallLayout]
  );

  return blockers === undefined ? null : (
    <>
      <div className="relative flex flex-1 gap-4 overflow-hidden md:flex-row">
        <DeleteBlockersAside
          records={blockers}
          activeRelationshipKey={paginatorKey?.relationshipKey}
          useSmallLayout={useSmallLayout}
          onRelationshipActive={handleSetPaginatorKey}
        />
        {!useSmallLayout && paginatorKey !== undefined && (
          <DeleteBlockersPaginator
            dialog={false}
            onClose={() => setPaginatorDialogOpen(false)}
            parentResource={paginatorKey.resource}
            relationship={paginatorKey.relationship}
          />
        )}
      </div>
      {useSmallLayout &&
        paginatorKey !== undefined &&
        isPaginatorDialogOpen && (
          <DeleteBlockersPaginator
            dialog={'nonModal'}
            onClose={() => setPaginatorKey(undefined)}
            parentResource={paginatorKey.resource}
            relationship={paginatorKey.relationship}
          />
        )}
    </>
  );
}
