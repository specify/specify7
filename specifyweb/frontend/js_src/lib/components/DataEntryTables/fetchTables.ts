import type { RA } from '../../utils/types';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { defaultInteractionTables } from '../Interactions/fetch';
import { defaultFormTablesConfig } from './fetch';
import { useFormTables } from './useFormTables.ts';

export function useDataEntryTables(
  type: 'form' | 'interactions'
): RA<SpecifyTable> | undefined {
  const [formTables] = useFormTables(type);
  return Array.isArray(formTables) ? formTables : undefined;
}

export const defaultVisibleForms = {
  form: defaultFormTablesConfig,
  interactions: defaultInteractionTables,
} as const;
