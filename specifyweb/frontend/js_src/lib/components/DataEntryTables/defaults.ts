import type { RA } from '../../utils/types';
import type { Tables } from '../DataModel/types';
import { defaultInteractionTables } from '../Interactions/defaults';

export const defaultFormTablesConfig: RA<keyof Tables> = [
  'CollectionObject',
  'CollectingEvent',
  'Locality',
  'Taxon',
  'Agent',
  'Geography',
  'DNASequence',
  'ReferenceWork',
];

export const defaultVisibleForms = {
  form: defaultFormTablesConfig,
  interactions: defaultInteractionTables,
} as const;
