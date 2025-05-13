/**
 * Utility functions for getting locality data from locality resource and
 * workbench dataset
 *
 * @module
 */

import { Coord } from '../../utils/latLong';
import type { IR, RA } from '../../utils/types';
import type { MappingPath } from '../WbPlanView/Mapper';
import {
  mappingPathToString,
  valueIsTreeRank,
} from '../WbPlanView/mappingHelpers';
import { mappingLocalityColumns, requiredLocalityColumns } from './config';

export type Field<T extends Readonly<unknown>> = {
  readonly headerName: string;
  readonly value: T;
};

export type LocalityData = IR<Field<number | string>>;

export const getLocalityField = (
  row: RA<string>,
  headers: RA<string>,
  localityColumns: IR<string>,
  fieldName: string
): string => row[headers.indexOf(localityColumns[fieldName] ?? -1)] ?? '';

export function formatCoordinate(coordinate: string): number {
  if (coordinate === '' || coordinate === '0') return 0;

  const parsedCoordinate = Coord.parse(coordinate)?.toDegs();
  return parsedCoordinate === undefined
    ? 0
    : parsedCoordinate.components[0] * parsedCoordinate.sign;
}

export const findRanksInMappings = (
  mappingPaths: RA<MappingPath>
): RA<{ readonly groupName: string; readonly treeRankLocation: number }> =>
  mappingPaths
    .map((mappingPath) => ({
      mappingPath,
      treeRankLocation: mappingPath.findIndex(valueIsTreeRank),
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
              (columnName) => !mappingLocalityColumns.includes(columnName)
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

export function isValidAccuracy(
  latlongaccuracy: string | undefined
): latlongaccuracy is string {
  try {
    return (
      latlongaccuracy !== undefined &&
      !Number.isNaN(Number.parseFloat(latlongaccuracy)) &&
      Number.parseFloat(latlongaccuracy) >= 1
    );
  } catch {
    return false;
  }
}
