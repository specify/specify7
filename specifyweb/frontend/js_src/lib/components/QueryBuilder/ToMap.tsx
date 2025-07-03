import type L from 'leaflet';
import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { localityText } from '../../localization/locality';
import { eventListener } from '../../utils/events';
import { f } from '../../utils/functools';
import type { RA, WritableArray } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { Progress } from '../Atoms';
import { Button } from '../Atoms/Button';
import { getResourceViewUrl } from '../DataModel/resource';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { tables } from '../DataModel/tables';
import type { Tables } from '../DataModel/types';
import { softFail } from '../Errors/Crash';
import { formatLocalityData, getMarkersFromLocalityData } from '../Leaflet';
import type { LeafletInstance } from '../Leaflet/addOns';
import { queryMappingLocalityColumns } from '../Leaflet/config';
import type { LocalityData } from '../Leaflet/helpers';
import {
  fetchLocalityDataFromResource,
  formatLocalityDataObject,
} from '../Leaflet/localityRecordDataExtractor';
import { LeafletMap } from '../Leaflet/Map';
import { findLocalityColumnsInDataSet } from '../Leaflet/wbLocalityDataExtractor';
import { LoadingScreen } from '../Molecules/Dialog';
import { extractQueryTaxonId, useExtendedMap } from '../SpecifyNetwork/Map';
import type { BrokerData } from '../SpecifyNetwork/Overlay';
import { useMapData } from '../SpecifyNetwork/Overlay';
import { defaultColumnOptions } from '../WbPlanView/linesGetter';
import type { SplitMappingPath } from '../WbPlanView/mappingHelpers';
import {
  mappingPathToString,
  splitJoinedMappingPath,
} from '../WbPlanView/mappingHelpers';
import type { QueryFieldSpec } from './fieldSpec';
import type { QueryField } from './helpers';
import type { QueryResultRow } from './Results';
import { queryIdField } from './Results';
import { useLiveState } from '../../hooks/useLiveState';
import { useReadyEffect } from '../../hooks/useReadyEffect';

export function QueryToMap({
  results,
  totalCount,
  selectedRows,
  table,
  fieldSpecs,
  fields,
  onFetchMore: handleFetchMore,
}: {
  readonly results: RA<QueryResultRow>;
  readonly totalCount: number | undefined;
  readonly selectedRows: ReadonlySet<number>;
  readonly table: SpecifyTable;
  readonly fieldSpecs: RA<QueryFieldSpec>;
  readonly fields: RA<QueryField>;
  readonly onFetchMore: (() => Promise<RA<QueryResultRow> | void>) | undefined;
}): JSX.Element | null {
  const [isOpen, handleOpen, handleClose] = useBooleanState();
  const ids = useSelectedResults(results, selectedRows);
  const localityMappings = React.useMemo(
    () => fieldSpecsToLocalityMappings(table.name, fieldSpecs),
    [table.name, fieldSpecs]
  );
  return localityMappings.length === 0 ? null : (
    <>
      <Button.Small disabled={results.length === 0} onClick={handleOpen}>
        {localityText.geoMap()}
      </Button.Small>
      {isOpen && ids.length > 0 ? (
        <QueryToMapDialog
          fields={fields}
          localityMappings={localityMappings}
          results={results}
          tableName={table.name}
          totalCount={totalCount}
          onClose={handleClose}
          onFetchMore={selectedRows.size > 0 ? undefined : handleFetchMore}
        />
      ) : undefined}
    </>
  );
}

function useSelectedResults(
  results: RA<QueryResultRow | undefined>,
  selectedRows: ReadonlySet<number>
): RA<QueryResultRow | undefined> {
  return React.useMemo(
    () =>
      selectedRows.size === 0
        ? results
        : results.filter((result) =>
          f.has(selectedRows, result?.[queryIdField])
        ),
    [results, selectedRows]
  );
}

type LocalityColumn = {
  readonly localityColumn: string;
  readonly columnIndex: number;
};

export function fieldSpecsToLocalityMappings(
  tableName: keyof Tables,
  fieldSpecs: RA<QueryFieldSpec>
) {
  const splitPaths = fieldSpecsToMappingPaths(fieldSpecs);
  const mappingPaths = splitPaths.map(({ mappingPath }) =>
    mappingPathToString(mappingPath)
  );
  return findLocalityColumnsInDataSet(tableName, splitPaths).map(
    (localityColumns) => {
      const mapped = Object.entries(localityColumns)
        .filter(([key]) => queryMappingLocalityColumns.includes(key))
        .map(([localityColumn, mapping]) => {
          const pathToLocalityField = splitJoinedMappingPath(localityColumn);
          if (pathToLocalityField.length !== 2)
            throw new Error('Only direct locality fields are supported');
          const fieldName = pathToLocalityField.at(-1)!;
          return {
            localityColumn: fieldName,
            columnIndex: mappingPaths.indexOf(mapping),
          };
        });

      const basePath = splitJoinedMappingPath(
        localityColumns['locality.longitude1']
      ).slice(0, -1);
      const idPath = mappingPathToString([...basePath, 'localityId']);
      return [
        ...mapped,
        {
          localityColumn: 'localityId',
          columnIndex: mappingPaths.indexOf(idPath),
        },
      ];
    }
  );
}

const fieldSpecsToMappingPaths = (
  fieldSpecs: RA<QueryFieldSpec>
): RA<SplitMappingPath> =>
  fieldSpecs
    .map((fieldSpec) => fieldSpec.toMappingPath())
    .map((mappingPath) => ({
      headerName: mappingPathToString(mappingPath),
      mappingPath,
      columnOptions: defaultColumnOptions,
    }));

type LocalityDataWithId = {
  readonly recordId: number;
  readonly localityId: number;
  readonly localityData: LocalityData;
};

export function QueryToMapDialog({
  results,
  brokerData,
  totalCount,
  localityMappings,
  tableName,
  fields,
  onClose: handleClose,
  onFetchMore: handleFetchMore,
}: {
  readonly results: RA<QueryResultRow>;
  readonly brokerData?: BrokerData;
  readonly totalCount: number | undefined;
  readonly localityMappings: RA<RA<LocalityColumn>>;
  readonly tableName: keyof Tables;
  readonly fields: RA<QueryField>;
  readonly onClose: () => void;
  readonly onFetchMore: (() => Promise<RA<QueryResultRow> | void>) | undefined;
}): JSX.Element {
  const [map, setMap] = React.useState<LeafletInstance | undefined>(undefined);
  const localityData = React.useRef<RA<LocalityDataWithId>>([]);
  const [initialData] = useLiveState<
    | {
      readonly localityData: RA<LocalityData>;
      readonly onClick: ReturnType<typeof createClickCallback>;
    }
    | undefined
  >(React.useCallback(() => {

    const extracted = extractLocalities(results, localityMappings);
    return ({
      localityData: extracted.map(
        ({ localityData }) => localityData
      ),
      onClick: createClickCallback(tableName, extracted),
    })
  }, [results]));

  const taxonId = React.useMemo(
    () => brokerData?.taxonId ?? extractQueryTaxonId(tableName, fields),
    [tableName, fields, brokerData?.taxonId]
  );
  const data = useMapData(brokerData, taxonId);
  const description = useExtendedMap(map, data);

  // REFACTOR: This is actually no longer needed. Remove this.
  const markerEvents = React.useMemo(
    () => eventListener<{ readonly updated: undefined }>(),
    []
  );

  const markerCountRef = React.useRef(results.length);

  const handleAddPoints = React.useCallback(
    (results: RA<QueryResultRow>) => {
      markerCountRef.current += results.length;
      /*
       * Need to add markers into queue rather than directly to the map because
       * the map might not be initialized yet (the map is only initialized after
       * some markers are fetched, so that it can open to correct position)
       */
      localityData.current = [
        ...localityData.current,
        ...extractLocalities(results, localityMappings),
      ];
      markerEvents.trigger('updated');
    },
    [tableName, localityMappings, markerEvents]
  );

  useFetchLoop(handleFetchMore, handleAddPoints);

  // The below is used for sanity checking at un-mount.
  // A unit test for this functionality is tricky. A runtime check is simpler
  const mapRef = React.useRef(map);
  mapRef.current = map;

  React.useEffect(() => {
    return () => {
      if (mapRef.current === undefined) return;
      if (mapRef.current?.sp7MarkerCount !== markerCountRef.current) {
        console.warn(`Expected the counts to match: Expected: ${markerCountRef.current}. Got: ${mapRef.current?.sp7MarkerCount}`);
      }
    }
  }, []);


  const readyEffectCallback = React.useCallback(() => {
    if (map === undefined) return undefined;

    function emptyQueue(): void {
      if (map === undefined) return;
      addLeafletMarkers(tableName, map, localityData.current);
      localityData.current = [];
    }

    return markerEvents.on('updated', emptyQueue, true);
  }, [tableName, map, markerEvents]);

  // Using ready effect to prevent double calls in DEV.
  useReadyEffect(readyEffectCallback);

  return typeof initialData === 'object' ? (
    <LeafletMap
      /*
       * This will only add initial locality data
       * That is needed so that the map can zoom in to correct place
       */
      description={description}
      forwardRef={setMap}
      header={
        typeof totalCount === 'number'
          ? results.length === totalCount
            ? localityText.queryMapAll({
              plotted: results.length,
            })
            : localityText.queryMapSubset({
              plotted: results.length,
              total: totalCount,
            })
          : localityText.geoMap()
      }
      headerButtons={
        typeof totalCount === 'number' && totalCount !== results.length ? (
          <Progress
            aria-hidden
            className="flex-1"
            max={totalCount}
            value={results.length}
          />
        ) : undefined
      }
      localityPoints={initialData.localityData}
      onClose={handleClose}
      onMarkerClick={initialData.onClick}
    />
  ) : (
    <LoadingScreen />
  );
}

const extractLocalities = (
  results: RA<QueryResultRow>,
  localityMappings: RA<RA<LocalityColumn>>
): RA<LocalityDataWithId> =>
  filterArray(
    results.flatMap((row) =>
      localityMappings.map((mappings) => {
        const fields = mappings.map(
          ({ localityColumn, columnIndex }) =>
            [
              [localityColumn],
              // "+1" is to compensate for queryIdField
              row[columnIndex + 1]?.toString() ?? null,
            ] as const
        );
        const localityData = formatLocalityDataObject(fields);
        const localityId = f.parseInt(
          fields.find(
            ([localityColumn]) => localityColumn[0] === 'localityId'
          )?.[1] ?? undefined
        );
        return localityData === false || typeof localityId !== 'number'
          ? undefined
          : { recordId: row[queryIdField] as number, localityId, localityData };
      })
    )
  );

function createClickCallback(
  tableName: keyof Tables,
  points: RA<LocalityDataWithId>
): (index: number, event: L.LeafletEvent) => Promise<void> {
  const fullLocalityData: WritableArray<LocalityData | false | undefined> = [];

  return async (index, { target: marker }): Promise<void> => {
    const resource = new tables.Locality.Resource({
      id: points[index].localityId,
    });
    fullLocalityData[index] ??= await fetchLocalityDataFromResource(resource);
    const localityData = fullLocalityData[index];
    if (localityData !== false)
      (marker as L.Marker)
        .getPopup()
        ?.setContent(
          formatLocalityData(
            localityData!,
            getResourceViewUrl(tableName, points[index].recordId),
            true
          )
        );
  };
}

function addLeafletMarkers(
  tableName: keyof Tables,
  map: LeafletInstance,
  points: RA<LocalityDataWithId>
): void {
  if (points.length === 0) return;

  const handleMarkerClick = createClickCallback(tableName, points);

  const markers = points.map(({ localityData }, index) =>
    getMarkersFromLocalityData({
      localityData,
      onMarkerClick: handleMarkerClick.bind(undefined, index),
    })
  );

  map.addMarkers(markers);
}

/**
 * Fetch query results until all are fetched
 */
function useFetchLoop(
  handleFetchMore: (() => Promise<RA<QueryResultRow> | void>) | undefined,
  handleAdd: (results: RA<QueryResultRow>) => void
): void {
  const [lastResults, setLastResults] =
    React.useState<RA<QueryResultRow> | void>(undefined);
  React.useEffect(() => {
    void handleFetchMore?.()
      .then((results) => {
        if (destructorCalled) return;
        setLastResults(results);
        f.maybe(results, handleAdd);
      })
      .catch(softFail);
    let destructorCalled = false;
    return (): void => {
      destructorCalled = true;
    };
  }, [handleFetchMore, handleAdd, lastResults]);
}
