import type { CollectionObject, Taxon } from '../DataModel/types';
import { f } from '../../utils/functools';
import type { LocalityData } from '../Leaflet/helpers';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import {
  defaultRecordFilterFunction,
  fetchLocalityDataFromResource,
  formatLocalityDataObject,
  parseLocalityPinFields,
} from '../Leaflet/localityRecordDataExtractor';
import { schema } from '../DataModel/schema';
import { treeRanksPromise } from '../InitialContext/treeRanks';
import type { RA } from '../../utils/types';
import { serializeResource, toTable } from '../DataModel/helpers';
import { runQuery } from '../../utils/ajax/specifyApi';
import { createQuery } from '../QueryBuilder';
import { QueryFieldSpec } from '../QueryBuilder/fieldSpec';
import { anyTreeRank, formatTreeRank } from '../WbPlanView/mappingHelpers';
import { queryFieldFilters } from '../QueryBuilder/FieldFilter';

export type OccurrenceData = {
  readonly collectionObjectId: number;
  readonly collectingEventId: number;
  readonly localityId: number;
  readonly localityData: LocalityData;
  readonly fetchMoreData: () => Promise<LocalityData | false>;
};

export const fetchLocalOccurrences = async (
  resource: SpecifyResource<CollectionObject> | SpecifyResource<Taxon>
): Promise<RA<OccurrenceData>> => {
  const LIMIT = 10_000;

  const taxon =
    toTable(resource, 'Taxon') ??
    (await f.maybe(
      toTable(resource, 'CollectionObject'),
      async (collectionObject) =>
        collectionObject
          .rgetCollection('determinations')
          .then(({ models }) => models.find((model) => model.get('isCurrent')))
          .then((determination) => determination?.rgetPromise('taxon'))
    ));
  if (taxon === undefined) return [];

  const parsedLocalityFields = parseLocalityPinFields(true);

  await treeRanksPromise;

  const results = await runQuery<
    readonly [number, number, number, ...RA<string>]
  >(
    serializeResource(
      createQuery(
        'Lifemapper Local Occurrence query',
        schema.models.CollectionObject
      ).set('fields', [
        QueryFieldSpec.fromPath('CollectionObject', [
          'determinations',
          'taxon',
          formatTreeRank(anyTreeRank),
          'id',
        ])
          .toSpQueryField()
          .set('operStart', queryFieldFilters.equal.id)
          .set('startValue', `${taxon.get('id')}`)
          .set('isDisplay', false),
        QueryFieldSpec.fromPath('CollectionObject', [
          'determinations',
          'isCurrent',
        ])
          .toSpQueryField()
          .set('operStart', queryFieldFilters.true.id)
          .set('isDisplay', false),
        QueryFieldSpec.fromPath('CollectionObject', [
          'collectingEvent',
          'id',
        ]).toSpQueryField(),
        QueryFieldSpec.fromPath('CollectionObject', [
          'collectingEvent',
          'locality',
          'id',
        ]).toSpQueryField(),
        ...parsedLocalityFields.map(([fieldName]) =>
          QueryFieldSpec.fromPath('CollectionObject', [
            'collectingEvent',
            'locality',
            fieldName,
          ]).toSpQueryField()
        ),
      ])
    ),
    {
      limit: LIMIT + 1,
    }
  );

  return results
    .map(
      ([
        collectionObjectId,
        collectingEventId,
        localityId,
        ...localityData
      ]) => ({
        collectionObjectId,
        collectingEventId,
        localityId,
        localityData: formatLocalityDataObject(
          parsedLocalityFields.map((mappingPath, index) => [
            mappingPath,
            localityData[index],
          ])
        ),
        fetchMoreData: async (): Promise<LocalityData | false> => {
          const locality = new schema.models.Locality.Resource({
            id: localityId,
          });
          return fetchLocalityDataFromResource(
            await locality.fetch(),
            false,
            (mappingPathParts, resource) =>
              (typeof resource !== 'object' ||
                !('specifyModel' in resource) ||
                ((resource.specifyModel.name !== 'CollectionObject' ||
                  resource.id === collectionObjectId) &&
                  (resource.specifyModel.name !== 'CollectingEvent' ||
                    resource.id === collectingEventId))) &&
              defaultRecordFilterFunction(mappingPathParts, resource)
          );
        },
      })
    )
    .filter(
      (occurrenceData): occurrenceData is OccurrenceData =>
        typeof occurrenceData.localityData === 'object'
    );
};
