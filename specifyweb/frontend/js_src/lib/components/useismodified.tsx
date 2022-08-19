import React from 'react';

import {tap} from '../assert';
import type {AnySchema} from '../datamodelutils';
import type {SpecifyResource} from '../legacytypes';
import {resourceOn} from '../resource';
import {useBooleanState} from './hooks';

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

  React.useEffect(
    () =>
      typeof resource === 'object'
        ? resourceOn(resource, 'saveRequired', tap(handleNeedsSaving))
        : undefined,
    [resource, handleNeedsSaving]
  );

  React.useEffect(
    () =>
      typeof resource === 'object'
        ? resourceOn(resource, 'saved', handleSaved)
        : undefined,
    [resource, handleSaved]
  );

  return saveRequired;
}
