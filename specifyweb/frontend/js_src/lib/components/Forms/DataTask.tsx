/**
 * Handle URLs that correspond to displaying a resource or a record set
 */

import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { State } from 'typesafe-reducer';

import { useSearchParameter } from '../../hooks/navigation';
import { useAsyncState } from '../../hooks/useAsyncState';
import { useCachedState } from '../../hooks/useCachedState';
import { commonText } from '../../localization/common';
import { userText } from '../../localization/user';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { LoadingContext } from '../Core/Contexts';
import { fetchCollection } from '../DataModel/collection';
import {
  fetchCollectionsForResource,
  getCollectionForResource,
} from '../DataModel/domain';
import { getField } from '../DataModel/helpers';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { getResourceViewUrl } from '../DataModel/resource';
import { getModel, getModelById, schema } from '../DataModel/schema';
import type { SpecifyModel } from '../DataModel/specifyModel';
import type { CollectionObject, RecordSet } from '../DataModel/types';
import { userInformation } from '../InitialContext/userInformation';
import { Dialog } from '../Molecules/Dialog';
import { ProtectedTable, ProtectedTool } from '../Permissions/PermissionDenied';
import { userPreferences } from '../Preferences/userPreferences';
import { NotFoundView } from '../Router/NotFoundView';
import { formatUrl } from '../Router/queryString';
import { switchCollection } from '../RouterCommands/SwitchCollection';
import { OtherCollection } from './OtherCollectionView';
import { ViewResourceById } from './ShowResource';

export function ViewRecordSet(): JSX.Element {
  const { id, index } = useParams();
  const recordSetId = f.parseInt(id);
  const resourceIndex = f.parseInt(index) ?? 0;

  return typeof recordSetId === 'number' &&
    typeof resourceIndex === 'number' ? (
    <ProtectedTool action="read" tool="recordSets">
      <RecordSetView recordSetId={recordSetId} resourceIndex={resourceIndex} />
    </ProtectedTool>
  ) : (
    <NotFoundView />
  );
}

function RecordSetView({
  resourceIndex,
  recordSetId,
}: {
  readonly resourceIndex: number;
  readonly recordSetId: number;
}): JSX.Element | null {
  const [recordSet] = useAsyncState(
    React.useCallback(
      async () =>
        new schema.models.RecordSet.Resource({
          id: recordSetId,
        })
          .fetch()
          .then((recordSet) => recordSet ?? false),
      [recordSetId]
    ),
    true
  );
  // eslint-disable-next-line no-nested-ternary
  return typeof recordSet === 'object' ? (
    <CheckLoggedInCollection resource={recordSet}>
      <DisplayRecordSet recordSet={recordSet} resourceIndex={resourceIndex} />
    </CheckLoggedInCollection>
  ) : recordSet === false ? (
    <NotFoundView />
  ) : null;
}

function DisplayRecordSet({
  recordSet,
  resourceIndex,
}: {
  readonly recordSet: SpecifyResource<RecordSet>;
  readonly resourceIndex: number;
}): JSX.Element | null {
  const [recordToOpen] = userPreferences.use(
    'form',
    'recordSet',
    'recordToOpen'
  );
  const navigate = useNavigate();

  const [isReadOnly = false] = useCachedState('forms', 'readOnlyMode');

  const [readOnlyState, setReadOnlyState] = React.useState(false);

  useAsyncState(
    React.useCallback(
      async () =>
        fetchCollection('RecordSetItem', {
          recordSet: recordSet.id,
          offset: resourceIndex,
          orderBy: recordToOpen === 'first' ? 'id' : '-id',
          limit: 1,
        }).then(({ records }) =>
          isReadOnly && records.length === 0
            ? setReadOnlyState(true)
            : navigate(
                formatUrl(
                  getResourceViewUrl(
                    getModelById(recordSet.get('dbTableId')).name,
                    records[0]?.recordId ?? 'new'
                  ),
                  { recordSetId: recordSet.id.toString() }
                ),
                {
                  replace: true,
                }
              )
        ),
      [recordSet, resourceIndex, recordToOpen]
    ),
    true
  );
  return readOnlyState ? (
    <Dialog
      buttons={commonText.close()}
      header={userText.permissionDeniedError()}
      onClose={(): void => navigate('/specify/')}
    >
      {userText.emptyRecordSetsReadOnly({
        recordSetTable: schema.models.RecordSet.label,
      })}
    </Dialog>
  ) : null;
}

/** Begins the process of creating a new resource */
export function ViewResource(): JSX.Element {
  const { tableName = '', id } = useParams();
  const parsedTableName = getModel(tableName)?.name;

  return typeof parsedTableName === 'string' ? (
    <ViewResourceById id={id} tableName={parsedTableName} />
  ) : (
    <NotFoundView />
  );
}

// FEATURE: consider displaying the resource without changing the URL
export function ViewResourceByGuid({
  model,
  guid,
}: {
  readonly model: SpecifyModel;
  readonly guid: string;
}): JSX.Element | null {
  const [id] = useAsyncState<number | false>(
    React.useCallback(
      async () =>
        fetchCollection((model as SpecifyModel<CollectionObject>).name, {
          guid,
          limit: 1,
        }).then(({ records }) => records[0]?.id ?? false),
      [model, guid]
    ),
    true
  );

  const navigate = useNavigate();
  React.useEffect(
    () =>
      typeof id === 'number'
        ? navigate(getResourceViewUrl(model.name, id), { replace: true })
        : undefined,
    [id]
  );
  return id === false ? <NotFoundView /> : null;
}

export function ViewResourceByCatalog(): JSX.Element {
  return (
    <ProtectedTable action="read" tableName="CollectionObject">
      <ViewByCatalogProtected />
    </ProtectedTable>
  );
}

function ViewByCatalogProtected(): JSX.Element | null {
  const { collectionCode = '', catalogNumber = '' } = useParams();
  const [recordSetId] = useSearchParameter('recordsetid');

  const navigate = useNavigate();
  const [id] = useAsyncState<number | false>(
    React.useCallback(async () => {
      const collection = userInformation.availableCollections.find(
        ({ code }) => code?.trim() === collectionCode.trim()
      );
      if (collection === undefined) {
        console.error(
          `Unable to find the collection with code ${collectionCode}\n` +
            `Please make sure collection code is specified correctly and ` +
            `the user has access to the collection.`
        );
        return false;
      }
      if (collection.id !== schema.domainLevelIds.collection) {
        switchCollection(navigate, collection.id);
        return undefined;
      }

      /*
       * It's important that this is run after switchCollection() (if needed)
       * so that the formatter for correct collection is fetched
       */
      const formatter = getField(
        schema.models.CollectionObject,
        'catalogNumber'
      ).getUiFormatter();

      let formattedNumber = catalogNumber;
      if (typeof formatter === 'object') {
        const formatted = formatter.format(catalogNumber);
        if (formatted === undefined) {
          console.error('bad catalog number:', catalogNumber);
          return false;
        }
        formattedNumber = formatted;
      }

      return fetchCollection('CollectionObject', {
        catalogNumber: formattedNumber,
        domainFilter: true,
        limit: 1,
      }).then(({ records }) => {
        const id = records[0]?.id;
        if (typeof id === 'number') return id;
        console.error('Unable to find the resource');
        return false;
      });
    }, [collectionCode, catalogNumber, navigate]),
    true
  );

  React.useEffect(
    () =>
      typeof id === 'number'
        ? navigate(
            getResourceViewUrl('CollectionObject', id, f.parseInt(recordSetId)),
            {
              replace: true,
            }
          )
        : undefined,
    [navigate, id, recordSetId]
  );

  return id === false ? <NotFoundView /> : null;
}

/**
 * Check if it makes sense to view this resource when logged into current
 * collection
 */
export function CheckLoggedInCollection({
  resource,
  children,
  /*
   * As a performance optimization, don't check if in record set. Safe to assume
   * that if any record set item is from this collection, than all record set
   * items are from this collection (this will initially be called with
   * isInRecordSet=false when you open the record set)
   */
  isInRecordSet = false,
}: {
  readonly resource: SpecifyResource<AnySchema>;
  readonly children: JSX.Element;
  readonly isInRecordSet?: boolean;
}): JSX.Element | null {
  const [otherCollections, setOtherCollections] = React.useState<
    | State<'Accessible'>
    | State<'Inaccessible', { readonly collectionIds: RA<number> }>
    | State<'Loading'>
  >({ type: 'Loading' });
  const loading = React.useContext(LoadingContext);
  React.useEffect(() => {
    if (isInRecordSet || resource.isNew()) {
      setOtherCollections({ type: 'Accessible' });
      return;
    }
    setOtherCollections({ type: 'Loading' });
    loading(
      resource
        .fetch()
        .then<typeof otherCollections>(async () => {
          const collectionId = getCollectionForResource(resource);
          if (schema.domainLevelIds.collection === collectionId)
            return { type: 'Accessible' };
          else if (typeof collectionId === 'number')
            return {
              type: 'Inaccessible',
              collectionIds: [collectionId],
            } as const;
          else {
            const collectionIds = await fetchCollectionsForResource(resource);
            return !Array.isArray(collectionIds) ||
              collectionIds.includes(schema.domainLevelIds.collection)
              ? { type: 'Accessible' }
              : { type: 'Inaccessible', collectionIds };
          }
        })
        .then(setOtherCollections)
    );
  }, [resource, isInRecordSet]);

  return otherCollections.type === 'Accessible' ? (
    children
  ) : otherCollections.type === 'Inaccessible' ? (
    <OtherCollection collectionIds={otherCollections.collectionIds} />
  ) : null;
}
