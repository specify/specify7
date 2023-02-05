import { ajax } from '../../utils/ajax';
import type { IR, RA } from '../../utils/types';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import type { CollectionObject } from '../DataModel/types';
import { softFail } from '../Errors/Crash';
import { formatUrl } from '../Router/queryString';

export const snServer = 'https://broker.spcoco.org';

export const fetchLocalScientificName = async (
  model: SpecifyResource<CollectionObject>,
  defaultValue = ''
): Promise<string> =>
  model.rgetCollection('determinations').then(({ models: determinations }) =>
    determinations.length === 0
      ? defaultValue
      : determinations[0]
          .rgetPromise('preferredTaxon')
          .then((preferredTaxon) => preferredTaxon?.get('fullName'))
          .then((scientificName) =>
            typeof scientificName === 'string' ? scientificName : defaultValue
          )
  );

export const formatLifemapperViewPageRequest = (
  occurrenceGuid: string,
  speciesName: string
): string =>
  formatUrl(`${snServer}/api/v1/frontend/`, {
    occId: occurrenceGuid,
    nameStr: speciesName,
    origin: globalThis.location.origin,
  });

export const formatOccurrenceDataRequest = (occurrenceGuid: string): string =>
  formatUrl(`${snServer}/api/v1/occ/${occurrenceGuid}`, { count_only: '0' });

export const fetchOccurrenceName = async (
  resource: SpecifyResource<CollectionObject>
): Promise<string> =>
  resource
    .fetch()
    .then(async () =>
      ajax<{
        readonly records: RA<{
          readonly records: RA<IR<string>>;
        }>;
      }>(
        formatOccurrenceDataRequest(resource.get('guid')),
        {
          mode: 'cors',
          headers: { Accept: 'application/json' },
        },
        { strict: false }
      )
    )
    .then(({ data }) =>
      data.records
        .filter(({ records }) => records.length > 0)
        .map(({ records }) => records[0]['dwc:scientificName'])
        .find(Boolean)
    )
    .catch(softFail)
    .then(
      (remoteOccurrence) =>
        remoteOccurrence ?? fetchLocalScientificName(resource)
    )
    .catch(softFail)
    .then((occurrenceName) => occurrenceName ?? '');
