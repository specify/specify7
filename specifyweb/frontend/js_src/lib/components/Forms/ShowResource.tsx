import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useSearchParameter } from '../../hooks/navigation';
import { useAsyncState } from '../../hooks/useAsyncState';
import { useErrorContext } from '../../hooks/useErrorContext';
import { hijackBackboneAjax } from '../../utils/ajax/backboneAjax';
import { Http } from '../../utils/ajax/definitions';
import { f } from '../../utils/functools';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { getResourceViewUrl } from '../DataModel/resource';
import { deserializeResource } from '../DataModel/serializers';
import { getTable, tables } from '../DataModel/tables';
import type { RecordSet } from '../DataModel/types';
import { RecordSetWrapper } from '../FormSliders/RecordSet';
import { useMenuItem } from '../Header/MenuContext';
import { interactionTables } from '../Interactions/config';
import { ProtectedTable } from '../Permissions/PermissionDenied';
import { NotFoundView } from '../Router/NotFoundView';
import { locationToState } from '../Router/RouterState';
import { CheckLoggedInCollection, ViewResourceByGuid } from './DataTask';

export function ShowResource({
  resource,
}: {
  readonly resource: SpecifyResource<AnySchema>;
}): JSX.Element | null {
  // Look to see if we are in the context of a Record Set
  const [recordsetid] = useSearchParameter('recordSetId');
  const recordSetId = f.parseInt(recordsetid);
  const [recordSet] = useAsyncState<SpecifyResource<RecordSet>>(
    React.useCallback(
      async () =>
        typeof recordSetId === 'number'
          ? hijackBackboneAjax(
              [Http.OK, Http.NOT_FOUND],
              async () =>
                new tables.RecordSet.Resource({
                  id: recordSetId,
                }).fetch(),
              (status) =>
                status === Http.NOT_FOUND
                  ? navigate(
                      getResourceViewUrl(
                        resource.specifyTable.name,
                        resource.id
                      ),
                      { replace: true }
                    )
                  : undefined
            )
          : new tables.RecordSet.Resource({
              dbTableId: resource.specifyTable.tableId,
              type: 0,
            }),
      [recordSetId]
    ),
    true
  );

  useErrorContext('recordSet', recordSet);
  useErrorContext('resource', resource);

  useMenuItem(
    typeof recordSetId === 'number'
      ? 'recordSets'
      : interactionTables.has(resource.specifyTable.name)
        ? 'interactions'
        : 'dataEntry'
  );

  const navigate = useNavigate();
  return recordSet === undefined ? null : (
    <RecordSetWrapper
      recordSet={recordSet}
      resource={resource}
      onClose={(): void => navigate('/specify/')}
    />
  );
}

const reGuid = /[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}/u;

/**
 * Shows user's individual resources which can optionally be in the context of
 * some Record Set
 *
 * id may be a record id, or GUID (for Collection Objects)
 */
export function ViewResourceById({
  tableName,
  id,
}: {
  readonly tableName: string;
  // Undefined if you wish to see a new resource
  readonly id: string | undefined;
}): JSX.Element {
  const table = getTable(tableName);
  const location = useLocation();
  const state = locationToState(location, 'RecordSet');
  const record = React.useMemo(
    () => f.maybe(state?.resource, deserializeResource),
    [state?.resource]
  );
  const isInRecordSet = typeof state === 'object';

  const numericId = f.parseInt(id);
  const resource = React.useMemo(
    () =>
      typeof table === 'object'
        ? (record ?? new table.Resource({ id: numericId }))
        : undefined,
    [table, record, numericId]
  );

  if (
    (numericId === undefined && id?.toLowerCase() !== 'new') ||
    table === undefined ||
    resource === undefined
  )
    return <NotFoundView />;
  else if (reGuid.test(id ?? ''))
    return <ViewResourceByGuid guid={id!} table={table} />;
  else
    return (
      <ProtectedTable
        action={numericId === undefined ? 'create' : 'read'}
        tableName={table.name}
      >
        <CheckLoggedInCollection
          isInRecordSet={isInRecordSet}
          resource={resource}
        >
          <ShowResource resource={resource} />
        </CheckLoggedInCollection>
      </ProtectedTable>
    );
}
