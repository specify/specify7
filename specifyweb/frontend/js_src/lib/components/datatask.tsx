/**
 * Handle URLs that correspond to displaying a resource or a record set
 */

import React from 'react';

import { error } from '../assert';
import { fetchCollection } from '../collection';
import type { RecordSet } from '../datamodel';
import type { AnySchema } from '../datamodelutils';
import {
  fetchCollectionsForResource,
  getCollectionForResource,
} from '../domain';
import { f } from '../functools';
import type { SpecifyResource } from '../legacytypes';
import { hasTablePermission } from '../permissions';
import { formatUrl, parseUrl } from '../querystring';
import { getResourceViewUrl } from '../resource';
import { router } from '../router';
import { getModel, getModelById, schema } from '../schema';
import { setCurrentComponent, switchCollection } from '../specifyapp';
import type { SpecifyModel } from '../specifymodel';
import { defined } from '../types';
import { useAsyncState } from './hooks';
import { navigate } from './navigation';
import { NotFoundView } from './notfoundview';
import { OtherCollection } from './othercollectionview';
import { ProtectedTool, TablePermissionDenied } from './permissiondenied';
import { ShowResource } from './resourceview';

const reGuid = /[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}/;

function recordSetView(
  recordSetIdString: string,
  resourceIndexString = '0'
): void {
  const recordSetId = f.parseInt(recordSetIdString);
  const resourceIndex = f.parseInt(resourceIndexString);
  setCurrentComponent(
    typeof recordSetId === 'number' && typeof resourceIndex === 'number' ? (
      <ProtectedTool tool="recordSets" action="read">
        <RecordSetView
          resourceIndex={resourceIndex}
          recordSetId={recordSetId}
        />
      </ProtectedTool>
    ) : (
      <NotFoundView />
    )
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
  return typeof recordSet === 'object' ? (
    <CheckLoggedInCollection resource={recordSet}>
      <DisplayRecordSet resourceIndex={resourceIndex} recordSet={recordSet} />
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
}): null {
  useAsyncState(
    React.useCallback(
      async () =>
        fetchCollection('RecordSetItem', {
          recordSet: recordSet.id,
          offset: resourceIndex,
          orderBy: 'id',
          limit: 1,
        }).then(({ records }) =>
          navigate(
            formatUrl(
              getResourceViewUrl(
                getModelById(recordSet.get('dbTableId')).name,
                records[0]?.recordId ?? 'new'
              ),
              { recordSetId: recordSet.id.toString() }
            ),
            {
              replace: true,
              trigger: true,
            }
          )
        ),
      [recordSet, resourceIndex]
    ),
    true
  );
  return null;
}

// Begins the process of creating a new resource
const newResourceView = async (tableName: string): Promise<void> =>
  f.var(getModel(tableName)?.name, async (tableName) =>
    typeof tableName === 'string'
      ? hasTablePermission(tableName, 'create')
        ? resourceView(tableName, undefined)
        : Promise.resolve(
            void setCurrentComponent(
              <TablePermissionDenied tableName={tableName} action="create" />
            )
          )
      : Promise.resolve(void setCurrentComponent(<NotFoundView />))
  );

/**
 * Shows user's individual resources which can optionally be in the context of
 * some recordset
 *
 * id may be a record id, or GUID (for Collection Objects)
 */
async function resourceView(
  modelName: string,
  id: string | undefined
): Promise<void> {
  const model = getModel(modelName);

  if (typeof model === 'undefined') {
    setCurrentComponent(<NotFoundView />);
    return undefined;
  } else if (
    typeof id === 'string' &&
    !hasTablePermission(model.name, 'read')
  ) {
    setCurrentComponent(
      <TablePermissionDenied tableName={model.name} action="read" />
    );
    return undefined;
  } else if (reGuid.test(id ?? '')) return viewResourceByGuid(model, id ?? '');

  // Look to see if we are in the context of a recordset

  const resource = new model.Resource({ id });

  const parameters = parseUrl();
  const recordSetId = f.parseInt(parameters.recordsetid);
  const recordSet =
    typeof recordSetId === 'number'
      ? new schema.models.RecordSet.Resource({
          id: recordSetId,
        })
      : undefined;
  if (typeof recordSet === 'object') resource.recordsetid = recordSet.id;

  setCurrentComponent(
    <CheckLoggedInCollection resource={resource}>
      {/*
       * We preload the resource and recordset to make sure they exist.
       * This prevents an unfilled view from being displayed.
       */}
      <ShowResource resource={resource} recordSet={await recordSet?.fetch()} />
    </CheckLoggedInCollection>
  );
}

async function viewResourceByGuid(
  model: SpecifyModel,
  guid: string
): Promise<void> {
  const collection = new model.LazyCollection({ filters: { guid } });
  return collection.fetch({ limit: 1 }).then(({ models }) => {
    setCurrentComponent(
      models.length === 1 ? (
        <CheckLoggedInCollection resource={models[0]}>
          <ShowResource resource={models[0]} recordSet={undefined} />
        </CheckLoggedInCollection>
      ) : (
        <NotFoundView />
      )
    );
  });
}

async function byCatNumber(
  rawCollection: string,
  rawCatNumber: string
): Promise<void> {
  if (!hasTablePermission('CollectionObject', 'read')) {
    setCurrentComponent(
      <TablePermissionDenied tableName="CollectionObject" action="read" />
    );
    return;
  } else if (!hasTablePermission('Collection', 'read')) {
    setCurrentComponent(
      <TablePermissionDenied tableName="Collection" action="read" />
    );
    return;
  }

  const collection = decodeURIComponent(rawCollection);
  let catNumber = decodeURIComponent(rawCatNumber);
  const collectionLookup = new schema.models.Collection.LazyCollection({
    filters: { code: collection },
  });
  return collectionLookup
    .fetch({ limit: 1 })
    .then((collections) => {
      if (collections.models.length === 0)
        error('Unable to find the collection');
      else if (collections._totalCount !== 1)
        error('Multiple collections with code:', collections);
      const collection = collections.models[0];
      if (collection.id !== schema.domainLevelIds.collection) {
        switchCollection(collection.id);
        return undefined;
      }

      const formatter = defined(
        schema.models.CollectionObject.getLiteralField('catalogNumber')
      ).getUiFormatter();
      if (typeof formatter === 'object') {
        const formatted = formatter.format(catNumber);
        if (typeof formatted === 'undefined')
          error('bad catalog number:', catNumber);
        catNumber = formatted;
      }

      const collectionObjects =
        new schema.models.CollectionObject.LazyCollection({
          filters: { catalognumber: catNumber },
          domainfilter: true,
        });
      return collectionObjects.fetch({ limit: 1 }).then(({ models }) => {
        if (models.length === 0) error('Unable to find collection object');
        setCurrentComponent(
          <ShowResource resource={models[0]} recordSet={undefined} />
        );
        return undefined;
      });
    })
    .catch(() => setCurrentComponent(<NotFoundView />));
}

/**
 * Check if it makes sense to view this resource when logged into current
 * collection
 */
function CheckLoggedInCollection({
  resource,
  children,
}: {
  readonly resource: SpecifyResource<AnySchema>;
  readonly children: JSX.Element;
}): JSX.Element | null {
  const [otherCollections] = useAsyncState(
    React.useCallback(
      () =>
        resource.isNew()
          ? false
          : resource
              .fetch()
              .then((resource) =>
                f.var(getCollectionForResource(resource), (collectionId) =>
                  schema.domainLevelIds.collection === collectionId
                    ? false
                    : typeof collectionId === 'number'
                    ? [collectionId]
                    : fetchCollectionsForResource(resource).then(
                        (collectionIds) =>
                          !Array.isArray(collectionIds) ||
                          collectionIds.includes(
                            schema.domainLevelIds.collection
                          )
                            ? false
                            : collectionIds
                      )
                )
              ),
      [resource]
    ),
    true
  );

  return otherCollections === false ? (
    children
  ) : Array.isArray(otherCollections) ? (
    <OtherCollection collectionIds={otherCollections} />
  ) : null;
}

export function task(): void {
  router.route('recordset/:id/', 'recordSetView', recordSetView);
  router.route('recordset/:id/:index/', 'recordSetView', recordSetView);
  router.route('view/:model/:id/', 'resourceView', resourceView);
  router.route('view/:model/new/', 'newResourceView', newResourceView);
  router.route('bycatalog/:collection/:catno/', 'byCatNum', byCatNumber);
}
