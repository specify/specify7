/**
 * Helps create initial WbPlanView state based on Upload Plan or Data Set
 * headers
 *
 * @module
 *
 */

import type { AutoMapperResults } from './automapper';
import { AutoMapper } from './automapper';
import type { MappingLine } from './components/wbplanviewmapper';
import type { Tables } from './datamodel';
import type { IR, RA } from './types';
import type { ColumnOptions, UploadPlan } from './uploadplanparser';
import { parseUploadPlan } from './uploadplanparser';
import { f } from './functools';

export const defaultColumnOptions: ColumnOptions = {
  matchBehavior: 'ignoreNever',
  nullAllowed: true,
  default: null,
} as const;

export const columnOptionsAreDefault = (
  columnOptions: ColumnOptions
): boolean =>
  Object.entries(columnOptions).every(
    ([key, value]) => defaultColumnOptions[key as keyof ColumnOptions] === value
  );

/** Produce WbPlanView line and (optionally) run autoMapper s*/
export function getLinesFromHeaders({
  headers = [],
  runAutoMapper,
  baseTableName = undefined,
}: {
  readonly headers?: RA<string>;
} & (
  | {
      readonly runAutoMapper: true;
      readonly baseTableName: keyof Tables;
    }
  | {
      readonly runAutoMapper: false;
      readonly baseTableName?: keyof Tables;
    }
)): RA<MappingLine> {
  const lines = headers.map(
    (headerName): MappingLine => ({
      mappingPath: ['0'],
      headerName,
      columnOptions: defaultColumnOptions,
    })
  );

  if (!runAutoMapper || typeof baseTableName === 'undefined') return lines;

  const autoMapperResults: AutoMapperResults = new AutoMapper({
    headers,
    baseTable: baseTableName,
    scope: 'autoMapper',
    getMappedFields: f.array,
  }).map();

  return lines.map((line) => {
    const { headerName } = line;
    const autoMapperMappingPaths = autoMapperResults[headerName];
    return Array.isArray(autoMapperMappingPaths)
      ? {
          mappingPath: autoMapperMappingPaths[0],
          headerName,
          columnOptions: defaultColumnOptions,
        }
      : line;
  });
}

/**
 * Get WbPlanView lines from UploadPlan and data set headers
 * Handles cases when UploadPlan from a different Data Set is reused:
 *  - All headers present in the Data Set are included in the same order
 *  - Headers present in the upload plan, but not in the Data Set are dropped
 *  - Headers present in the Data Set but not in upload plan are included in
 *    order (without AutoMapping)
 */
export function getLinesFromUploadPlan(
  originalHeaders: RA<string>,
  uploadPlan: UploadPlan
): {
  readonly baseTableName: keyof Tables;
  readonly lines: RA<MappingLine>;
  readonly mustMatchPreferences: IR<boolean>;
} {
  const { baseTable, lines, mustMatchPreferences } =
    parseUploadPlan(uploadPlan);

  const headers =
    originalHeaders.length === 0
      ? lines.map(({ headerName }) => headerName)
      : originalHeaders;

  const newLines = lines
    .map((splitMappingPath) => ({
      ...splitMappingPath,
      headerIndex: headers.indexOf(splitMappingPath.headerName),
    }))
    .filter(({ headerName }) => headers.includes(headerName))
    .reduce<MappingLine[]>(
      (lines, { headerIndex, ...splitMappingPath }) => {
        lines[headerIndex] = splitMappingPath;
        return lines;
      },
      Array.from(
        getLinesFromHeaders({
          headers,
          runAutoMapper: false,
        })
      )
    );

  return {
    baseTableName: baseTable.name,
    lines: newLines,
    mustMatchPreferences,
  };
}
