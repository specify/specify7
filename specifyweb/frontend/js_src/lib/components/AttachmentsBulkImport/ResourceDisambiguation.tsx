import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { fetchResource } from '../DataModel/resource';
import { deserializeResource } from '../DataModel/serializers';
import type { Tables } from '../DataModel/types';
import { DisambiguationDialog } from '../WorkBench/Disambiguation';

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
      async () => resourcesPromiseGenerator(baseTable, resourcesToResolve),
      [baseTable, resourcesToResolve]
    ),
    false
  );

  const previousSelectedResource = fetchedResources?.find(
    (resource) => resource.id === previousSelected
  );

  return fetchedResources === undefined ? null : (
    <DisambiguationDialog
      defaultResource={previousSelectedResource}
      matches={fetchedResources}
      onClose={handleClose}
      onSelected={(resource) => handleResolve(resource.id)}
      onSelectedAll={(resource) => handleAllResolve(resource.id)}
    />
  );
}

const resourcesPromiseGenerator = async (
  baseTable: keyof Tables,
  resources: RA<number>
): Promise<RA<SpecifyResource<AnySchema>>> =>
  Promise.all(
    resources.map(async (resourceId) =>
      fetchResource(baseTable, resourceId, false)
    )
  )
    .then((data) =>
      data.map((unsafeData) => f.maybe(unsafeData, deserializeResource))
    )
    .then(filterArray);
