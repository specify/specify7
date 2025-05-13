import { wbText } from '../../localization/workbench';
import type { IR, R, RA, RR, WritableArray } from '../../utils/types';
import type { AnyTree } from '../DataModel/helperTypes';
import type { SpecifyTable } from '../DataModel/specifyTable';
import type { Tables } from '../DataModel/types';
import { getIcon, unknownIcon } from '../InitialContext/icons';
import {
  isTreeTable,
  strictGetTreeDefinitionItems,
} from '../InitialContext/treeRanks';
import { findLocalityColumnsInDataSet } from '../Leaflet/wbLocalityDataExtractor';
import { hasTreeAccess } from '../Permissions/helpers';
import type { SplitMappingPath } from '../WbPlanView/mappingHelpers';
import {
  getNameFromTreeRankName,
  mappingPathToString,
  valueIsTreeRank,
} from '../WbPlanView/mappingHelpers';
import { getTableFromMappingPath } from '../WbPlanView/navigator';
import { parseUploadPlan } from '../WbPlanView/uploadPlanParser';
import type { Dataset } from '../WbPlanView/Wrapped';

export type WbMapping = {
  readonly baseTable: SpecifyTable;
  readonly lines: RA<SplitMappingPath>;
  // TableName of each column
  readonly tableNames: RA<keyof Tables>;
  // Path to an icon for each header
  readonly mappedHeaders: RR<number, string>;
  readonly coordinateColumns: RR<number, 'Lat' | 'Long'>;
  readonly defaultValues: RR<number, string>;
  readonly treeRanks: RA<
    RA<{
      readonly physicalCol: number;
      readonly rankId: number;
    }>
  >;
  readonly localityColumns: RA<IR<string>>;
};

export function parseWbMappings(dataset: Dataset): WbMapping | undefined {
  if (dataset.uploadplan === null) return undefined;
  const mappings = parseUploadPlan(dataset.uploadplan);
  const defaultValues = getDefaultValues(mappings.lines, dataset.columns);
  const tableNames = mappings.lines.map(({ mappingPath }) =>
    getTableFromMappingPath(mappings.baseTable.name, mappingPath)
  );
  const mappedHeaders = identifyMappedHeaders(
    dataset,
    tableNames,
    mappings.lines
  );
  const localityColumns = findLocalityColumnsInDataSet(
    mappings.baseTable.name,
    mappings.lines
  );
  const coordinateColumns = identifyCoordinateColumns(
    localityColumns,
    dataset.columns
  );
  const treeRanks = identifyTreeRanks(
    mappings.lines,
    tableNames,
    dataset.columns
  );
  return {
    ...mappings,
    tableNames,
    defaultValues,
    mappedHeaders,
    localityColumns,
    coordinateColumns,
    treeRanks,
  };
}

const getDefaultValues = (
  lines: RA<SplitMappingPath>,
  columns: RA<string>
): RR<number, string> =>
  Object.fromEntries(
    Object.entries(extractDefaultValues(lines, wbText.emptyStringInline())).map(
      ([headerName, defaultValue]) => [
        columns.indexOf(headerName),
        defaultValue,
      ]
    )
  );

const extractDefaultValues = (
  lines: RA<SplitMappingPath>,
  emptyStringReplacement: string
): IR<string> =>
  Object.fromEntries(
    lines
      .map(({ headerName, columnOptions }) => [
        headerName,
        columnOptions.default === ''
          ? emptyStringReplacement
          : columnOptions.default,
      ])
      .filter(([, defaultValue]) => defaultValue !== null)
  );

/** Match columns to respective table icons */
const identifyMappedHeaders = (
  dataset: Dataset,
  tableNames: RA<keyof Tables>,
  lines: RA<SplitMappingPath>
): RR<number, string> =>
  Object.fromEntries(
    tableNames.map(
      (tableName, mappingCol) =>
        [
          mappingColToPhysicalCol(dataset, lines, mappingCol),
          getIcon(tableName) ?? unknownIcon,
        ] as const
    )
  );

const mappingColToPhysicalCol = (
  dataset: Dataset,
  lines: RA<SplitMappingPath>,
  mappingCol: number
): number => dataset.columns.indexOf(lines[mappingCol].headerName);

const columnHandlers = {
  'locality.latitude1': 'Lat',
  'locality.longitude1': 'Long',
  'locality.latitude2': 'Lat',
  'locality.longitude2': 'Long',
} as const;

const identifyCoordinateColumns = (
  localityColumns: RA<IR<string>>,
  columns: RA<string>
): RR<number, 'Lat' | 'Long'> =>
  Object.fromEntries(
    localityColumns.flatMap((localityColumns) =>
      Object.entries(localityColumns)
        .filter(([fieldName]) => fieldName in columnHandlers)
        .map(
          ([fieldName, headerName]) =>
            [
              columns.indexOf(headerName),
              columnHandlers[fieldName as 'locality.latitude1'],
            ] as const
        )
    )
  );

const identifyTreeRanks = (
  lines: RA<SplitMappingPath>,
  tableNames: RA<keyof Tables>,
  columns: RA<string>
): RA<
  RA<{
    readonly physicalCol: number;
    readonly rankId: number;
  }>
> =>
  Object.values(
    lines
      .map((splitMappingPath, index) => ({
        ...splitMappingPath,
        index,
      }))
      .filter(
        ({ mappingPath, index }) =>
          valueIsTreeRank(mappingPath.at(-2)) &&
          mappingPath.at(-1) === 'name' &&
          isTreeTable(tableNames[index]) &&
          hasTreeAccess(tableNames[index] as AnyTree['tableName'], 'read')
      )
      .map(({ mappingPath, headerName, index }) => ({
        mappingGroup: mappingPathToString(mappingPath.slice(0, -2)),
        tableName: tableNames[index] as AnyTree['tableName'],
        rankName: getNameFromTreeRankName(mappingPath.at(-2)!),
        physicalCol: columns.indexOf(headerName),
      }))
      .map(({ mappingGroup, tableName, rankName, physicalCol }) => ({
        mappingGroup,
        physicalCol,
        rankId:
          Object.values(
            strictGetTreeDefinitionItems(tableName, false, 'all')
          ).find(({ name }) => name === rankName)?.rankId ?? -1,
      }))
      .reduce<
        R<
          WritableArray<{
            readonly physicalCol: number;
            readonly rankId: number;
          }>
        >
      >((groupedRanks, { mappingGroup, ...rankMapping }) => {
        groupedRanks[mappingGroup] ??= [];
        groupedRanks[mappingGroup].push(rankMapping);
        return groupedRanks;
      }, {})
  );
