import type { JqueryPromise, SpecifyResource } from './legacytypes';
import { snServer } from './lifemapperconfig';
import type { Collection } from './specifymodel';
import type { IR, RA } from './types';

export const fetchLocalScientificName = async (
  model: SpecifyResource,
  defaultValue = ''
): Promise<string> =>
  new Promise((resolve) => {
    (model.rget('determinations') as JqueryPromise<Collection>).then(
      ({ models: determinations }) =>
        determinations.length === 0
          ? resolve(defaultValue)
          : (
              determinations[0].rget(
                'preferredTaxon.fullname'
              ) as JqueryPromise<string>
            ).then((scientificName) =>
              resolve(scientificName === null ? defaultValue : scientificName)
            )
    );
  });

export const formatLifemapperViewPageRequest = (
  occurrenceGuid: string,
  speciesName: string
): string =>
  `${snServer}/api/v1/frontend/?occid=${occurrenceGuid}&namestr=${speciesName}&origin=${window.location.origin}`;

export const formatOccurrenceDataRequest = (occurrenceGuid: string): string =>
  `${snServer}/api/v1/occ/${occurrenceGuid}?count_only=0`;

export async function fetchOccurrenceName({
  guid,
  model,
}: {
  readonly guid: string;
  readonly model: SpecifyResource;
}): Promise<string> {
  return fetch(formatOccurrenceDataRequest(guid), {
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
