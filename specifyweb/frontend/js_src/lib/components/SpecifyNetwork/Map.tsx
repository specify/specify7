import React from 'react';

import { useResource } from '../../hooks/resource';
import { useAsyncState } from '../../hooks/useAsyncState';
import type { RA } from '../../utils/types';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { schema } from '../DataModel/schema';
import type { SpQuery } from '../DataModel/types';
import { queryFromTree } from '../QueryBuilder/fromTree';
import { parseQueryFields } from '../QueryBuilder/helpers';
import type { QueryResultRow } from '../QueryBuilder/Results';
import { useFetchQueryResults } from '../QueryBuilder/Results';
import { useQueryResultsWrapper } from '../QueryBuilder/ResultsWrapper';
import { QueryToMap } from '../QueryBuilder/ToMap';

const emptySet = new Set<never>();

export function SpecifyNetworkMap({
  taxonId,
}: {
  readonly taxonId: number;
}): JSX.Element | null {
  const [queryResource] = useAsyncState(
    React.useCallback(async () => queryFromTree('Taxon', taxonId), [taxonId]),
    true
  );
  return queryResource === undefined ? null : (
    <MapWrapper queryResource={queryResource} />
  );
}

function MapWrapper({
  queryResource,
}: {
  readonly queryResource: SpecifyResource<SpQuery>;
}): JSX.Element | null {
  const [query] = useResource(queryResource);
  const fields = React.useMemo(
    () => parseQueryFields(query?.fields ?? []),
    [query]
  );
  const props = useQueryResultsWrapper({
    baseTableName: 'CollectionObject',
    queryRunCount: 1,
    queryResource,
    fields,
    recordSetId: undefined,
    forceCollection: undefined,
    onSortChange: undefined,
  });
  return props === undefined ? null : <Map props={props} />;
}

function Map({
  props,
}: {
  readonly props: Exclude<ReturnType<typeof useQueryResultsWrapper>, undefined>;
}): JSX.Element | null {
  const {
    results: [results],
    canFetchMore,
    onFetchMore: handleFetchMore,
  } = useFetchQueryResults(props);

  const undefinedResult = results?.indexOf(undefined);
  const loadedResults = (
    undefinedResult === -1 ? results : results?.slice(0, undefinedResult)
  ) as RA<QueryResultRow> | undefined;
  return props?.initialData === undefined ||
    loadedResults === undefined ? null : (
    <QueryToMap
      fieldSpecs={props.fieldSpecs}
      model={schema.models.CollectionObject}
      results={loadedResults}
      selectedRows={emptySet}
      totalCount={props.totalCount}
      onFetchMore={canFetchMore ? handleFetchMore : undefined}
    />
  );
}
