import automapper, { AutoMapperResults } from './automapper';
import { R } from './components/wbplanview';
import { ListOfHeaders, MappingLine } from './components/wbplanviewmapper';
import {
  ColumnOptions,
  UploadPlan,
  uploadPlanToMappingsTree,
} from './uploadplantomappingstree';
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
  headers?: ListOfHeaders
} & (
  {
    runAutomapper: true,
    baseTableName: string,
  } |
  {
    runAutomapper: false,
    baseTableName?: string,
  }
  )): MappingLine[] {

  const lines = headers.map((headerName): MappingLine => (
    {
      mappingPath: ['0'],
      type: 'existingHeader',
      name: headerName,
      options: defaultLineOptions,
    }
  ));

  if (!runAutomapper || typeof baseTableName === 'undefined')
    return lines;

  const automapperResults: AutoMapperResults = (
    new automapper({
      headers,
      baseTable: baseTableName,
      scope: 'automapper',
      checkForExistingMappings: false,
    })
  ).map();

  return lines.map(line => {
    const {name: headerName} = line;
    const automapperMappingPaths = automapperResults[headerName];
    if (typeof automapperMappingPaths === 'undefined')
      return line;
    else
      return {
        mappingPath: automapperMappingPaths[0],
        type: 'existingHeader',
        name: headerName,
        options: defaultLineOptions,
      };
  });

}

export function getLinesFromUploadPlan(
  headers: ListOfHeaders = [],
  uploadPlan: UploadPlan,
): {
  readonly baseTableName: string,
  readonly lines: MappingLine[],
  readonly mustMatchPreferences: R<boolean>
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
  arrayOfMappings.forEach(fullMappingPath => {
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