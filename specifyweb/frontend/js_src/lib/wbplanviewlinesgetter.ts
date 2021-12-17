import type { AutoMapperResults } from './automapper';
import Automapper from './automapper';
import type { IR, RA } from './types';
import type { MappingLine } from './components/wbplanviewmapper';
import type { ColumnOptions, UploadPlan } from './uploadplantomappingstree';
import { uploadPlanToMappingsTree } from './uploadplantomappingstree';
import { mappingsTreeToArrayOfSplitMappings } from './wbplanviewtreehelper';

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
  runAutomapper,
  baseTableName = '',
}: {
  readonly headers?: RA<string>;
} & (
  | {
      readonly runAutomapper: true;
      readonly baseTableName: string;
    }
  | {
      readonly runAutomapper: false;
      readonly baseTableName?: string;
    }
)): RA<MappingLine> {
  const lines = headers.map(
    (headerName): MappingLine => ({
      mappingPath: ['0'],
      mappingType: 'existingHeader',
      headerName,
      columnOptions: defaultColumnOptions,
    })
  );

  if (!runAutomapper || typeof baseTableName === 'undefined') return lines;

  const automapperResults: AutoMapperResults = new Automapper({
    headers,
    baseTable: baseTableName,
    scope: 'automapper',
  }).map();

  return lines.map((line) => {
    const { headerName } = line;
    const automapperMappingPaths = automapperResults[headerName];
    return typeof automapperMappingPaths === 'undefined'
      ? line
      : {
          mappingPath: automapperMappingPaths[0],
          mappingType: 'existingHeader',
          headerName,
          columnOptions: defaultColumnOptions,
        };
  });
}

export function getLinesFromUploadPlan(
  originalHeaders: RA<string> = [],
  uploadPlan: UploadPlan
): {
  readonly baseTableName: string;
  readonly lines: RA<MappingLine>;
  readonly mustMatchPreferences: IR<boolean>;
} {
  const { baseTableName, mappingsTree, mustMatchPreferences } =
    uploadPlanToMappingsTree(originalHeaders, uploadPlan);

  const mappingLines = mappingsTreeToArrayOfSplitMappings(mappingsTree);

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
      [
        ...getLinesFromHeaders({
          headers,
          runAutomapper: false,
        }),
      ]
    );

  return {
    baseTableName,
    lines,
    mustMatchPreferences,
  };
}
