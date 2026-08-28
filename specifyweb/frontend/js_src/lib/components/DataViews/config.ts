import type { RA } from '../../utils/types';
import type { Tables } from '../DataModel/types';

export const defaultDataViewTablesConfig: RA<keyof Tables> = [
  'Accession',
  'Agent',
  'CollectionObject',
  'CollectingEvent',
  'Gift',
  'Loan',
  'Locality',
];
