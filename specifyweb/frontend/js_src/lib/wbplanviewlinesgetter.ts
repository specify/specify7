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
import type { IR, RA } from './types';
import type { ColumnOptions, UploadPlan } from './uploadplantomappingstree';
import { uploadPlanToMappingsTree } from './uploadplantomappingstree';
import { mappingsTreeToSplitMappingPaths } from './wbplanviewtreehelper';
import { Tables } from './datamodel';

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

export function getLinesFromUploadPlan(
  originalHeaders: RA<string> = [],
  uploadPlan: UploadPlan
): {
  readonly baseTableName: keyof Tables;
  readonly lines: RA<MappingLine>;
  readonly mustMatchPreferences: IR<boolean>;
} {
  const { baseTableName, mappingsTree, mustMatchPreferences } =
    uploadPlanToMappingsTree(originalHeaders, uploadPlan);

  const mappingLines = mappingsTreeToSplitMappingPaths(mappingsTree);

  let headers = originalHeaders;
  if (headers.length === 0)
    headers = mappingLines.map(({ headerName }) => headerName);

  const lines = mappingLines
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
    baseTableName,
    lines,
    mustMatchPreferences,
  };
}
