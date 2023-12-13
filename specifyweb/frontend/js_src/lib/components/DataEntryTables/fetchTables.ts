import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { genericTables } from '../DataModel/tables';
import {
  defaultInteractionTables,
  fetchLegacyInteractions,
} from '../Interactions/fetch';
import { useFormTables } from './Edit';
import { defaultFormTablesConfig, fetchLegacyForms } from './fetch';

export function useDataEntryTables(
  type: 'form' | 'interactions'
): RA<SpecifyTable> | undefined {
  const [formTables] = useFormTables(type);
  const isLegacy = formTables === 'legacy';
  const [legacyForms] = useAsyncState(
    React.useCallback(
      async () =>
        isLegacy
          ? fetchEntries[type]().then((configuredTables) =>
              // Make list unique
              f
                .unique(configuredTables.map(({ name }) => name))
                .map((name) => genericTables[name])
            )
          : undefined,
      [isLegacy, type]
    ),
    true
  );
  return formTables === 'legacy' ? legacyForms : formTables;
}

export const defaultVisibleForms = {
  form: defaultFormTablesConfig,
  interactions: defaultInteractionTables,
} as const;

const fetchEntries = {
  form: fetchLegacyForms,
  interactions: fetchLegacyInteractions,
} as const;
