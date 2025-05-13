/**
 * Schema Configuration
 */

import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { SafeOutlet } from '../Router/RouterUtils';
import type {
  NewSpLocaleItemString,
  SpLocaleItemString,
} from '../SchemaConfig';
import type { SchemaData } from '../SchemaConfig/schemaData';
import { fetchSchemaData } from '../SchemaConfig/schemaData';

export type WithFetchedStrings = {
  readonly strings: {
    readonly desc: NewSpLocaleItemString | SpLocaleItemString;
    readonly name: NewSpLocaleItemString | SpLocaleItemString;
  };
};

export function SchemaConfig(): JSX.Element | null {
  const [schemaData, setSchemaData] = useAsyncState(fetchSchemaData, true);

  return schemaData === undefined ? null : (
    <SafeOutlet<SchemaData> {...schemaData} update={setSchemaData} />
  );
}
