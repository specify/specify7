import React from 'react';
import { SpecifyResource } from '../DataModel/legacyTypes';
import { AnySchema } from '../DataModel/helperTypes';
import { Relationship } from '../DataModel/specifyField';
import { useScreenSize } from '../../hooks/useScreenSize';
import { DeleteBlockersAside } from './DeleteBlockersAside';
import { DeleteBlockersPaginator } from './DeleteBlockersPaginator';
import { DeleteBlockerResource } from './store';
import { RA } from '../../utils/types';

export function DeleteBlockers({
  blockers,
}: {
  readonly blockers: RA<DeleteBlockerResource> | undefined;
}) {
  const [paginatorKey, setPaginatorKey] = React.useState<
    | undefined
    | {
        readonly resource: SpecifyResource<AnySchema>;
        readonly relationship: Relationship;
        readonly relationshipKey: string | undefined;
      }
  >(undefined);

  const [isPaginatorDialogOpen, setPaginatorDialogOpen] =
    React.useState<boolean>(false);

  const isLargeScreen = useScreenSize('lg');

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
      setPaginatorDialogOpen(!isLargeScreen);
    },
    []
  );

  return blockers === undefined ? null : (
    <>
      <div className="relative flex flex-1 gap-4 overflow-hidden md:flex-row">
        <DeleteBlockersAside
          records={blockers}
          activeRelationshipKey={paginatorKey?.relationshipKey}
          onRelationshipActive={handleSetPaginatorKey}
        />
        {isLargeScreen && paginatorKey !== undefined && (
          <DeleteBlockersPaginator
            dialog={false}
            onClose={() => setPaginatorDialogOpen(false)}
            parentResource={paginatorKey.resource}
            relationship={paginatorKey.relationship}
          />
        )}
      </div>
      {!isLargeScreen &&
        paginatorKey !== undefined &&
        isPaginatorDialogOpen && (
          <DeleteBlockersPaginator
            dialog={'nonModal'}
            onClose={() => setPaginatorDialogOpen(false)}
            parentResource={paginatorKey.resource}
            relationship={paginatorKey.relationship}
          />
        )}
    </>
  );
}
