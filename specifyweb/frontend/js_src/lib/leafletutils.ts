/*
* Utility functions for getting locality data from locality resource and
* workbench dataset
* */

'use strict';

import { R } from './components/wbplanview';
import latlongutils from './latlongutils';
import { localityFieldsToGet } from './leafletconfig';

interface BareLocalityData {
  latitude1: number,
  longitude1: number,
}

interface ComplexLocalityCoordinate {
  latitude2: number,
  longitude2: number,
  latlongtype: 'point' | 'line' | 'rectangle'
}

interface NamedLocality {
  localityname?: string
}

interface LocalityWithAccuracy {
  latlongaccuracy?: number
}

type AllOrNothing<T> = T|Record<keyof T,undefined>;

export type LocalityData = BareLocalityData &
  AllOrNothing<ComplexLocalityCoordinate> &
  NamedLocality &
  LocalityWithAccuracy;

type LocalityField = keyof (
  BareLocalityData
  & ComplexLocalityCoordinate
  & NamedLocality
  & LocalityWithAccuracy
);

type LocalityColumnIndexes = Record<LocalityField,number>;

const cellIsValid = (
  row:string[],
  columnIndexes:R<number>,
  columnName:string
):boolean =>
  typeof columnIndexes[columnName] !== 'undefined' &&
  columnIndexes[columnName] !== -1 &&
  row[columnIndexes[columnName]] !== null;

function formatCoordinate(
  row:string[],
  columnIndexes:R<number>,
  columnName:string
):number {

  if (row[columnIndexes[columnName]] === '0')
    return 0;

  const coordinate =
    (latlongutils as any).parse(row[columnIndexes[columnName]]).toDegs() as {
      _components: [number],
      _sign: 1|-1
    };
  return coordinate._components[0] * coordinate._sign;
}


export function getLocalityCoordinate(
  row:string[],
  columnIndexes:R<number>,
  acceptPolygons = false
):LocalityData|false {

  const cellIsValidCurried = (columnName:string) =>
    cellIsValid(row, columnIndexes, columnName);
  const formatCoordinateCurried = (columnName:string) =>
    formatCoordinate(row, columnIndexes, columnName);

  if (
    !cellIsValidCurried('latitude1') ||
    !cellIsValidCurried('longitude1')
  )
    return false;

  try {

    return {
      latitude1: formatCoordinateCurried('latitude1'),
      longitude1: formatCoordinateCurried('longitude1'),
      ...(
        (
          acceptPolygons &&
          cellIsValidCurried('latitude2') &&
          cellIsValidCurried('longitude2') &&
          (
            !cellIsValidCurried('latlongtype') ||
            row[columnIndexes.latlongtype].toLowerCase() !== 'point'
          )
        ) ?
          {
            latitude2: formatCoordinateCurried('latitude2'),
            longitude2: formatCoordinateCurried('longitude2'),
            latlongtype: (
              cellIsValidCurried('latlongtype') &&
              (row[columnIndexes.latlongtype].toLowerCase() === 'line') ?
                'line' :
                row[columnIndexes.latlongtype].toLowerCase() === 'rectangle' ?
                  'rectangle' :
                  'point'
            )
          } :
          {}
      ),
      localityname: cellIsValidCurried('localityname') ?
        row[columnIndexes.localityname] :
        undefined,
      latlongaccuracy: cellIsValidCurried('latlongaccuracy') ?
        parseInt(row[columnIndexes.latlongaccuracy]) :
        undefined,
    } as LocalityData;

  }
  catch (e) {
    return false;
  }

}

export const localityColumnsToSearchFor:Readonly<LocalityField[]> = [
  'localityname',
  'latitude1',
  'longitude1',
  'latitude2',
  'longitude2',
  'latlongtype',
  'latlongaccuracy',
] as const;

// if there are multiple localities present in a row, check which
// group this field belongs too
export const getLocalityColumnsFromSelectedCell = (
  localityColumns:LocalityColumnIndexes[],
  selectedColumn:number
):LocalityColumnIndexes|false =>
  localityColumns.filter(localLocalityColumns=>
    localityColumnsToSearchFor.indexOf(
      Object.keys(
        localLocalityColumns
      )[Object.values(
        localLocalityColumns
      ).indexOf(selectedColumn)] as LocalityField
    ) !== -1
  )[0] || localityColumns[0] || false;

export const getLocalitiesDataFromSpreadsheet = (
  localityColumns:LocalityColumnIndexes[],
  spreadsheetData:string[][]
):(LocalityData & {rowNumber:number})[] =>
  localityColumns.flatMap(columnIndexes=>
    spreadsheetData.map((row, index) => ({
      locality: getLocalityCoordinate(row, columnIndexes, true),
      index
    })).filter(({locality})=>
      locality
    ).map(({locality, index})=>({
      ...(locality as LocalityData),
      rowNumber: index,
    }))
  );

export const getLocalityDataFromLocalityResource = (
  localityResource:any
):Promise<LocalityData>=>
  new Promise(resolve =>
    Promise.all(
      localityFieldsToGet.map(fieldName =>
        new Promise(resolve =>
          localityResource.rget(fieldName).done((fieldValue:any) =>
            resolve([fieldName, fieldValue]),
          ),
        ),
      ),
    ).then((localityFieldsArray:any) => {
      const localityFields = Object.fromEntries(localityFieldsArray);
      resolve(localityFields as LocalityData);
    }),
  );
