import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useSearchParameter } from '../../hooks/navigation';
import { useAsyncState } from '../../hooks/useAsyncState';
import { useErrorContext } from '../../hooks/useErrorContext';
import { f } from '../../utils/functools';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { getResourceViewUrl } from '../DataModel/resource';
import { getModel, schema } from '../DataModel/schema';
import type { RecordSet } from '../DataModel/types';
import { RecordSetWrapper } from '../FormSliders/RecordSet';
import { interactionTables } from '../Interactions/InteractionsDialog';
import { ProtectedTable } from '../Permissions/PermissionDenied';
import { NotFoundView } from '../Router/NotFoundView';
import { locationToState, useStableLocation } from '../Router/RouterState';
import { CheckLoggedInCollection, ViewResourceByGuid } from './DataTask';
import { ResourceView } from './ResourceView';
import {
  deserializeResource,
  serializeResource,
} from '../DataModel/serializers';
import { useMenuItem } from '../Header/MenuContext';

export function ShowResource({
  resource,
}: {
  readonly resource: SpecifyResource<AnySchema>;
}): JSX.Element | null {
  // Look to see if we are in the context of a Record Set
  const [recordsetid] = useSearchParameter('recordsetid');
  const recordSetId = f.parseInt(recordsetid);
  const [recordSet] = useAsyncState<SpecifyResource<RecordSet> | false>(
    React.useCallback(
      () =>
        typeof recordSetId === 'number'
          ? new schema.models.RecordSet.Resource({
              id: recordSetId,
            }).fetch()
          : false,
      [recordSetId]
    ),
    true
  );

  useErrorContext('recordSet', recordSet);
  useErrorContext('resource', resource);

  useMenuItem(
    typeof recordSet === 'object'
      ? 'recordSets'
      : interactionTables.has(resource.specifyModel.name)
      ? 'interactions'
      : 'dataEntry'
  );

  const navigate = useNavigate();
  return recordSet === undefined ? null : typeof recordSet === 'object' ? (
    <RecordSetWrapper
      recordSet={recordSet}
      resource={resource}
      onClose={(): void => navigate('/specify/')}
    />
  ) : (
    <ResourceView
      dialog={false}
      isDependent={false}
      isSubForm={false}
      mode="edit"
      resource={resource}
      viewName={resource.specifyModel.view}
      onAdd={(newResource): void =>
        navigate(
          getResourceViewUrl(
            newResource.specifyModel.name,
            undefined,
            recordSetId
          ),
          {
            state: {
              type: 'RecordSet',
              resource: serializeResource(newResource),
            },
          }
        )
      }
      onClose={f.never}
      onDeleted={f.void}
      onSaved={(): void => navigate(resource.viewUrl())}
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
  readonly id: string | undefined;
}): JSX.Element {
  const model = getModel(tableName);
  const location = useStableLocation(useLocation());
  const state = locationToState(location, 'RecordSet');
  const record = React.useMemo(
    () => f.maybe(state?.resource, deserializeResource),
    [state?.resource]
  );
  const isInRecordSet = typeof state === 'object';

  const numericId = f.parseInt(id);
  const resource = React.useMemo(
    () =>
      typeof model === 'object'
        ? record ?? new model.Resource({ id: numericId })
        : undefined,
    [model, record, numericId]
  );

  if (
    (numericId === undefined && id?.toLowerCase() !== 'new') ||
    model === undefined ||
    resource === undefined
  )
    return <NotFoundView />;
  else if (reGuid.test(id ?? ''))
    return <ViewResourceByGuid guid={id!} model={model} />;
  else
    return (
      <ProtectedTable
        action={numericId === undefined ? 'create' : 'read'}
        tableName={model.name}
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
