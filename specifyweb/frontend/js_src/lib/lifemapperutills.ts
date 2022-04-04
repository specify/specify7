import type { CollectionObject } from './datamodel';
import type { SpecifyResource } from './legacytypes';
import { snServer } from './lifemapperconfig';
import type { IR, RA } from './types';

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
  `${snServer}/api/v1/frontend/?occid=${occurrenceGuid}&namestr=${speciesName}&origin=${window.location.origin}`;

export const formatOccurrenceDataRequest = (occurrenceGuid: string): string =>
  `${snServer}/api/v1/occ/${occurrenceGuid}?count_only=0`;

export async function fetchOccurrenceName(
  model: SpecifyResource<CollectionObject>
): Promise<string> {
  return fetch(formatOccurrenceDataRequest(model.get('guid')), {
    mode: 'cors',
  })
    .then(async (response) => response.json())
    .then(
      (response: {
        readonly records: RA<{
          readonly records: RA<IR<string>>;
        }>;
      }) =>
        response.records
          .filter(({ records }) => records.length > 0)
          .map(({ records }) => records[0]['dwc:scientificName'])
          .find((occurrenceName) => occurrenceName)
    )
    .catch(console.error)
    .then(
      (remoteOccurrence) => remoteOccurrence ?? fetchLocalScientificName(model)
    )
    .catch(console.error)
    .then((occurrenceName) => occurrenceName ?? '');
}
