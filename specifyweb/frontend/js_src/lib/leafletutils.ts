/*
 * Utility functions for getting locality data from locality resource and
 * workbench dataset
 *
 */

'use strict';

import type { IR, RR } from './components/wbplanview';
import latlongutils from './latlongutils';
import {
  localityColumnsToSearchFor,
  requiredLocalityColumns,
} from './leafletconfig';

interface BareLocalityData {
  latitude1: number;
  longitude1: number;
}

interface ComplexLocalityCoordinate {
  latitude2: number;
  longitude2: number;
  latlongtype: 'point' | 'line' | 'rectangle';
}

interface NamedLocality {
  localityname?: string;
}

interface LocalityWithAccuracy {
  latlongaccuracy?: number;
}

export type LocalityData = BareLocalityData &
  (ComplexLocalityCoordinate | RR<keyof ComplexLocalityCoordinate, undefined>) &
  NamedLocality &
  LocalityWithAccuracy;

export type LocalityField = keyof (BareLocalityData &
  ComplexLocalityCoordinate &
  NamedLocality &
  LocalityWithAccuracy);

type LocalityColumnIndexes = RR<LocalityField, number>;

const cellIsValid = (
  row: Readonly<string[]>,
  columnIndexes: IR<number>,
  columnName: string
): boolean =>
  typeof columnIndexes[columnName] !== 'undefined' &&
  columnIndexes[columnName] !== -1 &&
  row[columnIndexes[columnName]] !== null;

function formatCoordinate(
  row: Readonly<string[]>,
  columnIndexes: IR<number>,
  columnName: string
): number {
  if (row[columnIndexes[columnName]] === '0') return 0;

  const coordinate = latlongutils
    .parse(row[columnIndexes[columnName]])
    .toDegs() as {
    _components: [number];
    _sign: 1 | -1;
  };
  return coordinate._components[0] * coordinate._sign;
}

export function getLocalityCoordinate(
  row: Readonly<string[]>,
  columnIndexes: IR<number>,
  acceptPolygons = false
): LocalityData | false {
  const cellIsValidCurried = (columnName: string): boolean =>
    cellIsValid(row, columnIndexes, columnName);
  const formatCoordinateCurried = (columnName: string): number =>
    formatCoordinate(row, columnIndexes, columnName);

  if (!requiredLocalityColumns.every(cellIsValidCurried)) return false;

  try {
    return {
      latitude1: formatCoordinateCurried('latitude1'),
      longitude1: formatCoordinateCurried('longitude1'),
      ...(acceptPolygons &&
      cellIsValidCurried('latitude2') &&
      cellIsValidCurried('longitude2') &&
      (!cellIsValidCurried('latlongtype') ||
        row[columnIndexes.latlongtype].toLowerCase() !== 'point')
        ? {
            latitude2: formatCoordinateCurried('latitude2'),
            longitude2: formatCoordinateCurried('longitude2'),
            latlongtype:
              cellIsValidCurried('latlongtype') &&
              row[columnIndexes.latlongtype].toLowerCase() === 'line'
                ? 'line'
                : row[columnIndexes.latlongtype].toLowerCase() === 'rectangle'
                ? 'rectangle'
                : 'point',
          }
        : {}),
      localityname: cellIsValidCurried('localityname')
        ? row[columnIndexes.localityname]
        : undefined,
      latlongaccuracy: cellIsValidCurried('latlongaccuracy')
        ? Number.parseInt(row[columnIndexes.latlongaccuracy])
        : undefined,
    } as LocalityData;
  } catch {
    return false;
  }
}

/*
 * If there are multiple localities present in a row, check which
 * group this field belongs too
 */
export const getLocalityColumnsFromSelectedCell = (
  localityColumns: Readonly<LocalityColumnIndexes[]>,
  selectedColumn: number
): LocalityColumnIndexes | false =>
  localityColumns.find((localLocalityColumns) =>
    localityColumnsToSearchFor.includes(
      Object.keys(localLocalityColumns)[
        Object.values(localLocalityColumns).indexOf(selectedColumn)
      ] as LocalityField
    )
  ) ??
  (localityColumns[0] || false);

export const getLocalitiesDataFromSpreadsheet = (
  localityColumns: Readonly<LocalityColumnIndexes[]>,
  spreadsheetData: Readonly<string[][]>
): (LocalityData & { rowNumber: number })[] =>
  localityColumns.flatMap((columnIndexes) =>
    spreadsheetData
      .map((row, index) => ({
        locality: getLocalityCoordinate(row, columnIndexes, true),
        index,
      }))
      .filter(({ locality }) => locality)
      .map(({ locality, index }) => ({
        ...(locality as LocalityData),
        rowNumber: index,
      }))
  );

export const getLocalityDataFromLocalityResource = async (
  localityResource: any
): Promise<LocalityData> =>
  new Promise(async (resolve) =>
    Promise.all(
      localityColumnsToSearchFor.map(
        async (fieldName) =>
          new Promise((resolve) =>
            localityResource
              .rget(fieldName)
              .done((fieldValue: any) => resolve([fieldName, fieldValue]))
          )
      )
    ).then((localityFieldsArray: any) => {
      const localityFields = Object.fromEntries(localityFieldsArray);
      resolve(localityFields as LocalityData);
    })
  );
