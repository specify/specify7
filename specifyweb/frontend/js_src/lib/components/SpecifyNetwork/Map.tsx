import { layerGroup } from 'leaflet';
import React from 'react';

import { useResource } from '../../hooks/resource';
import { useAsyncState } from '../../hooks/useAsyncState';
import { developmentText } from '../../localization/development';
import { specifyNetworkText } from '../../localization/specifyNetwork';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { backboneFieldSeparator } from '../DataModel/helpers';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { genericTables, getTableById, tables } from '../DataModel/tables';
import type { SpQuery, Tables } from '../DataModel/types';
import type { LeafletInstance } from '../Leaflet/addOns';
import { LoadingScreen } from '../Molecules/Dialog';
import { queryFromTree } from '../QueryBuilder/fromTree';
import type { QueryField } from '../QueryBuilder/helpers';
import { parseQueryFields } from '../QueryBuilder/helpers';
import { useFetchQueryResults } from '../QueryBuilder/hooks';
import type { QueryResultRow } from '../QueryBuilder/Results';
import { useQueryResultsWrapper } from '../QueryBuilder/ResultsWrapper';
import {
  fieldSpecsToLocalityMappings,
  QueryToMapDialog,
} from '../QueryBuilder/ToMap';
import { getGenericMappingPath } from '../WbPlanView/mappingHelpers';
import type { BrokerData } from './Overlay';
import { NoBrokerData } from './Overlay';
import { getGbifLayers, useIdbLayers } from './overlays';

export function SpecifyNetworkMap({
  data,
  onClose: handleClose,
}: {
  readonly data: BrokerData;
  readonly onClose: () => void;
}): JSX.Element {
  const [queryResource] = useAsyncState(
    React.useCallback(
      async () =>
        typeof data.taxonId === 'number'
          ? queryFromTree('Taxon', data.taxonId)
          : undefined,
      [data.taxonId]
    ),
    true
  );
  return data.taxonId === false ? (
    <NoBrokerData onClose={handleClose} />
  ) : data.taxonId === undefined || queryResource === undefined ? (
    <LoadingScreen />
  ) : (
    <MapWrapper
      data={data}
      queryResource={queryResource}
      onClose={handleClose}
    />
  );
}

function MapWrapper({
  queryResource,
  data,
  onClose: handleClose,
}: {
  readonly queryResource: SpecifyResource<SpQuery>;
  readonly data: BrokerData;
  readonly onClose: () => void;
}): JSX.Element {
  const [query] = useResource(queryResource);
  const table = React.useMemo(
    () => getTableById(query.contextTableId),
    [query.contextTableId]
  );

  const [selectedRows, setSelectedRows] = React.useState<ReadonlySet<number>>(
    new Set()
  );
  const fields = React.useMemo(() => getFields(query), [query]);
  const props = useQueryResultsWrapper({
    table,
    queryRunCount: 1,
    queryResource,
    fields,
    recordSetId: undefined,
    forceCollection: undefined,
    onSortChange: undefined,
    selectedRows: [selectedRows, setSelectedRows],
  });
  return props === undefined ? (
    <LoadingScreen />
  ) : (
    <Map data={data} props={props} onClose={handleClose} />
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
    mappingPath
      .join(backboneFieldSeparator)
      .startsWith('collectingEvent.locality')
  );
  return localityField === undefined
    ? ([
        ...fields,
        {
          id: fields.length,
          mappingPath: ['collectingEvent', 'locality'],
          sortType: undefined,
          dataObjFormatter: undefined,
          isDisplay: true,
          filters: [
            {
              type: 'any',
              startValue: '',
              isNot: false,
              isStrict: false,
            },
          ],
        },
      ] as const)
    : fields;
}

const tableName = 'CollectionObject';

function Map({
  props,
  data,
  onClose: handleClose,
}: {
  readonly props: Exclude<ReturnType<typeof useQueryResultsWrapper>, undefined>;
  readonly data: BrokerData;
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
      brokerData={data}
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
  const idField = tables.Taxon.idField;
  const pairedFields = filterArray(
    fields.flatMap(({ mappingPath }, index) =>
      genericTables[baseTableName].getField(
        getGenericMappingPath(mappingPath).join(backboneFieldSeparator)
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

export function useExtendedMap(
  map: LeafletInstance | undefined,
  { speciesName, species, occurrence }: BrokerData
): JSX.Element | undefined {
  const gbif = React.useMemo(() => f.maybe(species, getGbifLayers), [species]);
  const iDigBio = useIdbLayers(occurrence, speciesName);

  const overlays = React.useMemo(
    () => ({
      ...gbif?.layers,
      ...iDigBio?.layers,
    }),
    [gbif, iDigBio]
  );

  React.useEffect(() => {
    if (map === undefined || layerGroup === undefined) return;
    Object.entries(overlays)
      .filter(([label]) =>
        map.controlLayers._layers.every(({ name }) => name !== label)
      )
      .forEach(([label, layer]) => map.controlLayers.addOverlay(layer, label));
  }, [map, overlays]);

  const items = filterArray([
    specifyNetworkText.mapDescription(),
    gbif?.description,
    iDigBio?.description,
  ]);
  return items.length === 0 ? undefined : (
    <details>
      <summary>{developmentText.details()}</summary>
      {items}
    </details>
  );
}

export const exportsForTests = {
  getFields,
};
