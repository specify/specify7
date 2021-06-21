/*
 * Utility functions for getting locality data from locality resource and
 * workbench dataset
 *
 */

import type { IR, RA, RR } from './components/wbplanview';
import type { MappingPath } from './components/wbplanviewmapper';
import latlongutils from './latlongutils';
import { isValidAccuracy } from './leaflet';
import {
  mappingLocalityColumns,
  requiredLocalityColumns,
} from './leafletconfig';
import {
  formatReferenceItem,
  valueIsReferenceItem,
} from './wbplanviewmodelhelper';

export type Field<T> = { readonly headerName: string; readonly value: T };

interface BareLocalityData {
  readonly 'locality.latitude1': Field<number>;
  readonly 'locality.longitude1': Field<number>;
}

interface ComplexLocalityCoordinate {
  readonly 'locality.latitude2': Field<number>;
  readonly 'locality.longitude2': Field<number>;
  readonly 'locality.latlongtype': Field<'point' | 'line' | 'rectangle'>;
}

interface LocalityWithAccuracy {
  readonly 'locality.latlongaccuracy': Field<string>;
}

export type LocalityData = BareLocalityData &
  (ComplexLocalityCoordinate | RR<keyof ComplexLocalityCoordinate, undefined>) &
  LocalityWithAccuracy &
  IR<Field<string | number>>;

export type LocalityField = keyof (BareLocalityData &
  ComplexLocalityCoordinate &
  LocalityWithAccuracy);

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

// Replaces all to-many reference numbers with #1
export const getCanonicalMappingPath = (
  mappingPath: MappingPath
): MappingPath =>
  mappingPath.map((mappingPathPart) =>
    valueIsReferenceItem(mappingPathPart)
      ? formatReferenceItem(1)
      : mappingPathPart
  );

export const getLocalityData = (
  localityColumns: IR<string>,
  getField: (fieldName: string) => Field<string>,
  formatCoordinate: (fieldName: string) => Field<number>
): LocalityData | false =>
  requiredLocalityColumns.every((fieldName) => getField(fieldName).value !== '')
    ? ({
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
      } as LocalityData)
    : false;
