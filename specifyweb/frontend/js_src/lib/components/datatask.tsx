/**
 * Handle URLs that correspond to displaying a resource or a record set
 */

import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { fetchCollection } from '../collection';
import type { RecordSet } from '../datamodel';
import type { AnySchema } from '../datamodelutils';
import {
  fetchCollectionsForResource,
  getCollectionForResource,
} from '../domain';
import { f } from '../functools';
import type { SpecifyResource } from '../legacytypes';
import { hasTablePermission } from '../permissionutils';
import { formatUrl, parseUrl } from '../querystring';
import { getResourceViewUrl } from '../resource';
import { ResourceBase } from '../resourceapi';
import { getModel, getModelById, schema } from '../schema';
import type { SpecifyModel } from '../specifymodel';
import { defined } from '../types';
import { useAsyncState } from './hooks';
import { NotFoundView } from './notfoundview';
import { OtherCollection } from './othercollectionview';
import {
  ProtectedTable,
  ProtectedTool,
  TablePermissionDenied,
} from './permissiondenied';
import { usePref } from './preferenceshooks';
import { ShowResource } from './resourceview';
import { switchCollection } from './switchcollection';

const reGuid = /[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}/u;

export function ViewRecordSet(): JSX.Element {
  const { id = '', index = '0' } = useParams();
  const recordSetId = f.parseInt(id);
  const resourceIndex = f.parseInt(index);

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
}): null {
  const [recordToOpen] = usePref('form', 'recordSet', 'recordToOpen');
  const navigate = useNavigate();
  useAsyncState(
    React.useCallback(
      async () =>
        fetchCollection('RecordSetItem', {
          recordSet: recordSet.id,
          offset: resourceIndex,
          orderBy: recordToOpen === 'first' ? 'id' : '-id',
          limit: 1,
        }).then(({ records }) =>
          navigate(
            formatUrl(
              getResourceViewUrl(
                getModelById(recordSet.get('dbTableId')).name,
                records[0]?.recordId ?? 'new'
              ),
              { recordSetId: recordSet.id.toString() }
            )
          )
        ),
      [recordSet, resourceIndex, recordToOpen]
    ),
    true
  );
  return null;
}

/** Begins the process of creating a new resource */
export function NewResourceView(): JSX.Element {
  const { tableName = '' } = useParams();
  const { state } = useLocation();
  const resource = (
    state as { readonly resource: SpecifyResource<AnySchema> | undefined }
  )?.resource;
  const parsedTableName = getModel(tableName)?.name;

  return typeof parsedTableName === 'string' ? (
    <ProtectedTable action="create" tableName={parsedTableName}>
      {typeof resource === 'object' && resource instanceof ResourceBase ? (
        <ShowResource recordSet={undefined} resource={resource} />
      ) : (
        <DisplayResource id={undefined} tableName={parsedTableName} />
      )}
    </ProtectedTable>
  ) : (
    <NotFoundView />
  );
}

export function ViewResource(): JSX.Element {
  const { tableName = '', id } = useParams();
  return <DisplayResource id={id} tableName={tableName} />;
}

/**
 * Shows user's individual resources which can optionally be in the context of
 * some recordset
 *
 * id may be a record id, or GUID (for Collection Objects)
 */
function DisplayResource({
  tableName,
  id,
}: {
  readonly tableName: string;
  readonly id: string | undefined;
}): JSX.Element {
  const model = getModel(tableName);

  if (model === undefined) {
    return <NotFoundView />;
  } else if (typeof id === 'string' && !hasTablePermission(model.name, 'read'))
    return <TablePermissionDenied action="read" tableName={model.name} />;
  else if (reGuid.test(id ?? ''))
    return <ViewResourceByGuid guid={id!} model={model} />;
  else {
    const resource = new model.Resource({ id });

    // Look to see if we are in the context of a recordset
    const parameters = parseUrl();
    const recordSetId = f.parseInt(parameters.recordsetid);
    const recordSet =
      typeof recordSetId === 'number'
        ? new schema.models.RecordSet.Resource({
            id: recordSetId,
          })
        : undefined;
    // @ts-expect-error Assigning to readonly
    if (typeof recordSet === 'object') resource.recordsetid = recordSet.id;

    return (
      <CheckLoggedInCollection resource={resource}>
        <ShowResource recordSet={recordSet} resource={resource} />
      </CheckLoggedInCollection>
    );
  }
}

export function ViewResourceByGuid({
  model,
  guid,
}: {
  readonly model: SpecifyModel;
  readonly guid: string;
}): JSX.Element | null {
  const [resource] = useAsyncState(
    React.useCallback(async () => {
      const collection = new model.LazyCollection({ filters: { guid } });
      return collection
        .fetch({ limit: 1 })
        .then(({ models }) => models[0] ?? false);
    }, [model, guid]),
    true
  );
  return typeof resource === 'object' ? (
    <CheckLoggedInCollection resource={resource}>
      <ShowResource recordSet={undefined} resource={resource} />
    </CheckLoggedInCollection>
  ) : resource === false ? (
    <NotFoundView />
  ) : null;
}

export function ViewByCatalog(): JSX.Element {
  return (
    <ProtectedTable action="read" tableName="CollectionObject">
      <ProtectedTable action="read" tableName="Collection">
        <ViewByCatalogProtected />
      </ProtectedTable>
    </ProtectedTable>
  );
}

function ViewByCatalogProtected(): JSX.Element | null {
  const { collection: rawCollection = '', catalogNumber: rawCatNumber = '' } =
    useParams();

  const navigate = useNavigate();
  const [resource] = useAsyncState<SpecifyResource<AnySchema> | false>(
    React.useCallback(async () => {
      const collectionLookup = new schema.models.Collection.LazyCollection({
        filters: { code: decodeURIComponent(rawCollection) },
      });
      const collections = await collectionLookup.fetch({ limit: 1 });
      if (collections.models.length === 0) {
        console.error('Unable to find the collection');
        return false;
      } else if (collections._totalCount !== 1) {
        console.error('Multiple collections with code:', collections.models);
        return false;
      }
      const collection = collections.models[0];
      if (collection.id !== schema.domainLevelIds.collection) {
        switchCollection(navigate, collection.id);
        return undefined;
      }

      const formatter = defined(
        schema.models.CollectionObject.getLiteralField('catalogNumber')
      ).getUiFormatter();

      let catNumber = decodeURIComponent(rawCatNumber);
      if (typeof formatter === 'object') {
        const formatted = formatter.format(catNumber);
        if (formatted === undefined) {
          console.error('bad catalog number:', catNumber);
          return false;
        }
        catNumber = formatted;
      }

      const collectionObjects =
        new schema.models.CollectionObject.LazyCollection({
          filters: { catalognumber: catNumber },
          domainfilter: true,
        });
      const { models } = await collectionObjects.fetch({ limit: 1 });
      if (models.length === 0) {
        console.error('Unable to find collection object');
        return false;
      } else return models[0];
      return undefined;
    }, [rawCollection, rawCatNumber]),
    true
  );

  return typeof resource === 'object' ? (
    <ShowResource recordSet={undefined} resource={resource} />
  ) : resource === false ? (
    <NotFoundView />
  ) : null;
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
