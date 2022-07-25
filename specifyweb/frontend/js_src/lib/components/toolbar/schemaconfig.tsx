/**
 * Schema Configuration
 */

import React from 'react';

import { SafeOutlet } from '../routerutils';
import type {
  NewSpLocaleItemString,
  SpLocaleItemString,
} from '../schemaconfig';
import type { SchemaData } from '../schemaconfigsetuphooks';
import { useSchemaData } from '../schemaconfigsetuphooks';

export type WithFetchedStrings = {
  readonly strings: {
    readonly desc: NewSpLocaleItemString | SpLocaleItemString;
    readonly name: NewSpLocaleItemString | SpLocaleItemString;
  };
};

export function SchemaConfigOverlay(): JSX.Element | null {
  const schemaData = useSchemaData();

  return schemaData === undefined ? null : (
    <SafeOutlet<SchemaData> {...schemaData} />
  );
}
