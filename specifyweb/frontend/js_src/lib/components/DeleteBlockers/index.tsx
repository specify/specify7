import React from 'react';

import { useLiveState } from '../../hooks/useLiveState';
import { useScreenSize } from '../../hooks/useScreenSize';
import type { RA } from '../../utils/types';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { Relationship } from '../DataModel/specifyField';
import { DeleteBlockersAside } from './DeleteBlockersAside';
import { DeleteBlockersPaginator } from './DeleteBlockersPaginator';
import type { DeleteBlockerResource } from './store';

export const MIN_DELETEBLOCKER_CONTAINER_WIDTH = 768;

export function DeleteBlockers({
  blockers,
  resource,
  useSmallLayout: initialUseSmallLayout = false,
}: {
  readonly blockers: RA<DeleteBlockerResource> | undefined;
  readonly resource: SpecifyResource<AnySchema>;
  readonly useSmallLayout?: boolean;
}) {
  const [paginatorKey, setPaginatorKey] = React.useState<
    | undefined
    | {
        readonly resource: SpecifyResource<AnySchema>;
        readonly relationship: Relationship;
        readonly relationshipKey: string;
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
      <div className="relative flex flex-1 gap-4 overflow-x-auto md:flex-row">
        <DeleteBlockersAside
          activeRelationshipKey={paginatorKey?.relationshipKey}
          records={blockers}
          resource={resource}
          useSmallLayout={useSmallLayout}
          onRelationshipActive={handleSetPaginatorKey}
        />
        {!useSmallLayout && paginatorKey !== undefined && (
          <DeleteBlockersPaginator
            dialog={false}
            parentResource={paginatorKey.resource}
            relationship={paginatorKey.relationship}
            onAllBlockersDeleted={() => setPaginatorKey(undefined)}
            onClose={() => setPaginatorDialogOpen(false)}
          />
        )}
      </div>
      {useSmallLayout &&
        paginatorKey !== undefined &&
        isPaginatorDialogOpen && (
          <DeleteBlockersPaginator
            dialog="nonModal"
            parentResource={paginatorKey.resource}
            relationship={paginatorKey.relationship}
            onAllBlockersDeleted={() => setPaginatorKey(undefined)}
            onClose={() => setPaginatorKey(undefined)}
          />
        )}
    </>
  );
}
