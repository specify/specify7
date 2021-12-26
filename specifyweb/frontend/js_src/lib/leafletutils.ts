/**
 * Utility functions for getting locality data from locality resource and
 * workbench dataset
 *
 * @module
 */

import type { IR, RA } from './types';
import { MappingPath } from './components/wbplanviewmapper';
import latlongutils from './latlongutils';
import { isValidAccuracy } from './leaflet';
import {
  mappingLocalityColumns,
  requiredLocalityColumns,
} from './leafletconfig';
import {
  mappingPathToString,
  valueIsTreeRank,
} from './wbplanviewmappinghelper';

export type Field<T> = { readonly headerName: string; readonly value: T };

export type LocalityData = IR<Field<string | number>>;

export const getField = (
  row: RA<string>,
  headers: RA<string>,
  localityColumns: IR<string>,
  fieldName: string
): string => row[headers.indexOf(localityColumns[fieldName] ?? -1)] ?? '';

export function formatCoordinate(coordinate: string): number {
  if (coordinate === '' || coordinate === '0') return 0;

  const parsedCoordinate = latlongutils.parse(coordinate).toDegs() as {
    _components: [number];
    _sign: 1 | -1;
  };
  return parsedCoordinate._components[0] * parsedCoordinate._sign;
}

export const findRanksInMappings = (
  mappingPaths: RA<MappingPath>
): RA<{ readonly groupName: string; treeRankLocation: number }> =>
  mappingPaths
    .map((mappingPath) => ({
      mappingPath,
      treeRankLocation: mappingPath.findIndex((mappingPathPart) =>
        valueIsTreeRank(mappingPathPart)
      ),
    }))
    .map(({ mappingPath, treeRankLocation }) =>
      treeRankLocation === -1
        ? { groupName: '', treeRankLocation }
        : {
            treeRankLocation,
            groupName: mappingPathToString(
              mappingPath.slice(0, treeRankLocation)
            ),
          }
    );

export const getLocalityData = (
  localityColumns: IR<string>,
  getField: (fieldName: string) => Field<string>,
  formatCoordinate: (fieldName: string) => Field<number>
): LocalityData | false =>
  requiredLocalityColumns.every((fieldName) => getField(fieldName).value !== '')
    ? {
        ...Object.fromEntries(
          Object.keys(localityColumns)
            .filter(
              (columnName) =>
                !(mappingLocalityColumns as RA<string>).includes(columnName)
            )
            .map((columnName) => [columnName, getField(columnName)])
        ),
        'locality.latitude1': formatCoordinate('locality.latitude1'),
        'locality.longitude1': formatCoordinate('locality.longitude1'),
        ...(getField('locality.latitude2').value !== '' &&
        getField('locality.longitude2').value !== '' &&
        getField('locality.latlongtype').value.toLowerCase() !== 'point'
          ? {
              'locality.latitude2': formatCoordinate('locality.latitude2'),
              'locality.longitude2': formatCoordinate('locality.longitude2'),
              'locality.latlongtype': {
                value: ['line', ''].includes(
                  getField('locality.latlongtype').value.toLowerCase()
                )
                  ? 'line'
                  : 'rectangle',
                headerName: getField('locality.latlongtype').headerName,
              },
            }
          : {}),
        'locality.latlongaccuracy': isValidAccuracy(
          getField('locality.latlongaccuracy').value
        )
          ? getField('locality.latlongaccuracy')
          : { value: '', headerName: '' },
      }
    : false;
