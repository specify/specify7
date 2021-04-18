import type { AutoMapperResults } from './automapper';
import Automapper from './automapper';
import type { R } from './components/wbplanview';
import type { ListOfHeaders, MappingLine } from './components/wbplanviewmapper';
import type { ColumnOptions, UploadPlan } from './uploadplantomappingstree';
import { uploadPlanToMappingsTree } from './uploadplantomappingstree';
import { fullMappingPathParser } from './wbplanviewhelper';
import { mappingsTreeToArrayOfMappings } from './wbplanviewtreehelper';

export const defaultLineOptions: ColumnOptions = {
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
      type: 'existingHeader',
      name: headerName,
      options: defaultLineOptions,
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
    const { name: headerName } = line;
    const automapperMappingPaths = automapperResults[headerName];
    return typeof automapperMappingPaths === 'undefined'
      ? line
      : {
          mappingPath: automapperMappingPaths[0],
          type: 'existingHeader',
          name: headerName,
          options: defaultLineOptions,
        };
  });
}

export function getLinesFromUploadPlan(
  headers: Readonly<ListOfHeaders> = [],
  uploadPlan: Readonly<UploadPlan>
): {
  readonly baseTableName: string;
  readonly lines: MappingLine[];
  readonly mustMatchPreferences: R<boolean>;
} {
  const lines = getLinesFromHeaders({
    headers,
    runAutomapper: false,
  });
  const {
    baseTableName,
    mappingsTree,
    mustMatchPreferences,
  } = uploadPlanToMappingsTree(headers, uploadPlan);

  const arrayOfMappings = mappingsTreeToArrayOfMappings(mappingsTree);
  arrayOfMappings.forEach((fullMappingPath) => {
    const [
      mappingPath,
      mappingType,
      headerName,
      options,
    ] = fullMappingPathParser(fullMappingPath);
    const headerIndex = headers.indexOf(headerName);
    if (headerIndex !== -1)
      lines[headerIndex] = {
        mappingPath,
        type: mappingType,
        name: headerName,
        options,
      };
  });

  return {
    baseTableName,
    lines,
    mustMatchPreferences,
  };
}
