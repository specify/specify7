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
          resource={resource}
          records={blockers}
          activeRelationshipKey={paginatorKey?.relationshipKey}
          useSmallLayout={useSmallLayout}
          onRelationshipActive={handleSetPaginatorKey}
        />
        {!useSmallLayout && paginatorKey !== undefined && (
          <DeleteBlockersPaginator
            dialog={false}
            onClose={() => setPaginatorDialogOpen(false)}
            onAllBlockersDeleted={() => setPaginatorKey(undefined)}
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
            onAllBlockersDeleted={() => setPaginatorKey(undefined)}
            parentResource={paginatorKey.resource}
            relationship={paginatorKey.relationship}
          />
        )}
    </>
  );
}
