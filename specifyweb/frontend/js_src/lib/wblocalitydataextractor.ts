/**
 * Extract data from locality and related columns in a Data Set in a format
 * that can be displayed in the pop-up bubbles in Leaflet
 *
 * @module
 */

import type { MappingPath } from './components/wbplanviewmapper';
import type { Tables } from './datamodel';
import type { LocalityPinFields } from './leafletconfig';
import { localityPinFields, requiredLocalityColumns } from './leafletconfig';
import type { Field, LocalityData } from './leafletutils';
import {
  findRanksInMappings,
  formatCoordinate,
  getField,
  getLocalityData,
} from './leafletutils';
import type { IR, R, RA } from './types';
import { filterArray } from './types';
import type { SplitMappingPath } from './wbplanviewmappinghelper';
import {
  findSubArray,
  getCanonicalMappingPath,
  mappingPathToString,
  splitJoinedMappingPath,
} from './wbplanviewmappinghelper';

const addBaseTableName = (
  baseTableName: keyof Tables,
  splitMappingPaths: RA<SplitMappingPath>
): RA<SplitMappingPath> =>
  splitMappingPaths.map(({ mappingPath, ...rest }) => ({
    ...rest,
    mappingPath: [baseTableName, ...mappingPath],
  }));

const matchLocalityPinFields = (
  splitMappingPaths: SplitMappingPaths
): RA<
  LocalityPinFields & { readonly matchedPathsToRelationship: RA<MappingPath> }
> =>
  localityPinFields
    .map(({ pathToRelationship, pathsToFields }) => ({
      pathsToFields,
      pathToRelationship,
      matchedPathsToRelationship: Array.from(
        new Set(
          filterArray(
            splitMappingPaths.map(({ mappingPath, canonicalMappingPath }) => {
              const subArrayPosition = findSubArray(
                canonicalMappingPath,
                pathToRelationship
              );
              return subArrayPosition === -1
                ? undefined
                : mappingPathToString(mappingPath.slice(0, subArrayPosition));
            })
          )
        ),
        splitJoinedMappingPath
      ),
    }))
    .filter(
      ({ matchedPathsToRelationship }) => matchedPathsToRelationship.length > 0
    );

export type SplitMappingPathWithFieldName = SplitMappingPath & {
  readonly fieldName: string;
  readonly canonicalMappingPath: MappingPath;
};

const filterSplitMappingPaths = (
  matchedLocalityGroups: RA<
    LocalityPinFields & { readonly matchedPathsToRelationship: RA<MappingPath> }
  >,
  splitMappingPaths: SplitMappingPaths
): RA<SplitMappingPathWithFieldName> =>
  filterArray(
    matchedLocalityGroups.flatMap(
      ({ matchedPathsToRelationship, pathsToFields }) =>
        matchedPathsToRelationship.flatMap((mappingPath) =>
          pathsToFields.flatMap((pathToField) =>
            splitMappingPaths
              .filter(
                (splitMappingPath) =>
                  mappingPathToString(splitMappingPath.canonicalMappingPath) ===
                  mappingPathToString([
                    ...mappingPath.filter(
                      (mappingPathPart) => mappingPathPart !== ''
                    ),
                    ...pathToField,
                  ])
              )
              .map((splitMappingPath) => ({
                ...splitMappingPath,
                fieldName: mappingPathToString(
                  splitMappingPath.mappingPath.slice(-pathToField.length)
                ),
              }))
          )
        )
    )
  );

function groupLocalityColumns(
  splitMappingPaths: RA<SplitMappingPathWithFieldName>
): RA<IR<string>> {
  const groupedLocalityColumns: R<R<string>> = {};
  const globalLocalityColumns: R<string> = {};
  splitMappingPaths.forEach(({ mappingPath, fieldName, headerName }) => {
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
    ...globalLocalityColumns,
    ...groupOfColumns,
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
  splitMappingPaths: SplitMappingPaths
): RA<IR<string>> =>
  filterInvalidLocalityColumnGroups(
    groupLocalityColumns(
      filterSplitMappingPaths(
        matchLocalityPinFields(splitMappingPaths),
        splitMappingPaths
      )
    )
  );

export function getLocalityColumnsFromSelectedCells(
  localityColumnGroups: RA<IR<string>>,
  selectedHeaders: RA<string>
): RA<IR<string>> {
  const localityColumns = localityColumnGroups.filter((localityColumns) =>
    Object.values(localityColumns).some((localityColumn) =>
      selectedHeaders.includes(localityColumn)
    )
  );

  return localityColumns.length === 0 ? localityColumnGroups : localityColumns;
}

type SplitMappingPaths = RA<
  SplitMappingPath & { readonly canonicalMappingPath: MappingPath }
>;

const addCanonicalMappingPaths = (
  splitMappingPaths: RA<SplitMappingPath>
): SplitMappingPaths =>
  splitMappingPaths.map(({ mappingPath, ...rest }) => ({
    ...rest,
    mappingPath,
    canonicalMappingPath: getCanonicalMappingPath(mappingPath),
  }));

export const findLocalityColumnsInDataSet = (
  baseTableName: keyof Tables,
  splitMappingPaths: RA<SplitMappingPath>
): RA<IR<string>> =>
  findLocalityColumns(
    addCanonicalMappingPaths(addBaseTableName(baseTableName, splitMappingPaths))
  );

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
      .map(({ locality, index }) =>
        reshapeLocalityData({
          ...locality,
          rowNumber: { headerName: 'Row Number', value: index },
        })
      )
  );

/** Aggregate tree ranks into a single full name */
function reshapeLocalityData(localityData: LocalityData): LocalityData {
  const localityDataEntries = Object.entries(localityData)
    .map(([mappingPathString, field]) => ({
      mappingPath: splitJoinedMappingPath(mappingPathString),
      field,
    }))
    .reverse();
  const treeRanks = findRanksInMappings(
    localityDataEntries.map(({ mappingPath }) => mappingPath)
  );
  const aggregatedTreeRanks = treeRanks.reduce<R<Field<string | number>>>(
    (aggregated, { groupName, treeRankLocation }, index) => {
      if (treeRankLocation === -1) return aggregated;

      const { headerName, value } = localityDataEntries[index].field;

      if (groupName in aggregated)
        aggregated[groupName] = {
          ...aggregated[groupName],
          value: `${value} ${aggregated[groupName].value}`,
        };
      else
        aggregated[groupName] = {
          headerName,
          value,
        };

      return aggregated;
    },
    {}
  );

  return Object.fromEntries(
    filterArray(
      localityDataEntries
        .map(({ mappingPath, field }, index) => {
          const mappingPathString = mappingPathToString(mappingPath);
          const { treeRankLocation, groupName } = treeRanks[index];
          if (treeRankLocation === -1)
            return [mappingPathString, field] as const;
          else if (
            treeRanks.findIndex(
              (treeRank) => treeRank.groupName === groupName
            ) === index
          )
            return [mappingPathString, aggregatedTreeRanks[groupName]] as const;
          else return undefined;
        })
        .reverse()
    )
  );
}

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
