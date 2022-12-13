/**
 * Schema Configuration
 */

import React from 'react';

import { SafeOutlet } from '../Router/RouterUtils';
import type {
  NewSpLocaleItemString,
  SpLocaleItemString,
} from '../SchemaConfig';
import type { SchemaData } from '../SchemaConfig/SetupHooks';
import { useSchemaData } from '../SchemaConfig/SetupHooks';

export type WithFetchedStrings = {
  readonly strings: {
    readonly desc: NewSpLocaleItemString | SpLocaleItemString;
    readonly name: NewSpLocaleItemString | SpLocaleItemString;
  };
};

export function SchemaConfig(): JSX.Element | null {
  const schemaData = useSchemaData();

  return schemaData === undefined ? null : (
    <SafeOutlet<SchemaData> {...schemaData} />
  );
}
