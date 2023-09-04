import { filterArray, RA } from '../../utils/types';
import { fetchResource } from '../DataModel/resource';
import { AnySchema } from '../DataModel/helperTypes';
import { Tables } from '../DataModel/types';
import { useAsyncState } from '../../hooks/useAsyncState';
import React from 'react';
import { DisambiguationDialog } from '../WorkBench/Disambiguation';
import { deserializeResource } from '../DataModel/helpers';
import { SpecifyResource } from '../DataModel/legacyTypes';
import { f } from '../../utils/functools';

export function ResourceDisambiguationDialog({
  resourcesToResolve,
  handleResolve,
  handleAllResolve,
  baseTable,
  previousSelected,
  onClose: handleClose,
}: {
  readonly baseTable: keyof Tables;
  readonly resourcesToResolve: RA<number>;
  readonly handleResolve: (selectedId: number) => void;
  readonly handleAllResolve: (selectedId: number) => void;
  readonly previousSelected?: number;
  readonly onClose: () => void;
}): JSX.Element | null {
  const [fetchedResources] = useAsyncState(
    React.useCallback(
      () => resourcesPromiseGenerator(baseTable, resourcesToResolve),
      [baseTable, resourcesToResolve]
    ),
    false
  );

  const previousSelectedResource = fetchedResources?.find(
    (resource) => resource.id === previousSelected
  );

  return fetchedResources === undefined ? null : (
    <DisambiguationDialog
      matches={fetchedResources}
      onSelected={(resource) => handleResolve(resource.id)}
      onSelectedAll={(resource) => handleAllResolve(resource.id)}
      onClose={handleClose}
      previousSelected={previousSelectedResource}
    />
  );
}

function resourcesPromiseGenerator(
  baseTable: keyof Tables,
  resources: RA<number>
): Promise<RA<SpecifyResource<AnySchema>>> {
  return Promise.all(
    resources.map((resourceId) => fetchResource(baseTable, resourceId, false))
  )
    .then((data) =>
      data.map((unsafeData) => f.maybe(unsafeData, deserializeResource))
    )
    .then(filterArray);
}
