/**
 * Schema Configuration
 */

import React from 'react';

import { SafeOutlet } from '../Router/RouterUtils';
import type {
  NewSpLocaleItemString,
  SpLocaleItemString,
} from '../SchemaConfig';
import type { SchemaData } from '../SchemaConfig/schemaData';
import { fetchSchemaData } from '../SchemaConfig/schemaData';
import { useAsyncState } from '../../hooks/useAsyncState';

export type WithFetchedStrings = {
  readonly strings: {
    readonly desc: NewSpLocaleItemString | SpLocaleItemString;
    readonly name: NewSpLocaleItemString | SpLocaleItemString;
  };
};

export function SchemaConfig(): JSX.Element | null {
  const schemaData = useAsyncState(fetchSchemaData, true)[0];

  return schemaData === undefined ? null : (
    <SafeOutlet<SchemaData> {...schemaData} />
  );
}
