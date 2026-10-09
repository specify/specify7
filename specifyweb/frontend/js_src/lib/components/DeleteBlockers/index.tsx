import React from 'react';
import { SpecifyResource } from '../DataModel/legacyTypes';
import { AnySchema } from '../DataModel/helperTypes';
import { Relationship } from '../DataModel/specifyField';
import { useDeleteBlockersForResource } from './useDeleteBlockersForResource';
import { useScreenSize } from '../../hooks/useScreenSize';
import { DeleteBlockersAside } from './DeleteBlockersAside';
import { DeleteBlockersPaginator } from './DeleteBlockersPaginator';

export function NewDeleteBlockers({
  resource,
}: {
  readonly resource: SpecifyResource<AnySchema>;
}) {
  const records = useDeleteBlockersForResource(resource);

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

  const isMediumScreen = useScreenSize('md');

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
      setPaginatorDialogOpen(!isMediumScreen);
    },
    []
  );

  return records === undefined ? null : (
    <>
      <div className="relative flex flex-1 gap-4 overflow-hidden md:flex-row">
        <DeleteBlockersAside
          records={records}
          activeRelationshipKey={paginatorKey?.relationshipKey}
          onRelationshipActive={handleSetPaginatorKey}
        />
        {isMediumScreen && paginatorKey !== undefined && (
          <DeleteBlockersPaginator
            dialog={false}
            onClose={() => setPaginatorDialogOpen(false)}
            parentResource={paginatorKey.resource}
            relationship={paginatorKey.relationship}
          />
        )}
      </div>
      {!isMediumScreen &&
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
