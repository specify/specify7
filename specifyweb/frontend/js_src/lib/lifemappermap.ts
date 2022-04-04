import { ajax } from './ajax';
import type { CollectionObject, Taxon } from './datamodel';
import type { LocalityData } from './leafletutils';
import type { SpecifyResource } from './legacytypes';
import {
  defaultRecordFilterFunction,
  fetchLocalityDataFromLocalityResource,
  formatLocalityDataObject,
  parseLocalityPinFields,
} from './localityrecorddataextractor';
import { schema } from './schema';
import type { RA } from './types';
import { f } from './functools';
import { toTable } from './specifymodel';

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
  if (typeof taxon === 'undefined') return [];

  const parsedLocalityFields = parseLocalityPinFields(true);

  const commonFieldConfig = {
    isrelfld: false,
    sorttype: 0,
    isnot: false,
  };

  const {
    data: { results },
  } = await ajax<{
    readonly results: RA<[number, number, number, ...RA<string>]>;
  }>('/stored_query/ephemeral/', {
    method: 'POST',
    headers: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Accept: 'application/json',
    },
    body: {
      name: 'Lifemapper Local Occurrence query',
      contextname: 'CollectionObject',
      contexttableid: 1,
      limit: LIMIT + 1,
      selectdistinct: false,
      countonly: false,
      specifyuser: '/api/specify/specifyuser/1/',
      isfavorite: true,
      ordinal: 32_767,
      formatauditrecids: false,
      fields: [
        {
          ...commonFieldConfig,
          tablelist: '1,9-determinations,4',
          stringid: '1,9-determinations,4.taxon.taxonid',
          fieldname: 'taxonid',
          isdisplay: false,
          startvalue: `${taxon.get('id')}`,
          operstart: 1,
          position: 0,
        },
        {
          ...commonFieldConfig,
          tablelist: '1,9-determinations',
          stringid: '1,9-determinations.determination.isCurrent',
          fieldname: 'isCurrent',
          isdisplay: false,
          startvalue: '',
          operstart: 6,
          position: 1,
        },
        {
          ...commonFieldConfig,
          tablelist: '1,10',
          stringid: '1,10.collectingevent.collectingeventid',
          fieldname: 'collectingeventid',
          isdisplay: true,
          startvalue: '',
          operstart: 1,
          position: 2,
        },
        {
          ...commonFieldConfig,
          isdisplay: true,
          startvalue: '',
          query: '/api/specify/spquery/',
          position: 3,
          tablelist: '1,10,2',
          stringid: '1,10,2.locality.localityid',
          fieldname: 'localityid',
          operstart: 1,
        },
        ...parsedLocalityFields.map(([fieldName], index) => ({
          ...commonFieldConfig,
          isdisplay: true,
          startvalue: '',
          query: '/api/specify/spquery/',
          position: 4 + index,
          tablelist: '1,10,2',
          stringid: `1,10,2.locality.${fieldName}`,
          fieldname: fieldName,
          operstart: 1,
        })),
      ],
      offset: 0,
    },
  });

  return results
    .slice(0, LIMIT)
    .map(
      ([
        collectionObjectId,
        collectingEventId,
        localityId,
        ...localityData
      ]) => {
        return {
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
            return fetchLocalityDataFromLocalityResource(
              await locality.fetchPromise(),
              false,
              (mappingPathParts, resource) =>
                (typeof resource?.specifyModel?.name !== 'string' ||
                  ((resource.specifyModel.name !== 'CollectionObject' ||
                    resource.id === collectionObjectId) &&
                    (resource.specifyModel.name !== 'CollectingEvent' ||
                      resource.id === collectingEventId))) &&
                defaultRecordFilterFunction(mappingPathParts, resource)
            );
          },
        };
      }
    )
    .filter(
      (occurrenceData): occurrenceData is OccurrenceData =>
        typeof occurrenceData.localityData === 'object'
    );
};
