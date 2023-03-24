import React from 'react';

import { useResource } from '../../hooks/resource';
import { useAsyncState } from '../../hooks/useAsyncState';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { schema } from '../DataModel/schema';
import type { SpQuery, Tables } from '../DataModel/types';
import { LoadingScreen } from '../Molecules/Dialog';
import { queryFromTree } from '../QueryBuilder/fromTree';
import type { QueryField } from '../QueryBuilder/helpers';
import { parseQueryFields } from '../QueryBuilder/helpers';
import type { QueryResultRow } from '../QueryBuilder/Results';
import { useFetchQueryResults } from '../QueryBuilder/Results';
import { useQueryResultsWrapper } from '../QueryBuilder/ResultsWrapper';
import {
  fieldSpecsToLocalityMappings,
  QueryToMapDialog,
} from '../QueryBuilder/ToMap';
import { getGenericMappingPath } from '../WbPlanView/mappingHelpers';
import { NoBrokerData } from './Overlay';

export function SpecifyNetworkMap({
  taxonId,
  onClose: handleClose,
}: {
  readonly taxonId: number | false | undefined;
  readonly onClose: () => void;
}): JSX.Element {
  const [queryResource] = useAsyncState(
    React.useCallback(
      async () =>
        typeof taxonId === 'number'
          ? queryFromTree('Taxon', taxonId)
          : undefined,
      [taxonId]
    ),
    true
  );
  return taxonId === false ? (
    <NoBrokerData onClose={handleClose} />
  ) : taxonId === undefined || queryResource === undefined ? (
    <LoadingScreen />
  ) : (
    <MapWrapper queryResource={queryResource} onClose={handleClose} />
  );
}

function MapWrapper({
  queryResource,
  onClose: handleClose,
}: {
  readonly queryResource: SpecifyResource<SpQuery>;
  readonly onClose: () => void;
}): JSX.Element {
  const [query] = useResource(queryResource);
  const fields = React.useMemo(() => getFields(query), [query]);
  const props = useQueryResultsWrapper({
    baseTableName: tableName,
    queryRunCount: 1,
    queryResource,
    fields,
    recordSetId: undefined,
    forceCollection: undefined,
    onSortChange: undefined,
  });
  return props === undefined ? (
    <LoadingScreen />
  ) : (
    <Map props={props} onClose={handleClose} />
  );
}

/** Add locality field if needed */
function getFields(query: SerializedResource<SpQuery>): RA<QueryField> {
  const fields = parseQueryFields(query?.fields ?? []);
  if (query.contextName !== tableName) {
    console.error(`Only ${tableName} queries are supported`);
    return fields;
  }
  const localityField = fields.find(({ mappingPath }) =>
    mappingPath.join('.').startsWith('collectingEvent.locality')
  );
  return localityField === undefined
    ? ([
        ...fields,
        {
          id: fields.length,
          mappingPath: ['collectingEvent', 'locality'],
          sortType: undefined,
          isDisplay: true,
          filters: [
            {
              type: 'any',
              startValue: '',
              isNot: false,
            },
          ],
        },
      ] as const)
    : fields;
}

const tableName = 'CollectionObject';

function Map({
  props,
  onClose: handleClose,
}: {
  readonly props: Exclude<ReturnType<typeof useQueryResultsWrapper>, undefined>;
  readonly onClose: () => void;
}): JSX.Element {
  const {
    results: [results],
    canFetchMore,
    onFetchMore: handleFetchMore,
  } = useFetchQueryResults(props);

  const undefinedResult = results?.indexOf(undefined);
  const loadedResults = (
    undefinedResult === -1 ? results : results?.slice(0, undefinedResult)
  ) as RA<QueryResultRow> | undefined;
  const localityMappings = React.useMemo(
    () => fieldSpecsToLocalityMappings(tableName, props?.fieldSpecs ?? []),
    [props?.fieldSpecs]
  );
  return props?.initialData === undefined || loadedResults === undefined ? (
    <LoadingScreen />
  ) : (
    <QueryToMapDialog
      fields={props.allFields}
      localityMappings={localityMappings}
      results={loadedResults}
      tableName={tableName}
      totalCount={props.totalCount}
      onClose={handleClose}
      onFetchMore={canFetchMore ? handleFetchMore : undefined}
    />
  );
}

export function extractQueryTaxonId(
  baseTableName: keyof Tables,
  fields: RA<QueryField>
): number | undefined {
  const idField = schema.models.Taxon.idField;
  const pairedFields = filterArray(
    fields.flatMap(({ mappingPath }, index) =>
      schema.models[baseTableName].getField(
        getGenericMappingPath(mappingPath).join('.')
      ) === idField
        ? fields[index]?.filters.map(({ type, isNot, startValue }) =>
            type === 'equal' && !isNot ? f.parseInt(startValue) : undefined
          )
        : undefined
    )
  );
  if (pairedFields.length > 1)
    console.warn(
      'More than one taxon id found in the query. Using the first one'
    );
  return pairedFields[0];
}

export const exportsForTests = {
  getFields,
};
