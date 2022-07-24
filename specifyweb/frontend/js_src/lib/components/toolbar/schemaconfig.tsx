/**
 * Schema Configuration
 */

import React from 'react';

import { OverlayContext } from '../router';
import type {
  NewSpLocaleItemString,
  SpLocaleItemString,
} from '../schemaconfig';
import { SchemaConfigLanguage } from '../schemaconfigsetup';
import { useSchemaData } from '../schemaconfigsetuphooks';

export type WithFetchedStrings = {
  readonly strings: {
    readonly desc: NewSpLocaleItemString | SpLocaleItemString;
    readonly name: NewSpLocaleItemString | SpLocaleItemString;
  };
};

export function SchemaConfigOverlay(): JSX.Element | null {
  const schemaData = useSchemaData();
  const handleClose = React.useContext(OverlayContext);

  return schemaData === undefined ? null : (
    <SchemaConfigLanguage schemaData={schemaData} onClose={handleClose} />
  );
}
