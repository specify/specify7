import type { AutoMapperResults } from './automapper';
import Automapper from './automapper';
import type { IR } from './components/wbplanview';
import type { ListOfHeaders, MappingLine } from './components/wbplanviewmapper';
import type { ColumnOptions, UploadPlan } from './uploadplantomappingstree';
import { uploadPlanToMappingsTree } from './uploadplantomappingstree';
import { mappingsTreeToArrayOfSplitMappings } from './wbplanviewtreehelper';

export const defaultColumnOptions: ColumnOptions = {
  matchBehavior: 'ignoreNever',
  nullAllowed: true,
  default: null,
} as const;

export function getLinesFromHeaders({
  headers = [],
  runAutomapper,
  baseTableName = '',
}: {
  headers?: Readonly<ListOfHeaders>;
} & (
  | {
      runAutomapper: true;
      baseTableName: string;
    }
  | {
      runAutomapper: false;
      baseTableName?: string;
    }
)): MappingLine[] {
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
    checkForExistingMappings: false,
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
  headers: Readonly<ListOfHeaders> = [],
  uploadPlan: Readonly<UploadPlan>
): {
  readonly baseTableName: string;
  readonly lines: MappingLine[];
  readonly mustMatchPreferences: IR<boolean>;
} {
  const {
    baseTableName,
    mappingsTree,
    mustMatchPreferences,
  } = uploadPlanToMappingsTree(headers, uploadPlan);

  const lines = mappingsTreeToArrayOfSplitMappings(mappingsTree)
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
      getLinesFromHeaders({
        headers,
        runAutomapper: false,
      })
    );

  return {
    baseTableName,
    lines,
    mustMatchPreferences,
  };
}
