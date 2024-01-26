import type { LocalizedString } from 'typesafe-i18n';

import { ajax } from '../../utils/ajax';
import type { IR, RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { sortFunction } from '../../utils/utils';
import {
  brokerUrl,
  occurrenceDataProviders,
  speciesDataProviders,
} from './config';

export const fetchOccurrence = async (
  guid: string
): Promise<RA<BrokerRecord> | undefined> =>
  fetchFromEndpoint(
    `${brokerUrl}/api/v1/occ/?occid=${guid}`,
    occurrenceDataProviders
  );

const fetchFromEndpoint = async (
  url: string,
  providers: RA<string>
): Promise<RA<BrokerRecord>> =>
  Promise.all(
    providers.map(async (provider) =>
      fetchFromBroker(`${url}&provider=${provider}`)
    )
  ).then((responses) =>
    Array.from(filterArray(responses)).sort(
      sortFunction(({ provider }) => providers.indexOf(provider.code))
    )
  );

const fetchFromBroker = async (
  requestUrl: string
): Promise<BrokerRecord | undefined> =>
  ajax<RawBrokerResponse>(requestUrl, {
    headers: {
      Accept: 'application/json',
    },
  }).then(({ data }) => extractResponseRecord(data));

const extractResponseRecord = (
  response: RawBrokerResponse
): BrokerRecord | undefined =>
  !validateBrokerResponse(response) ||
  !validateBrokerResponse(response.records[0])
    ? undefined
    : {
        record: response.records[0].records[0],
        service: response.service,
        provider: response.records[0].provider,
      };

export function validateBrokerResponse(response: {
  readonly errors: IR<unknown>;
  readonly records: RA<unknown>;
}): boolean {
  if (Object.keys(response.errors).length === 0)
    return response.records.length > 0;
  else {
    console.error(response);
    return false;
  }
}

export const fetchName = async (
  speciesName: string
): Promise<RA<BrokerRecord>> =>
  fetchFromEndpoint(
    `${brokerUrl}/api/v1/name/?namestr=${speciesName}`,
    speciesDataProviders
  );

export type BrokerRecord = {
  readonly provider: BrokerProvider;
  readonly service: string;
  readonly record: IR<unknown>;
};

type BrokerProvider = {
  readonly code: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  readonly icon_url: string;
  readonly label: LocalizedString;
};

export type RawBrokerResponse<TYPE extends IR<unknown> = IR<unknown>> = {
  readonly errors: IR<unknown>;
  readonly service: string;
  readonly provider: BrokerProvider;
  readonly records: RA<{
    readonly errors: IR<unknown>;
    readonly provider: BrokerProvider;
    readonly records: RA<TYPE>;
  }>;
};

export function extractBrokerField<T = LocalizedString>(
  responses: RA<BrokerRecord>,
  aggregator: string,
  field: string,
  strict = false
): T | undefined {
  const fields = Object.fromEntries<T | undefined>(
    responses
      .map(
        (response) =>
          [response.provider.code, response.record[field] as T] as const
      )
      .filter(([_aggregator, value]) => value)
  );
  return fields[aggregator] ?? (strict ? undefined : Object.values(fields)[0]);
}
