import React from 'react';

import type { AnySchema } from '../components/DataModel/helperTypes';
import type { SpecifyResource } from '../components/DataModel/legacyTypes';
import { resourceOn } from '../components/DataModel/resource';
import { tap } from '../components/Errors/assert';
import { useBooleanState } from './useBooleanState';

export function useIsModified(
  resource: SpecifyResource<AnySchema> | undefined,
  // Whether a new resource that hasn't been modified is treated as not modified
  ignoreBrandNew = true
): boolean {
  const [saveRequired, handleNeedsSaving, handleSaved] = useBooleanState(
    resource?.needsSaved === true && (!resource?.isNew() || !ignoreBrandNew)
  );

  // Recompute default value when resource changes
  React.useEffect(
    () =>
      resource?.needsSaved === true && (!resource?.isNew() || !ignoreBrandNew)
        ? handleNeedsSaving()
        : handleSaved(),
    [resource, ignoreBrandNew, handleNeedsSaving, handleSaved]
  );

  // Listen for "saveRequired"
  React.useEffect(
    () =>
      typeof resource === 'object'
        ? resourceOn(resource, 'saveRequired', tap(handleNeedsSaving), false)
        : undefined,
    [resource, handleNeedsSaving]
  );

  // Listen for "saved"
  React.useEffect(
    () =>
      typeof resource === 'object'
        ? resourceOn(resource, 'saved', handleSaved, false)
        : undefined,
    [resource, handleSaved]
  );

  return saveRequired;
}
