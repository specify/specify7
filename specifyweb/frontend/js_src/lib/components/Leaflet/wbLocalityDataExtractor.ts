/**
 * Extract data from locality and related columns in a Data Set in a format
 * that can be displayed in the pop-up bubbles in Leaflet
 *
 * @module
 */

import type { IR, R, RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { toLowerCase } from '../../utils/utils';
import type { Tables } from '../DataModel/types';
import { pathStartsWith } from '../WbPlanView/helpers';
import type { MappingPath } from '../WbPlanView/Mapper';
import type { SplitMappingPath } from '../WbPlanView/mappingHelpers';
import {
  getCanonicalMappingPath,
  mappingPathToString,
  splitJoinedMappingPath,
} from '../WbPlanView/mappingHelpers';
import type { LocalityPinFields } from './config';
import { localityPinFields, requiredLocalityColumns } from './config';
import type { Field, LocalityData } from './helpers';
import {
  findRanksInMappings,
  formatCoordinate,
  getLocalityData,
  getLocalityField,
} from './helpers';

const addBaseTableName = (
  baseTableName: keyof Tables,
  splitMappingPaths: RA<SplitMappingPath>
): RA<SplitMappingPath> =>
  splitMappingPaths.map(({ mappingPath, ...rest }) => ({
    ...rest,
    mappingPath: [baseTableName, ...mappingPath],
  }));

export const uniqueMappingPaths = (
  mappingPaths: RA<MappingPath | undefined>
): RA<MappingPath> =>
  /*
   * See https://github.com/freaktechnik/eslint-plugin-array-func/issues/344
   */
  // eslint-disable-next-line array-func/from-map
  Array.from(
    new Set(filterArray(mappingPaths).map(mappingPathToString)),
    splitJoinedMappingPath
  ).map((path) => (path.length === 1 && path[0] === '' ? [] : path));

const matchLocalityPinFields = (
  splitMappingPaths: SplitMappingPaths
): RA<
  LocalityPinFields & { readonly matchedPathsToRelationship: RA<MappingPath> }
> =>
  localityPinFields
    .map(({ pathToRelationship, pathsToFields }) => ({
      pathsToFields: pathsToFields.map((path) => path.map(toLowerCase)),
      pathToRelationship: pathToRelationship.map(toLowerCase),
      matchedPathsToRelationship: uniqueMappingPaths(
        splitMappingPaths.map(({ mappingPath, canonicalMappingPath }) => {
          const subArrayPosition = findSubArray(
            canonicalMappingPath.map(toLowerCase),
            pathToRelationship.map(toLowerCase)
          );
          return subArrayPosition === -1
            ? undefined
            : mappingPath.slice(0, subArrayPosition);
        })
      ),
    }))
    .filter(
      ({ matchedPathsToRelationship }) => matchedPathsToRelationship.length > 0
    );

/** Find the index of a subArray in array. On failure returns -1 */
const findSubArray = (array: RA<string>, subArray: RA<string>): number =>
  array.findIndex((_, index) => pathStartsWith(array.slice(index), subArray));

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

/**
 * Filter down localityColumns to only include the ones that were selected.
 * If selected cells are not from any localityColumns groups, select all of them
 */
export function getSelectedLocalityColumns(
  localityColumns: RA<IR<string>>,
  selectedHeaders: RA<string>
): RA<IR<string>> {
  const selectedGroups = localityColumns.filter((localityColumns) =>
    Object.values(localityColumns).some((localityColumn) =>
      selectedHeaders.includes(localityColumn)
    )
  );

  return selectedGroups.length === 0 ? localityColumns : selectedGroups;
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

const convertToLowerCase = (
  splitMappingPaths: RA<SplitMappingPath>
): RA<SplitMappingPath> =>
  splitMappingPaths.map(({ mappingPath, ...rest }) => ({
    ...rest,
    mappingPath: mappingPath.map(toLowerCase),
  }));

export const findLocalityColumnsInDataSet = (
  baseTableName: keyof Tables,
  splitMappingPaths: RA<SplitMappingPath>
): RA<IR<string>> =>
  findLocalityColumns(
    addCanonicalMappingPaths(
      convertToLowerCase(addBaseTableName(baseTableName, splitMappingPaths))
    )
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
  const aggregatedTreeRanks = treeRanks.reduce<R<Field<number | string>>>(
    (aggregated, { groupName, treeRankLocation }, index) => {
      if (treeRankLocation === -1) return aggregated;

      const { headerName, value } = localityDataEntries[index].field;

      aggregated[groupName] =
        groupName in aggregated
          ? {
              ...aggregated[groupName],
              value: `${value} ${aggregated[groupName].value}`,
            }
          : {
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
    value: getLocalityField(row, headers, localityColumns, fieldName),
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
