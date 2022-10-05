import React from 'react';
import { useNavigate } from 'react-router-dom';

import { useSearchParameter } from '../../hooks/navigation';
import { useAsyncState } from '../../hooks/useAsyncState';
import { useErrorContext } from '../../hooks/useErrorContext';
import { useTriggerState } from '../../hooks/useTriggerState';
import { f } from '../../utils/functools';
import { fetchCollection } from '../DataModel/collection';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { getModel, schema } from '../DataModel/schema';
import { crash } from '../Errors/Crash';
import { useMenuItem } from '../Header';
import { interactionTables } from '../Interactions/InteractionsDialog';
import { hasTablePermission } from '../Permissions/helpers';
import { TablePermissionDenied } from '../Permissions/PermissionDenied';
import { NotFoundView } from '../Router/NotFoundView';
import { CheckLoggedInCollection, ViewResourceByGuid } from './DataTask';
import { RecordSet as RecordSetView } from '../FormSliders/RecordSet';
import { ResourceView } from './ResourceView';
import { overwriteReadOnly } from '../../utils/types';

export function ShowResource({
  resource: initialResource,
}: {
  readonly resource: SpecifyResource<AnySchema>;
}): JSX.Element | null {
  // Look to see if we are in the context of a recordset
  const [recordsetid = ''] = useSearchParameter('recordsetid');
  const recordSetId = f.parseInt(recordsetid);
  const recordSet = React.useMemo(
    () =>
      typeof recordSetId === 'number'
        ? new schema.models.RecordSet.Resource({
            id: recordSetId,
          })
        : undefined,
    [recordSetId]
  );
  useErrorContext('recordSet', recordSet);

  const [resource, setResource] = useTriggerState(initialResource);
  useErrorContext('resource', resource);

  React.useEffect(() => {
    if (typeof recordSet === 'object')
      overwriteReadOnly(resource, 'recordsetid', recordSet.id);
  }, [recordSet, resource.recordsetid]);

  useMenuItem(
    typeof recordSet === 'object'
      ? 'recordSets'
      : interactionTables.has(resource.specifyModel.name)
      ? 'interactions'
      : 'dataEntry'
  );

  const [recordSetItemIndex] = useAsyncState(
    React.useCallback(async () => {
      await recordSet?.fetch();
      if (resource.isNew()) return 0;
      return typeof recordSet === 'object'
        ? fetchCollection('RecordSetItem', {
            recordSet: recordSet.id,
            limit: 1,
            recordId: resource.id,
          })
            .then(({ records }) =>
              f.maybe(records[0]?.id, async (recordSetItemId) =>
                fetchCollection(
                  'RecordSetItem',
                  {
                    recordSet: recordSet.id,
                    limit: 1,
                  },
                  { id__lt: recordSetItemId }
                ).then(({ totalCount }) => totalCount)
              )
            )
            .catch(crash)
        : undefined;
    }, [recordSet, resource]),
    true
  );

  const navigate = useNavigate();
  return typeof recordSet === 'object' ? (
    recordSetItemIndex === undefined ? null : (
      <RecordSetView
        canAddAnother
        defaultResourceIndex={recordSetItemIndex}
        dialog={false}
        mode="edit"
        model={resource.specifyModel}
        recordSet={recordSet}
        onAdd={f.void}
        onClose={(): void => navigate('/specify/')}
        onSlide={f.void}
      />
    )
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
        if (typeof newResource === 'object') setResource(newResource);
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
 * some recordset
 *
 * id may be a record id, or GUID (for Collection Objects)
 */
export function DisplayResource({
  tableName,
  id,
}: {
  readonly tableName: string;
  readonly id: string | undefined;
}): JSX.Element {
  const model = getModel(tableName);
  const resource = React.useMemo(
    () => (typeof model === 'object' ? new model.Resource({ id }) : undefined),
    [model, id]
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
