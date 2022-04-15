/**
 * Handle URLs that correspond to displaying a resource or a record set
 */

import { error } from './assert';
import { fetchCollection } from './collection';
import { crash } from './components/errorboundary';
import { OtherCollectionView } from './components/othercollectionview';
import { PermissionDenied } from './components/permissiondenied';
import { createBackboneView } from './components/reactbackboneextend';
import { ShowResource } from './components/resourceview';
import type { Tables } from './datamodel';
import type { AnySchema } from './datamodelutils';
import { collectionsForResource } from './domain';
import { f } from './functools';
import type { SpecifyResource } from './legacytypes';
import { NotFoundView } from './components/notfoundview';
import { hasTablePermission, hasToolPermission } from './permissions';
import { getResourceViewUrl } from './resource';
import { router } from './router';
import { getModel, getModelById, schema } from './schema';
import { setCurrentView, switchCollection } from './specifyapp';
import type { SpecifyModel } from './specifymodel';
import { defined } from './types';
import { formatUrl, parseUrl } from './querystring';
import { navigate } from './components/navigation';

const PermissionDeniedView = createBackboneView(PermissionDenied);

const reGuid = /[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}/;

async function recordSetView(idString: string, index = '0'): Promise<void> {
  if (!hasToolPermission('recordSets', 'read')) {
    setCurrentView(new PermissionDeniedView());
    return;
  }
  const id = Number.parseInt(idString);
  if (typeof id === 'undefined') {
    setCurrentView(new NotFoundView());
    return;
  }
  const recordSet = new schema.models.RecordSet.Resource({
    id,
  });
  return recordSet.fetch().then((recordSet) =>
    typeof recordSet === 'undefined'
      ? setCurrentView(new NotFoundView())
      : checkLoggedInCollection(
          recordSet,
          (): void =>
            void fetchCollection('RecordSetItem', {
              recordSet: recordSet.id,
              offset: Number.parseInt(index),
              limit: 1,
            })
              .then(({ records }) =>
                navigate(
                  formatUrl(
                    getResourceViewUrl(
                      getModelById(recordSet.get('dbTableId')).name,
                      records[0]?.recordId ?? 'new'
                    ),
                    { recordSetId: id.toString() }
                  ),
                  {
                    replace: true,
                    trigger: true,
                  }
                )
              )
              .catch(crash)
        ).catch(crash)
  );
}

// Begins the process of creating a new resource
const newResourceView = async (tableName: string): Promise<void> =>
  !hasTablePermission(tableName as keyof Tables, 'create')
    ? Promise.resolve(void setCurrentView(new NotFoundView()))
    : resourceView(tableName, undefined);

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
    setCurrentView(new NotFoundView());
    return undefined;
  } else if (
    typeof id === 'string' &&
    !hasTablePermission(model.name, 'read')
  ) {
    setCurrentView(new PermissionDeniedView());
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

  /*
   * We preload the resource and recordset to make sure they exist. this prevents
   * an unfilled view from being displayed.
   */
  return checkLoggedInCollection(
    resource,
    async (): Promise<void> =>
      setCurrentView(
        new ResourceView({
          resource,
          recordSet: await recordSet?.fetch(),
        })
      )
  ).catch(crash);
}

async function viewResourceByGuid(
  model: SpecifyModel,
  guid: string
): Promise<void> {
  const collection = new model.LazyCollection({ filters: { guid } });
  return collection.fetch({ limit: 1 }).then(({ models }) => {
    if (models.length === 0) {
      setCurrentView(new NotFoundView());
      return undefined;
    } else
      return checkLoggedInCollection(models[0], (): void =>
        setCurrentView(
          new ResourceView({
            resource: models[0],
            recordSet: undefined,
          })
        )
      ).catch(crash);
  });
}

async function byCatNumber(
  rawCollection: string,
  rawCatNumber: string
): Promise<void> {
  if (!hasTablePermission('CollectionObject', 'read')) {
    setCurrentView(new PermissionDeniedView());
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
        setCurrentView(
          new ResourceView({
            resource: models[0],
            recordSet: undefined,
          })
        );
        return undefined;
      });
    })
    .catch(() => setCurrentView(new NotFoundView()));
}

// Check if it makes sense to view this resource when logged into current collection
const checkLoggedInCollection = async (
  resource: SpecifyResource<AnySchema>,
  callback: () => void
): Promise<void> =>
  resource.isNew() ||
  f.includes<keyof Tables>(
    ['Institution', 'Discipline', 'Division'],
    resource.specifyModel.name
  )
    ? Promise.resolve(void callback())
    : collectionsForResource(resource).then((collections) =>
        !Array.isArray(collections) ||
        collections.some(({ id }) => id === schema.domainLevelIds.collection)
          ? callback()
          : setCurrentView(
              new OtherCollectionView({
                collections,
              })
            )
      );

const ResourceView = createBackboneView(ShowResource);

export function task(): void {
  router.route('recordset/:id/', 'recordSetView', recordSetView);
  router.route('recordset/:id/:index/', 'recordSetView', recordSetView);
  router.route('view/:model/:id/', 'resourceView', resourceView);
  router.route('view/:model/new/', 'newResourceView', newResourceView);
  router.route('bycatalog/:collection/:catno/', 'byCatNum', byCatNumber);
}
