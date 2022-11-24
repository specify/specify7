import React from 'react';

import { useSearchParameter } from '../../hooks/navigation';
import { useErrorContext } from '../../hooks/useErrorContext';
import { useTriggerState } from '../../hooks/useTriggerState';
import { f } from '../../utils/functools';
import type { AnySchema } from '../DataModel/helperTypes';
import { SerializedResource } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { getModel, schema } from '../DataModel/schema';
import { useMenuItem } from '../Header';
import { interactionTables } from '../Interactions/InteractionsDialog';
import { hasTablePermission } from '../Permissions/helpers';
import { TablePermissionDenied } from '../Permissions/PermissionDenied';
import { NotFoundView } from '../Router/NotFoundView';
import { CheckLoggedInCollection, ViewResourceByGuid } from './DataTask';
import { RecordSetWrapper } from '../FormSliders/RecordSet';
import { ResourceView } from './ResourceView';
import { overwriteReadOnly } from '../../utils/types';
import { getResourceViewUrl } from '../DataModel/resource';
import { serializeResource } from '../DataModel/helpers';
import { useLocation, useNavigate } from 'react-router-dom';
import { deserializeResource } from '../../hooks/resource';
import { useAsyncState } from '../../hooks/useAsyncState';
import { RecordSet } from '../DataModel/types';

export function ShowResource({
  resource: initialResource,
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

  const [resource, setResource] = useTriggerState(initialResource);
  useErrorContext('resource', resource);

  React.useEffect(() => {
    if (typeof recordSet === 'object')
      // REFACTOR: get rid of this to decrease complexity of Resource.Base
      overwriteReadOnly(resource, 'recordsetid', recordSet.id);
  }, [recordSet, resource.recordsetid]);

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
      resource={resource}
      recordSet={recordSet}
      onClose={(): void => navigate('/specify/')}
    />
  ) : (
    <ResourceView
      canAddAnother
      dialog={false}
      isDependent={false}
      isSubForm={false}
      mode="edit"
      resource={resource}
      viewName={resource.specifyModel.view}
      onClose={f.never}
      onDeleted={f.void}
      onSaved={({ wasNew, newResource }): void => {
        if (typeof newResource === 'object')
          navigate(
            getResourceViewUrl(
              newResource.specifyModel.name,
              undefined,
              recordSetId
            ),
            {
              state: { resource: serializeResource(newResource) },
            }
          );
        else if (wasNew) navigate(resource.viewUrl());
        else {
          const reloadResource = new resource.specifyModel.Resource({
            id: resource.id,
          });
          // @ts-expect-error Assigning to read-only
          reloadResource.recordsetid = resource.recordsetid;
          reloadResource.fetch().then(async () => setResource(reloadResource));
        }
      }}
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
  const { state } = useLocation();
  const serializedResource = (
    state as { readonly resource: SerializedResource<AnySchema> | undefined }
  )?.resource;
  const record = React.useMemo(
    () => f.maybe(serializedResource, deserializeResource),
    [serializedResource]
  );

  const resource = React.useMemo(
    () =>
      typeof model === 'object'
        ? record ?? new model.Resource({ id })
        : undefined,
    [model, record, id]
  );

  if (model === undefined || resource === undefined) {
    return <NotFoundView />;
  } else if (typeof id === 'string' && !hasTablePermission(model.name, 'read'))
    return <TablePermissionDenied action="read" tableName={model.name} />;
  else if (reGuid.test(id ?? ''))
    return <ViewResourceByGuid guid={id!} model={model} />;
  else
    return (
      <CheckLoggedInCollection resource={resource}>
        <ShowResource resource={resource} />
      </CheckLoggedInCollection>
    );
}
