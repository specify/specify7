/*
 * Utility functions for getting locality data from locality resource and
 * workbench dataset
 *
 */

'use strict';

import type { IR, RA, RR } from './components/wbplanview';
import latlongutils from './latlongutils';

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

/*
 * If there are multiple localities present in a row, check which
 * group this field belongs too
 */
export const getLocalityColumnsFromSelectedCell = (
  localityColumnGroups: RA<IR<string>>,
  selectedHeader: string
): IR<string> | false =>
  localityColumnGroups.find((localityColumns) =>
    Object.values(localityColumns).includes(selectedHeader)
  ) ??
  localityColumnGroups[0] ??
  false;

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
