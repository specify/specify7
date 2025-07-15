import type { IR, RA } from '../../utils/types';
import type { BrokerRecord } from './fetchers';

// Exclude these fields from the output
const fieldsToExclude = new Set<string>([
  'internal:service',
  'internal:provider',
  's2n:view_url',
  's2n:api_url',
  's2n:issues',
  's2n:gbif_occurrence_url',
  'dcterms:type',
  'dwc:taxonRank',
  'dcterms:language',
  'dwc:scientificNameAuthorship',
  's2n:worms_isMarine',
  's2n:worms_isBrackish',
  's2n:worms_isFreshwater',
  's2n:worms_isTerrestrial',
  's2n:worms_isExtinct',
  's2n:kingdom',
  'dwc:kingdom',
  'dwc:phylum',
  'dwc:class',
  'dwc:order',
  'dwc:associatedReferences',
  'dwc:associatedSequences',
  'dcterms:accessRights',
  'dcterms:license',
  'dwc:countryCode',
  'dwc:otherCatalogNumbers',
]);

const fieldsToExcludeSpecific: RA<{
  readonly service: string;
  readonly provider: string;
  readonly field: string;
}> = [
  {
    service: 'name',
    provider: 'itis',
    field: 's2n:hierarchy',
  },
  {
    service: 'name',
    provider: 'worms',
    field: 's2n:hierarchy',
  },
];

const combinations = <T>(keys: RA<T>): RA<Readonly<readonly [T, T]>> =>
  keys.flatMap((value, index) =>
    keys
      .slice(index + 1)
      .map((combinedValue) => [value, combinedValue] as const)
  );

export function getBrokerKeys(records: RA<IR<unknown>>): RA<string> {
  const keys = records.map((record) => new Set(Object.keys(record)));
  // Get all keys shared by at least 2 aggregators
  const commonKeys = new Set(
    combinations(keys).flatMap(([left, right]) =>
      Array.from(left).filter((key) => right.has(key))
    )
  );
  // Return all keys, putting common keys at the beginning
  return Array.from(
    new Set(
      [...commonKeys, ...keys.flatMap((keys) => Array.from(keys))].filter(
        (key) => !fieldsToExclude.has(key)
      )
    )
  );
}

export const getValue = (response: BrokerRecord, key: string): unknown =>
  !(key in response.record) ||
  fieldsToExcludeSpecific.some(
    ({ field, service, provider }) =>
      field === key &&
      service === response.service &&
      provider === response.provider.code
  )
    ? ''
    : response.record[key];
