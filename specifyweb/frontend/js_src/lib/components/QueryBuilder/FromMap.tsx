import L from 'leaflet';
import React from 'react';

import { commonText } from '../../localization/common';
import { f } from '../../utils/functools';
import type { RA, Writable, WritableArray } from '../../utils/types';
import { insertItem, replaceItem } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import type { LeafletInstance } from '../Leaflet/addOns';
import { LeafletMap } from '../Leaflet/Map';
import { mappingPathToString } from '../WbPlanView/mappingHelpers';
import type { QueryField } from './helpers';

const emptyArray: RA<never> = [];
const defaultPoint = [0, 10] as const;
type Pair<T = number> = readonly [T, T];

export function QueryFromMap({
  fields,
  lineNumber,
  onClose: handleClose,
  onChange: handleChange,
}: {
  readonly fields: RA<QueryField>;
  readonly lineNumber: number;
  readonly onClose: () => void;
  readonly onChange: (fields: RA<QueryField>) => void;
}): JSX.Element {
  const [start, setStart] = React.useState<Pair>(defaultPoint);
  const [end, setEnd] = React.useState<Pair>(defaultPoint);
  const [lineIndexes, setLineIndexes] = React.useState<Pair>([0, 0]);
  const [markers, setMarkers] = React.useState<Pair<L.Marker> | undefined>(
    undefined
  );

  const [map, setMap] = React.useState<LeafletInstance | undefined>(undefined);

  React.useEffect(() => {
    if (map === undefined) return;

    const indexes = findCoordinateLines(fields, lineNumber);
    setLineIndexes(indexes);
    const [latitudeIndex, longitudeIndex] = indexes;

    const [latitude1, latitude2] =
      f.maybe(fields[latitudeIndex]?.filters, extractState) ?? defaultPoint;
    const [longitude1, longitude2] =
      f.maybe(fields[longitudeIndex]?.filters, extractState) ?? defaultPoint;

    const start = [latitude1, longitude1] as const;
    const end = [latitude2, longitude2] as const;

    setStart(start);
    setEnd(end);

    setMarkers(createMarkers(map, start, end));
  }, [map, fields, lineNumber]);

  useMarkersChange(markers, setStart, setEnd);
  usePolygon(map, start, end);

  function handleSave(): void {
    handleChange(getNewQueryLines(fields, lineIndexes, start, end));
    handleClose();
  }

  return (
    <LeafletMap
      buttons={
        <>
          <Button.Secondary onClick={handleClose}>
            {commonText.cancel()}
          </Button.Secondary>
          <Button.Save onClick={handleSave}>{commonText.save()}</Button.Save>
        </>
      }
      forwardRef={setMap}
      localityPoints={emptyArray}
      onClose={handleClose}
      onMarkerClick={f.never}
    />
  );
}

function extractState(filters: QueryField['filters']): Pair | undefined {
  const greaterFilter = parseFilter(filters, 'greaterOrEqual');
  const lessFilter = parseFilter(filters, 'lessOrEqual');
  const betweenFilter = filters.find(
    ({ type }) => type === 'between'
  )?.startValue;
  if (typeof greaterFilter === 'number' && typeof lessFilter === 'number')
    return [greaterFilter, lessFilter + 360];
  else if (typeof betweenFilter === 'string') {
    const [left, right] = betweenFilter.trim().split(',').map(f.parseFloat);
    if (typeof left === 'number' && typeof right === 'number')
      return [left, right];
  }
  return undefined;
}

const parseFilter = (
  filters: QueryField['filters'],
  filter: 'greaterOrEqual' | 'lessOrEqual'
): number | undefined =>
  f.maybe(
    filters.find(({ type }) => type === filter)?.startValue,
    f.parseFloat
  );

function findCoordinateLines(
  fields: RA<QueryField>,
  lineNumber: number
): readonly [number, number] {
  const line = fields[lineNumber];
  const [commonPath, fieldName] = [
    line.mappingPath.slice(0, -1),
    line.mappingPath.at(-1)!,
  ];

  const isLatitude = fieldName === 'latitude1';
  const otherFieldName = isLatitude ? 'longitude1' : 'latitude1';
  const otherFieldIndex = fields.findIndex(
    ({ mappingPath }) =>
      mappingPathToString(mappingPath) ===
      mappingPathToString([...commonPath, otherFieldName])
  );

  const latitudeIndex = isLatitude ? lineNumber : otherFieldIndex;
  const longitudeIndex = isLatitude ? otherFieldIndex : lineNumber;

  return [latitudeIndex, longitudeIndex];
}

const createMarkers = (
  map: L.Map,
  start: Pair,
  end: Pair
): readonly [L.Marker, L.Marker] => [
  createMarker(start).addTo(map),
  createMarker(end).addTo(map),
];

function createMarker([latitude, longitude]: Pair): L.Marker {
  const marker = L.marker([latitude, longitude], {
    draggable: true,
    autoPan: true,
  });
  registerClickHandler(marker);
  return marker;
}

function registerClickHandler(marker: L.Marker): void {
  handleMarkerClick(marker);
  marker.on('click', () => handleMarkerClick(marker));
}

function handleMarkerClick(marker: L.Marker): void {
  const { lat, lng } = marker.getLatLng();
  marker.bindPopup(`${lat}, ${lng}`);
}

function useMarkersChange(
  markers: Pair<L.Marker> | undefined,
  setLatitude: (latitude: Pair) => void,
  setLongitude: (latitude: Pair) => void
): void {
  React.useEffect(() => {
    if (markers === undefined) return;
    setMarkerMoveHandler(markers[0], setLatitude);
    setMarkerMoveHandler(markers[1], setLongitude);
  }, [markers, setLatitude, setLongitude]);
}

const setMarkerMoveHandler = (
  marker: L.Marker,
  callback: (coordinates: Pair) => void
): void =>
  void marker.on('move', () => {
    const { lat, lng } = marker.getLatLng();
    callback([lat, lng]);
  });

function usePolygon(
  map: LeafletInstance | undefined,
  start: Pair,
  end: Pair
): void {
  React.useEffect(() => {
    if (map === undefined) return undefined;
    const polygon = L.polygon(pointsToPolygon(start, end), {
      interactive: false,
    });
    polygon.addTo(map);
    return (): void => void polygon.remove();
  }, [map, start, end]);
}

// Leaflet has terrible typings, so have to cast everything to Writable<>
const pointsToPolygon = (
  [latitude1, longitude1]: Pair,
  [latitude2, longitude2]: Pair
): WritableArray<Writable<Pair>> => [
  [latitude1, longitude1],
  [latitude1, longitude2],
  [latitude2, longitude2],
  [latitude2, longitude1],
];

/**
 * It is possible that only latitude or only longitude line is present in the
 * query. In this case, one of the line indexes would be -1.
 *
 * At least one of the line indexes would be greater than -1 because at least
 * one coordinate line needs to exist for QueryToMap menu to be opened
 *
 * This function handles adding another line if needed.
 */
function getNewQueryLines(
  fields: RA<QueryField>,
  [latitudeLineIndex, longitudeLineIndex]: Pair,
  [latitude1, longitude1]: Pair,
  [latitude2, longitude2]: Pair
): RA<QueryField> {
  const definedLineIndex =
    latitudeLineIndex === -1 ? longitudeLineIndex : latitudeLineIndex;
  const definedField = fields[definedLineIndex];

  const commonPath = fields[definedLineIndex].mappingPath.slice(0, -1);
  const latitudes = [latitude1, latitude2];
  const latitudeLine: QueryField = {
    id: fields.length,
    mappingPath: [...commonPath, 'latitude1'],
    sortType: undefined,
    isDisplay: definedField.isDisplay,
    ...(fields[latitudeLineIndex] as Partial<QueryField>),
    filters: [
      {
        type: 'between',
        startValue: `${Math.min(...latitudes)},${Math.max(...latitudes)}`,
        isNot: false,
        isStrict: false,
      },
    ],
  };
  const longitudes = [longitude1, longitude2];
  const longitudeStart = normalizeLongitude(Math.min(...longitudes));
  const longitudeEnd = normalizeLongitude(Math.max(...longitudes));
  const operator = longitudeStart > longitudeEnd ? 'greaterOrEqual' : 'between';
  const longitudeLine: QueryField = {
    id: fields.length + 1,
    mappingPath: [...commonPath, 'longitude1'],
    sortType: undefined,
    isDisplay: definedField.isDisplay,
    ...(fields[longitudeLineIndex] as Partial<QueryField>),
    filters:
      operator === 'between'
        ? [
            {
              type: 'between',
              startValue: `${longitudeStart},${longitudeEnd}`,
              isNot: false,
              isStrict: false,
            },
          ]
        : [
            {
              type: 'greaterOrEqual',
              startValue: longitudeStart.toString(),
              isNot: false,
              isStrict: false,
            },
            {
              type: 'lessOrEqual',
              startValue: longitudeEnd.toString(),
              isNot: false,
              isStrict: false,
            },
          ],
  };

  if (latitudeLineIndex !== -1 && longitudeLineIndex !== -1)
    return replaceItem(
      replaceItem(fields, longitudeLineIndex, longitudeLine),
      latitudeLineIndex,
      latitudeLine
    );
  else {
    const definedField =
      latitudeLineIndex === -1 ? longitudeLine : latitudeLine;
    const missingField =
      latitudeLineIndex === -1 ? latitudeLine : longitudeLine;
    // Insert the missing field after the defined field
    return insertItem(
      replaceItem(fields, definedLineIndex, definedField),
      definedLineIndex + 1,
      missingField
    );
  }
}

/** From https://gis.stackexchange.com/a/303362/146612 */
const normalizeLongitude = (longitude: number): number =>
  (((longitude % 360) + 540) % 360) - 180;
