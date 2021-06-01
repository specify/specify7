import type { IR, R, RA } from './components/wbplanview';
import type { MappingPath } from './components/wbplanviewmapper';
import type { LocalityPinFields } from './leafletconfig';
import { localityPinFields, requiredLocalityColumns } from './leafletconfig';
import type { Field, LocalityData } from './leafletutils';
import {
  formatCoordinate,
  getCanonicalMappingPath,
  getField,
  getLocalityData,
} from './leafletutils';
import type { SplitMappingPath } from './wbplanviewhelper';
import { findSubArray } from './wbplanviewhelper';
import {
  mappingPathToString,
  splitJoinedMappingPath,
} from './wbplanviewmodelhelper';

const addBaseTableName = (
  baseTableName: string,
  arrayOfMappings: RA<SplitMappingPath>
): RA<SplitMappingPath> =>
  arrayOfMappings.map(({ mappingPath, ...rest }) => ({
    ...rest,
    mappingPath: [baseTableName, ...mappingPath],
  }));

const matchLocalityPinFields = (
  arrayOfMappings: RA<SplitMappingPath>
): RA<
  LocalityPinFields & { readonly matchedPathsToRelationship: RA<MappingPath> }
> =>
  localityPinFields
    .map(({ pathToRelationship, pathsToFields }) => ({
      pathsToFields,
      pathToRelationship,
      matchedPathsToRelationship: [
        ...new Set(
          arrayOfMappings
            .map(({ mappingPath }) => {
              const subArrayPosition = findSubArray(
                getCanonicalMappingPath(mappingPath),
                pathToRelationship
              );
              return subArrayPosition === -1
                ? undefined
                : mappingPathToString(mappingPath.slice(0, subArrayPosition));
            })
            .filter(
              (mappingPath): mappingPath is string =>
                typeof mappingPath === 'string'
            )
        ),
      ].map(splitJoinedMappingPath),
    }))
    .filter(
      ({ matchedPathsToRelationship }) => matchedPathsToRelationship.length > 0
    );

export type SplitMappingPathWithFieldName = SplitMappingPath & {
  readonly fieldName: string;
};

const filterArrayOfMappings = (
  matchedLocalityGroups: RA<
    LocalityPinFields & { readonly matchedPathsToRelationship: RA<MappingPath> }
  >,
  arrayOfMappings: RA<SplitMappingPath>
): RA<SplitMappingPathWithFieldName> =>
  matchedLocalityGroups
    .flatMap(({ matchedPathsToRelationship, pathsToFields }) =>
      matchedPathsToRelationship.flatMap((mappingPath) =>
        pathsToFields.flatMap((pathToField) => {
          const splitMappingPath = arrayOfMappings.find(
            (splitMappingPath) =>
              mappingPathToString(splitMappingPath.mappingPath) ===
              mappingPathToString([
                ...mappingPath.filter(
                  (mappingPathPart) => mappingPathPart !== ''
                ),
                ...pathToField,
              ])
          );
          return typeof splitMappingPath === 'undefined'
            ? undefined
            : {
                ...splitMappingPath,
                fieldName: mappingPathToString(pathToField),
              };
        })
      )
    )
    .filter(
      (splitMappingPath): splitMappingPath is SplitMappingPathWithFieldName =>
        typeof splitMappingPath !== 'undefined'
    );

function groupLocalityColumns(
  arrayOfMappings: RA<SplitMappingPathWithFieldName>
): RA<IR<string>> {
  const groupedLocalityColumns: R<R<string>> = {};
  const globalLocalityColumns: R<string> = {};
  arrayOfMappings.forEach(({ mappingPath, fieldName, headerName }) => {
    const indexOfLocality = mappingPath.indexOf('locality');
    if (indexOfLocality === -1) globalLocalityColumns[fieldName] = headerName;
    else {
      const groupName = mappingPathToString(
        mappingPath.slice(0, indexOfLocality)
      );
      groupedLocalityColumns[groupName] ??= {};
      groupedLocalityColumns[groupName][fieldName] = headerName;
    }
  });
  return Object.values(groupedLocalityColumns).map((groupOfColumns) => ({
    ...groupOfColumns,
    ...globalLocalityColumns,
  }));
}

const filterInvalidLocalityColumnGroups = (
  localityColumnGroups: RA<IR<string>>
): RA<IR<string>> =>
  localityColumnGroups.filter((localityColumnGroups) =>
    requiredLocalityColumns.every(
      (requiredLocalityColumn) => requiredLocalityColumn in localityColumnGroups
    )
  );

const findLocalityColumns = (
  arrayOfMappings: RA<SplitMappingPath>
): RA<IR<string>> =>
  filterInvalidLocalityColumnGroups(
    groupLocalityColumns(
      filterArrayOfMappings(
        matchLocalityPinFields(arrayOfMappings),
        arrayOfMappings
      )
    )
  );

export const getLocalityColumnsFromSelectedCells = (
  localityColumnGroups: RA<IR<string>>,
  selectedHeaders: RA<string>
): RA<IR<string>> =>
  localityColumnGroups.filter((localityColumns) =>
    Object.values(localityColumns).some((localityColumn) =>
      selectedHeaders.includes(localityColumn)
    )
  ) || localityColumnGroups;

export const findLocalityColumnsInDataSet = (
  baseTableName: string,
  arrayOfMappings: RA<SplitMappingPath>
): RA<IR<string>> =>
  findLocalityColumns(addBaseTableName(baseTableName, arrayOfMappings));

export const getLocalitiesDataFromSpreadsheet = (
  localityColumnGroups: RA<IR<string>>,
  spreadsheetData: RA<RA<string>>,
  headers: RA<string>,
  customRowNumbers: RA<number>
): RA<LocalityData> =>
  Object.values(localityColumnGroups).flatMap((localityColumns) =>
    spreadsheetData
      .map((row, index) => ({
        locality: getLocalityCoordinate(row, headers, localityColumns),
        index: customRowNumbers[index] ?? index,
      }))
      .filter(({ locality }) => typeof locality !== 'boolean')
      .map(
        ({ locality, index }) =>
          ({
            ...locality,
            rowNumber: { headerName: 'Row Number', value: index },
          } as LocalityData)
      )
  );

export function getLocalityCoordinate(
  row: RA<string>,
  headers: RA<string>,
  localityColumns: IR<string>
): LocalityData | false {
  const getFieldCurried = (fieldName: string): Field<string> => ({
    headerName: localityColumns[fieldName],
    value: getField(row, headers, localityColumns, fieldName),
  });
  const formatCoordinateCurried = (fieldName: string): Field<number> => ({
    headerName: localityColumns[fieldName],
    value: formatCoordinate(getFieldCurried(fieldName).value),
  });

  return getLocalityData(
    localityColumns,
    getFieldCurried,
    formatCoordinateCurried
  );
}
