/*
*
* Auto mapper than takes data model and header names and returns possible
* mappings
*
* */

'use strict';

import AutoMapperDefinitions, {
  Options,
  TableSynonym,
}                       from './automapperdefinitions';
import dataModelStorage from './wbplanviewmodel';
import {
  formatReferenceItem,
  formatTreeRank,
  getIndexFromReferenceItemName,
  getNameFromTreeRankName,
  getTableNonRelationshipFields,
  getTableRelationships,
  isCircularRelationship,
  isTooManyInsideOfTooMany,
  mappingPathToString,
  relationshipIsToMany,
  valueIsReferenceItem,
  valueIsTreeRank,
}                       from './wbplanviewmodelhelper';
import * as cache                   from './wbplanviewcache';
import { findArrayDivergencePoint } from './wbplanviewhelper';
import { Action, generateDispatch } from './statemanagement';
import {
  AutomapperScope,
  ListOfHeaders,
  MappingPath,
  PathIsMappedBind,
  RelationshipType,
}                                      from './components/wbplanviewmapper';


type AutoMapperNode = 'shortcutsAndTableSynonyms' | 'synonymsAndMatches'

interface AutoMapperConstructorBaseParameters {
  // array of strings that represent headers
  readonly headers: ListOfHeaders,
  readonly baseTable: string,  // base table name
  // starting table name (if starting mappingPath provided, starting table
  // would be different from base table)
  readonly startingTable?: string,
  readonly path?: MappingPath,  // starting mapping path
  // offset on a starting path. Used when the last element of mapping path is
  // a reference index. E.x, if #1 is taken, it would try to change the index
  // to #2
  readonly pathOffset?: number,
  // whether to allow multiple mappings
  readonly allowMultipleMappings?: boolean,
  // scope to use for definitions. More info in automapperdefinitions.ts
  readonly scope?: AutomapperScope,
}

interface AutoMapperConstructorCheckExistingParameters
  extends AutoMapperConstructorBaseParameters {
  // whether to check if the field is already mapped (outside automapper,
  // in the mapping tree)
  readonly checkForExistingMappings: true,
  readonly pathIsMapped: PathIsMappedBind,
}

interface AutoMapperConstructorDontCheckExistingParameters
  extends AutoMapperConstructorBaseParameters {
  // whether to check if the field is already mapped (outside automapper,
  // in the mapping tree)
  readonly checkForExistingMappings: false,
  readonly pathIsMapped?: PathIsMappedBind,
}

type AutoMapperConstructorParameters =
  AutoMapperConstructorCheckExistingParameters
  | AutoMapperConstructorDontCheckExistingParameters

export type AutoMapperResults = Record<string, MappingPath[]>

interface FindMappingsParameters {
  readonly tableName: string,  // name of current table
  readonly path: MappingPath,  // current mapping path
  // parent table name. Empty if current table is a base table. Used to
  // prevent circular relationships
  readonly parentTableName?: string,
  // relationship type between parent table and current table. Empty if
  // current table is a base table. Used to prevent mapping -to-many that are
  // inside -to-many (only while upload plan doesn't support such relationships)
  readonly parentRelationshipType?: undefined | RelationshipType,
}

interface AutoMapperResultsAddAction extends Action<'add'> {
  headerName: string,
  mappingPath: MappingPath,
}

type AutoMapperResultsActions = AutoMapperResultsAddAction;

interface AutoMapperHeadersToMapMapped extends Action<'mapped'> {
  headerName: string
}

type AutoMapperHeadersToMapActions = AutoMapperHeadersToMapMapped;

type AutoMapperSearchedTablesReset = Action<'reset'>

interface AutoMapperSearchedTablesAdd extends Action<'add'> {
  tableName: string,
}

type AutoMapperSearchedTablesActions =
  AutoMapperSearchedTablesAdd
  | AutoMapperSearchedTablesReset;

interface AutomapperFindMappingsQueueEnqueue extends Action<'enqueue'> {
  value: FindMappingsParameters,
  level: number,
}

interface AutomapperFindMappingsQueueReset extends Action<'reset'> {
  initialValue?: FindMappingsParameters
}

interface AutomapperFindMappingsQueueInitializeLevel
  extends Action<'initializeLevel'> {
  level: number
}

type AutomapperFindMappingsQueueActions =
  AutomapperFindMappingsQueueReset
  | AutomapperFindMappingsQueueInitializeLevel
  | AutomapperFindMappingsQueueEnqueue;


// find cases like `Phylum` and remap them to `Phylum > Name`
const matchBaseRankName = (
  friendlyName: string,
  stripedRankName: string,
  strippedHeaderName: string,
) =>
  friendlyName === 'name' &&
  stripedRankName === strippedHeaderName;

const matchRankAndFieldName = (  // find cases like `Kingdom Author`
  strippedHeaderName: string,
  stripedRankName: string,
  friendlyName: string,
  finalHeaderName: string,
  fieldName: string,
) =>
  strippedHeaderName === `${stripedRankName} ${friendlyName}` ||
  finalHeaderName === `${stripedRankName} ${fieldName}`;

const isFieldInDontMatch = (
  tableName: string,
  lastPathPart: string,
  scope: AutomapperScope,
) =>
  tableName !== '' &&
  (
    AutoMapperDefinitions.dontMatch[tableName]?.[lastPathPart]?.indexOf(
      scope,
    ) ?? -1
  ) !== -1;

const mappingPathIsInProposedMappings = (
  allowMultipleMappings: boolean,
  results: AutoMapperResults,
  localPath: MappingPath,
) =>
  !allowMultipleMappings &&
  Object.values(results).some(mappingPaths =>
    mappingPaths.some(mappingPath =>
      mappingPathToString(localPath) ===
      mappingPathToString(mappingPath),
    ),
  );

const mappingPathIsTheMappingsTree = (
  checkForExistingMappings: boolean,
  localPath: MappingPath,
  pathIsMapped?: PathIsMappedBind,
) =>
  checkForExistingMappings &&
  typeof pathIsMapped === 'function' &&
  pathIsMapped(localPath);

const findRankSynonyms = (
  tableName: string,
  targetRankName: string,
): string[] =>
  AutoMapperDefinitions.rankSynonyms[tableName]?.filter(({rankName}) =>
    targetRankName === rankName,
  ).map(({synonyms}) =>
    synonyms,
  ).flat() ?? [];


export default class Automapper {

  // used to replace any white space characters with space
  private static readonly regexReplaceWhitespace: RegExp = /\s+/g;
  // used to remove non letter characters
  private static readonly regexRemoveNonAz: RegExp = /[^a-z\s]+/g;
  private static readonly regexRemoveEscapeChars: RegExp = /\n/g;
  private static readonly depth: number = 6;  // how deep to go into the schema
  // the definitions for the comparison functions
  private static readonly comparisons: {
    [key in keyof Options]: (
      (
        (
          header: string,
          match: string,
        ) => boolean
        )
      | (
      (
        header: string,
        match: RegExp,
      ) => boolean
      )
      )
  } = {
    regex: (header: string, regex: RegExp) => regex.exec(header) !== null,
    string: (header: string, string: string) => header === string,
    contains: (header: string, string: string) => header.indexOf(string) !== -1,
  };
  private readonly results: AutoMapperResults = {};
  private readonly scope: AutomapperScope = 'automapper';
  private readonly allowMultipleMappings: boolean = false;
  private readonly checkForExistingMappings: boolean = false;
  private readonly pathOffset: number = 0;
  private readonly baseTable: string = '';
  private readonly startingTable: string = '';
  private readonly startingPath: MappingPath = [];
  private readonly pathIsMapped?: PathIsMappedBind;
  private readonly headersToMap: {
    // a dictionary of headers that need to be mapped
    readonly [originalHeaderName: string]: {
      isMapped: boolean,
      // originalHeaderName.toLowerCase() and trimmed
      readonly lowercaseHeaderName: string,
      // lowercaseHeaderName but without numbers and special characters
      // (a-z only)
      readonly strippedHeaderName: string,
      // strippedHeaderName but without any white space
      readonly finalHeaderName: string
    }
  } = {};
  private searchedTables: string[] = [];
  // used to enforce higher priority for closer mappings
  private findMappingsQueue: FindMappingsParameters[][] = [];
  private dispatch: {
    results: (action: AutoMapperResultsActions) => void,
    headersToMap: (action: AutoMapperHeadersToMapActions) => void,
    searchedTables: (action: AutoMapperSearchedTablesActions) => void,
    findMappingsQueue: (action: AutomapperFindMappingsQueueActions) => void
  } = {
    results: generateDispatch<AutoMapperResultsActions>({
      'add': ({headerName, mappingPath}) => {
        this.results[headerName] ??= [];

        if (mappingPath.length === 0)
          throw new Error('Invalid mapping path suggested by automapper');

        this.results[headerName].push(mappingPath);
      },
    }),
    headersToMap: generateDispatch<AutoMapperHeadersToMapActions>({
      'mapped': ({headerName}) => {
        if (!this.allowMultipleMappings)
          this.headersToMap[headerName].isMapped = true;
      },
    }),
    searchedTables: generateDispatch<AutoMapperSearchedTablesActions>({
      'add': ({tableName}) => {
        this.searchedTables.push(tableName);
      },
      'reset': () => {
        this.searchedTables = [];
      },
    }),
    findMappingsQueue:
      generateDispatch<AutomapperFindMappingsQueueActions>({
        'reset': ({initialValue}) => {
          typeof initialValue === 'undefined' ?
            (
              this.findMappingsQueue = []
            ) :
            (
              this.findMappingsQueue = [[
                initialValue,
              ]]
            );
        },
        'initializeLevel': ({level}) => {
          this.findMappingsQueue[level] ??= [];
        },
        'enqueue': ({level, value}) => {
          this.findMappingsQueue[level].push(value);
        },
      }),
  };

  constructor({
    headers: rawHeaders,
    baseTable,
    startingTable = baseTable,
    path = [],
    pathOffset = 0,
    allowMultipleMappings = false,
    scope = 'automapper',
    checkForExistingMappings = false,
    pathIsMapped,
  }: AutoMapperConstructorParameters) {
    // strip extra characters to increase mapping success
    this.headersToMap = Object.fromEntries(rawHeaders.map(originalName => {

      const lowercaseName = originalName.toLowerCase().replace(
        Automapper.regexReplaceWhitespace, ' ',
      ).replace(
        Automapper.regexRemoveEscapeChars, '',
      ).trim();
      const strippedName = lowercaseName.replace(
        Automapper.regexRemoveNonAz, '',
      );
      const finalName = strippedName.split(' ').join('');

      return [originalName, {
        isMapped: false,
        lowercaseHeaderName: lowercaseName,
        strippedHeaderName: strippedName,
        finalHeaderName: finalName,
      }];

    }));

    this.results = {};
    this.scope = scope;
    this.allowMultipleMappings = allowMultipleMappings;
    this.checkForExistingMappings = checkForExistingMappings;
    this.pathOffset = path.length - pathOffset;
    this.baseTable = baseTable;
    this.startingTable = startingTable;
    this.startingPath = path;
    this.pathIsMapped = pathIsMapped;
  }


  /* Method that would be used by external classes to match headers to
  possible mappings */
  public map({
    useCache = true,
    commitToCache = true,
  }: {
    readonly useCache?: boolean,  // whether to use cached values
    // whether to commit result to cache for future references
    readonly commitToCache?: boolean,
  } = {}): AutoMapperResults {

    if (Object.keys(this.headersToMap).length === 0)
      return {};


    const cacheName = JSON.stringify([
      this.headersToMap,
      this.baseTable,
      this.startingTable,
      this.startingPath,
      this.pathOffset,
      this.scope,
    ]);

    if (useCache && commitToCache) {
      const cachedData =
        cache.get<AutoMapperResults>('automapper', cacheName);
      if (cachedData)
        return cachedData;
    }

    // do 2 passes over the schema
    this.findMappingsDriver('shortcutsAndTableSynonyms');
    this.findMappingsDriver('synonymsAndMatches');


    if (commitToCache)
      cache.set('automapper', cacheName, this.results);

    return this.results;

  }

  /*
  * Makes sure that `findMappings` runs over the schema in correct order
  * since mappings with a shorter mapping path are given higher priority
  * */
  private findMappingsDriver(
    mode: AutoMapperNode,
  ): void {

    const pathMatchesStartingPath = (path: MappingPath, level: string) =>
      !this.startingPath[~~level - 1] ??
      findArrayDivergencePoint(
        path,
        this.startingPath.slice(0, ~~level),
      ) !== -1;

    this.dispatch.searchedTables({type: 'reset'});
    this.dispatch.findMappingsQueue({
      type: 'reset',
      initialValue: mode === 'synonymsAndMatches' ?
        {
          tableName: this.startingTable,
          path: this.startingPath,
          parentTableName: '',
        } :
        {
          tableName: this.baseTable,
          path: [],
          parentTableName: '',
        },
    });

    let queueData;
    do {

      queueData = Object.entries(this.findMappingsQueue);
      this.dispatch.findMappingsQueue({
        type: 'reset',
      });

      // go through each level of the queue in order
      queueData.forEach(([level, mappingsData]) =>
        mappingsData.filter(payload =>
          mode !== 'shortcutsAndTableSynonyms' ||
          level === '0' ||
          pathMatchesStartingPath(payload.path, level),
        ).forEach(payload =>
          this.findMappings(payload, mode),
        ),
      );

    } while (queueData.length !== 0);

  }

  /* Compares definitions to unmapped headers and makes a mapping if matched */
  private handleDefinitionComparison = (
    path: MappingPath,  // initial mapping path
    comparisons: Options,
    // function that returns the next path part to use in a new mapping
    // (on success)
    getNewPathPart: () => MappingPath,
  ) =>
    this.getUnmappedHeaders().forEach((
      [
        headerKey,
        {lowercaseHeaderName},
      ],
    ) =>
      Object.entries(
        Automapper.comparisons,
      ).filter(([comparisonKey]) =>  // loop over defined comparisons
        comparisonKey in comparisons,
      ).some(([comparisonKey, comparisonFunction]) =>
        // loop over each value of a comparison
        Object.values(
          comparisons[comparisonKey as keyof Options] as RegExp[] | string[],
        ).some(comparisonValue =>
          comparisonFunction?.(lowercaseHeaderName, comparisonValue) &&
          this.makeMapping(
            path,
            getNewPathPart().map(pathPart =>
              valueIsTreeRank(pathPart) ?
                pathPart :
                pathPart.toLowerCase(),
            ),
            headerKey,
          ),
        ),
      ));

  private getUnmappedHeaders = () =>
    // loop over unmapped headers
    Object.entries(this.headersToMap).filter(([, {isMapped}]) =>
      !isMapped,
    );

  /*
  * Goes over `shortcuts` and `synonyms` in AutomapperDefinitions.tsx and
  * tries to find matches. Calls handleDefinitionComparison to make comparison
  * */
  private findMappingsInDefinitions({
    path,
    tableName,
    fieldName,
    mode,
    isTreeRank = false,
  }: {
    readonly path: MappingPath,  // current mapping path
    readonly tableName: string,  // the table to search in
    readonly fieldName: string,  // the field to search in
    readonly mode: AutoMapperNode,
    // whether to format fieldName as a tree rank name
    readonly isTreeRank?: boolean,
  }): void {

    if (mode === 'shortcutsAndTableSynonyms' && fieldName !== '')
      return;

    if (mode === 'shortcutsAndTableSynonyms') {

      const tableDefinitionData = AutoMapperDefinitions.shortcuts[tableName];

      tableDefinitionData?.[this.scope]?.forEach(shortcutData => {
        const comparisons = shortcutData.headers;
        const getNewPathPart = () =>
          shortcutData.mappingPath;
        this.handleDefinitionComparison(path, comparisons, getNewPathPart);
      });
    }
    else if (mode === 'synonymsAndMatches') {

      const tableDefinitionData = AutoMapperDefinitions.synonyms[tableName];

      const comparisons =
        tableDefinitionData?.[fieldName]?.[this.scope]?.headers;
      const getNewPathPart = () =>
        isTreeRank ?
          [formatTreeRank(fieldName), 'name'] :
          [fieldName];

      if (comparisons)
        this.handleDefinitionComparison(
          path,
          comparisons,
          getNewPathPart,
        );
    }

  }

  /* Searches for `tableSynonym` that matches the current table and the
  current mapping path */
  private findTableSynonyms(
    tableName: string,  // the table to search for
    path: string[],  // current mapping path
    mode: AutoMapperNode,
  ): string[] /* table synonyms */ {

    const tableSynonyms = AutoMapperDefinitions.tableSynonyms[tableName];

    if (
      mode !== 'shortcutsAndTableSynonyms' ||
      typeof tableSynonyms === 'undefined'
    )
      return [];

    // filter out -to-many references from the path for matching
    const filteredPath = path.reduce((
      filteredPath: MappingPath,
      pathPart: string,
    ) => {

      if (!valueIsReferenceItem(pathPart))
        filteredPath.push(pathPart);

      return filteredPath;

    }, []);

    const filteredPathString = mappingPathToString(filteredPath);
    const filteredPathWithBaseTableString = mappingPathToString([
      this.baseTable,
      ...filteredPath,
    ]);

    return tableSynonyms.reduce((
      tableSynonyms: string[],
      tableSynonym: TableSynonym,
    ) => {

      const mappingPathString = mappingPathToString(
        tableSynonym.mappingPathFilter,
      );

      if (
        filteredPathString.endsWith(mappingPathString) ||
        filteredPathWithBaseTableString === mappingPathString
      )
        tableSynonyms.push(...tableSynonym.synonyms);

      return tableSynonyms;

    }, []);

  }

  private readonly findFormattedHeaderFieldSynonyms = (
    tableName: string,  // the table to search in
    fieldName: string,  // the field to search in
  ): string[] /* field synonyms */ =>
    AutoMapperDefinitions.synonyms[
      tableName]?.[fieldName]?.[this.scope
      ]?.headers.formattedHeaderFieldSynonym || [];

  private readonly tableWasIterated = (
    mode: AutoMapperNode,
    newDepthLevel: number,
    targetTableName: string,
  ) =>
    mode === 'synonymsAndMatches' &&
    (
      this.searchedTables.indexOf(targetTableName) !== -1 ||
      this.findMappingsQueue[newDepthLevel].map(({tableName}) =>
        tableName,
      ).some(tableName =>
        tableName === targetTableName,
      )
    );

  /*
  * Used internally to loop though each field of a particular table and try
  * to match them to unmapped headers. This method iterates over the same
  * table only once if in `synonymsAndMatches` mode.
  * */
  private findMappings(
    {
      tableName,
      path = [],
      parentTableName = '',
      parentRelationshipType,
    }: FindMappingsParameters,
    mode: AutoMapperNode,
  ): void {


    if (mode === 'synonymsAndMatches') {
      if (
        // don't iterate over the same table again when in
        // `synonymsAndMatches` mode
        this.searchedTables.indexOf(tableName) !== -1 ||
        path.length > Automapper.depth  // don't go beyond the depth limit
      )
        return;

      this.dispatch.searchedTables({
        type: 'add',
        tableName: tableName,
      });
    }


    const tableData = dataModelStorage.tables[tableName];
    const ranksData = dataModelStorage.ranks[tableName];
    const fields = getTableNonRelationshipFields(tableName, false);
    const tableFriendlyName = tableData.tableFriendlyName.toLowerCase();

    if (typeof ranksData !== 'undefined') {

      let ranks = Object.keys(ranksData);
      const pushRankToPath =
        path.length <= 0 ||
        !valueIsTreeRank(path[path.length - 1]);

      if (!pushRankToPath)
        ranks = [getNameFromTreeRankName(path[path.length - 1])];

      const findMappingsInDefinitionsPayload = {
        path,
        tableName: tableName,
        fieldName: '',
        mode,
        isTreeRank: true,
      };

      this.findMappingsInDefinitions(findMappingsInDefinitionsPayload);

      ranks.some(rankName => {
        const stripedRankName = rankName.toLowerCase();
        const finalRankName = formatTreeRank(rankName);
        const rankSynonyms = [
          stripedRankName,
          ...findRankSynonyms(tableName, rankName).map(rankSynonym =>
            rankSynonym.toLowerCase(),
          ),
        ];

        rankSynonyms.map(stripedRankName => {
          findMappingsInDefinitionsPayload.fieldName = stripedRankName;

          this.findMappingsInDefinitions(
            findMappingsInDefinitionsPayload,
          );

          if (mode !== 'synonymsAndMatches')
            return;

          fields.map(([fieldName, fieldData]) => [
            fieldData.friendlyName.toLowerCase(),
            fieldName,
          ]).forEach(([friendlyName, fieldName]) =>
            this.getUnmappedHeaders().some(([headerName, {
                strippedHeaderName,
                finalHeaderName,
              }]) =>
              (
                matchBaseRankName(
                  friendlyName,
                  stripedRankName,
                  strippedHeaderName,
                ) ||
                matchRankAndFieldName(
                  strippedHeaderName,
                  stripedRankName,
                  friendlyName,
                  finalHeaderName,
                  fieldName,
                )
              ) &&
              // don't search for further mappings for this field if we can
              // only map a single header to this field
              this.makeMapping(
                path,
                pushRankToPath ?
                  [finalRankName, fieldName] :
                  [fieldName],
                headerName,
                tableName,
              ),
            ),
          );
        });
      });

      return;
    }

    const tableSynonyms = this.findTableSynonyms(tableName, path, mode);
    const tableNames = [...new Set(
      tableSynonyms.length === 0 ?
        [tableName, tableFriendlyName] :
        tableSynonyms,
    )];

    const findMappingsInDefinitionsPayload = {
      path,
      tableName: tableName,
      fieldName: '',
      mode,
    };

    this.findMappingsInDefinitions(findMappingsInDefinitionsPayload);

    fields.some(([fieldName, fieldData]) => {

      // search in definitions
      findMappingsInDefinitionsPayload.fieldName = fieldName;
      this.findMappingsInDefinitions(findMappingsInDefinitionsPayload);

      if (mode !== 'synonymsAndMatches') {
        if (tableSynonyms.length === 0)
          return;
        else {
          // run though synonyms and matches if table has `tableSynonyms`
          // even if not in `synonymsAndMatches` mode
          findMappingsInDefinitionsPayload.mode = 'synonymsAndMatches';
          this.findMappingsInDefinitions(
            findMappingsInDefinitionsPayload,
          );
          findMappingsInDefinitionsPayload.mode = mode;
        }
      }


      const friendlyName = fieldData.friendlyName.toLowerCase();
      const fieldNames = [...new Set([
        ...this.findFormattedHeaderFieldSynonyms(tableName, fieldName),
        friendlyName,
        fieldName,
      ])];

      let toManyReferenceNumber;
      this.getUnmappedHeaders().some(([headerName, {
          lowercaseHeaderName,
          strippedHeaderName,
          finalHeaderName,
        }]) =>

        !(
          toManyReferenceNumber = false
        ) &&
        (
          // compare each field's schema name and friendly schema name
          // to headers
          fieldNames.some(fieldName =>
            [
              lowercaseHeaderName,
              strippedHeaderName,
              finalHeaderName,
            ].indexOf(fieldName) !== -1,
          ) ||

          // loop through table names and table synonyms
          tableNames.some(tableSynonym =>

            // loop through field names and field synonyms
            fieldNames.some(fieldSynonym =>

              strippedHeaderName === `${fieldSynonym} ${tableSynonym}` ||

              strippedHeaderName.startsWith(tableSynonym) &&
              (
                strippedHeaderName === `${tableSynonym} ${fieldSynonym}` ||
                [  // try extracting -to-many reference number
                  new RegExp(`${tableSynonym} (\\d+) ${fieldSynonym}`),
                  new RegExp(`${tableSynonym} ${fieldSynonym} (\\d+)`),
                ].some(regularExpression => {

                  const match = regularExpression.exec(lowercaseHeaderName);

                  if (match === null || typeof match[1] === 'undefined')
                    return false;

                  toManyReferenceNumber = ~~match[1];
                  return true;

                })
              ),
            ),
          )
        ) &&
        this.makeMapping(
          path,
          [fieldName],
          headerName,
          tableName,
          toManyReferenceNumber,
        ),
      );

    });


    getTableRelationships(tableName, false).some((
      [
        relationshipKey,
        relationshipData,
      ],
    ) => {

      const localPath = [...path, relationshipKey];

      if (relationshipIsToMany(relationshipData.type))
        localPath.push(formatReferenceItem(1));

      const newDepthLevel = localPath.length;

      if (newDepthLevel > Automapper.depth)
        return;

      this.dispatch.findMappingsQueue({
        type: 'initializeLevel',
        level: newDepthLevel,
      });

      const {foreignName} = relationshipData;

      let currentMappingPathPart = path[path.length - 1];
      if (
        valueIsReferenceItem(currentMappingPathPart) ||
        valueIsTreeRank(currentMappingPathPart)
      )
        currentMappingPathPart = path[path.length - 2];

      if (
        // don't iterate over the same tables again
        this.tableWasIterated(
          mode,
          newDepthLevel,
          relationshipData.tableName,
        ) ||
        (
          mode !== 'synonymsAndMatches' &&
          isCircularRelationship({  // skip circular relationships
            targetTableName: relationshipData.tableName,
            parentTableName: parentTableName,
            foreignName: foreignName,
            relationshipKey: relationshipKey,
            currentMappingPathPart: currentMappingPathPart,
            tableName: tableName,
          })
        ) ||
        // skip -to-many inside -to-many
        // TODO: remove this once upload plan is ready
        isTooManyInsideOfTooMany(
          relationshipData.type,
          parentRelationshipType,
        )
      )
        return;

      this.dispatch.findMappingsQueue({
        type: 'enqueue',
        level: newDepthLevel,
        value: {
          tableName: relationshipData.tableName,
          path: localPath,
          parentTableName: tableName,
          parentRelationshipType: relationshipData.type,
        },
      });

    });

  }

  /*
  * Used to check if the table's field is already mapped and if not,
  * makes a new mapping. Also, handles -to-many relationships by creating new
  * objects
  * */
  private makeMapping(
    // Mapping path from base table to this table. Should be an empty
    // array if this is base table
    path: string[],
    newPathParts: MappingPath,  // Elements that should be pushed into `path`
    headerName: string,  // The name of the header that should be mapped
    // Current table name (used to identify `don't map` conditions)
    tableName = '',
    // if of type {int}:
    //   implants given toManyReferenceNumber into the mapping path
    //   into the first reference item starting from the right
    // if of type {boolean} and is False:
    //   don't do anything
    toManyReferenceNumber: number | false = false,
  ): boolean /* false if we can map another mapping to this header.
  Most of the time means that the mapping was not made
  (Mapping fails if field is inside a -to-one relationship or direct child
  of base table and is already mapped).
  Can also depend on this.allowMultipleMappings */ {

    let localPath: MappingPath = [...path, ...newPathParts];
    const lastPathPart = localPath[localPath.length - 1];

    if (
      // if this fields is designated as unmappable in the current source
      isFieldInDontMatch(tableName, lastPathPart, this.scope) ||
      (
        // if a starting path was given and proposed mapping is outside
        // the path
        this.startingPath.length !== 0 &&
        findArrayDivergencePoint(
          localPath,
          this.startingPath.slice(0, localPath.length),
        ) === -1
      )
    )
      return false;

    // if exact -to-many index was found, insert it into the path
    let changesMade: string | boolean = false;
    if (toManyReferenceNumber !== false)
      localPath = localPath.reverse().map(localPathPart =>
        valueIsReferenceItem(localPathPart) && changesMade !== false ?
          (
            changesMade = formatReferenceItem(toManyReferenceNumber)
          ) :
          localPathPart,
      ).reverse();

    // check if this path is already mapped and if it is, increment
    // the reference number to make path unique
    while (// go over mapped headers to see if this path was already mapped
      // go over mappings proposed by automapper
    mappingPathIsInProposedMappings(
      this.allowMultipleMappings,
      this.results,
      localPath,
    ) ||
    // go over mappings that are already in the mappings tree
    mappingPathIsTheMappingsTree(
      this.checkForExistingMappings,
      localPath,
      this.pathIsMapped,
    )
      ) {
      // increment the last reference number in the mapping path if it
      // has a reference number in it
      if (
        !Object.entries(
          localPath,
        ).reverse().some((
          [
            localPathIndex,
            localPathPart,
          ],
          index,
          ) =>
          localPath.length - index > this.pathOffset &&
          valueIsReferenceItem(localPathPart) &&
          (
            localPath[~~localPathIndex] = formatReferenceItem(
              getIndexFromReferenceItemName(localPathPart) + 1,
            )
          ),
        )
      )
        return false;
    }


    // remove header from the list of unmapped headers
    this.dispatch.headersToMap({
      type: 'mapped',
      headerName: headerName,
    });

    // save result
    this.dispatch.results({
      type: 'add',
      headerName: headerName,
      mappingPath: localPath,
    });


    const pathContainsToManyReferences =
      path.some(valueIsReferenceItem);
    return !pathContainsToManyReferences && !this.allowMultipleMappings;

  }
}
