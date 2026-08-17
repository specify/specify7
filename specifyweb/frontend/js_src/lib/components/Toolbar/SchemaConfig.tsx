/**
 * Schema Configuration
 */

import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { OverlayLocation } from '../Router/Router';
import { SafeOutlet } from '../Router/RouterUtils';
import type {
  NewSpLocaleItemString,
  SpLocaleItemString,
} from '../SchemaConfig';
import type { SchemaData } from '../SchemaConfig/schemaData';
import { fetchSchemaData, refreshSchemaData } from '../SchemaConfig/schemaData';

export type WithFetchedStrings = {
  readonly strings: {
    readonly desc: NewSpLocaleItemString | SpLocaleItemString;
    readonly name: NewSpLocaleItemString | SpLocaleItemString;
  };
};

export function SchemaConfig(): JSX.Element | null {
  const [schemaData, setSchemaData] = useAsyncState(fetchSchemaData, true);

  // Refresh schema data when an overlay closes. useLocation won't work here
  // since the main route is rendered under the scoped background location
  const overlayLocation = React.useContext(OverlayLocation);
  const wasInOverlay = React.useRef(false);
  const refreshSequence = React.useRef(0);
  React.useEffect(() => {
    const isInOverlay = overlayLocation !== undefined;
    if (wasInOverlay.current && !isInOverlay) {
      const sequence = ++refreshSequence.current;
      void refreshSchemaData().then((data) => {
        if (refreshSequence.current === sequence) setSchemaData(data);
      });
    }
    wasInOverlay.current = isInOverlay;
  }, [overlayLocation, setSchemaData]);

  return schemaData === undefined ? null : (
    <SafeOutlet<SchemaData> {...schemaData} update={setSchemaData} />
  );
}
