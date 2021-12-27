import type { RR, IR } from './types';
import { ComponentProps } from './components/lifemapperwrapper';
import { snServer } from './lifemapperconfig';

export const fetchLocalScientificName = async (
  model: any,
  defaultValue = ''
): Promise<string> =>
  new Promise((resolve) => {
    model
      .rget('determinations')
      .done(({ models: determinations }: any) =>
        determinations.length === 0
          ? resolve(defaultValue)
          : determinations[0]
              .rget('preferredTaxon.fullname')
              .done((scientificName: string) =>
                resolve(scientificName === null ? defaultValue : scientificName)
              )
      );
  });

export const formatLifemapperViewPageRequest = (
  occurrenceGuid: string,
  speciesName: string,
  ref: number
): string =>
  `${snServer}/api/v1/frontend/?occid=${occurrenceGuid}&namestr=${speciesName}&origin=${window.location.origin}&ref=${ref}`;

export const formatOccurrenceDataRequest = (occurrenceGuid: string): string =>
  `${snServer}/api/v1/occ/${occurrenceGuid}?count_only=0`;

export const formatIconRequest = (
  providerName: string,
  icon_status: 'active' | 'inactive' | 'hover'
): string =>
  `${snServer}/api/v1/badge?provider=${providerName}&icon_status=${icon_status}`;

export async function fetchOccurrenceName({
  model,
  guid,
}: ComponentProps): Promise<string> {
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
