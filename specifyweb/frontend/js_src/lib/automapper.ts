/**
 * Auto mapper than takes data model and header names and returns possible
 * mappings
 *
 * @module
 */

import type { Action } from 'typesafe-reducer';
import { generateDispatch } from 'typesafe-reducer';

import type { Options, TableSynonym } from './automapperdefinitions';
import { autoMapperDefinitions } from './automapperdefinitions';
import type {
  AutoMapperScope,
  MappingPath,
} from './components/wbplanviewmapper';
import type { PathIsMappedBind } from './components/wbplanviewmappercomponents';
import type { Tables } from './datamodel';
import type { AnyTree } from './datamodelutils';
import { getModel } from './schema';
import type { Relationship } from './specifyfield';
import { getTreeDefinitionItems, isTreeModel } from './treedefinitions';
import type { IR, R, RA, Writable } from './types';
import { defined, filterArray } from './types';
import { findArrayDivergencePoint } from './wbplanviewhelper';
import {
  formatToManyIndex,
  formatTreeRank,
  getNameFromTreeRankName,
  getNumberFromToManyIndex,
  mappingPathToString,
  relationshipIsToMany,
  valueIsToManyIndex,
  valueIsTreeRank,
} from './wbplanviewmappinghelper';
import { isCircularRelationship } from './wbplanviewmodelhelper';

type AutoMapperNode = 'shortcutsAndTableSynonyms' | 'synonymsAndMatches';

type AutoMapperConstructorBaseParameters = {
  // Array of strings that represent headers
  readonly headers: RA<string>;
  // Base table name
  readonly baseTable: keyof Tables;
  /*
   * Starting table name (if starting mappingPath provided, starting table
   * would be different from base table)
   */
  readonly startingTable?: keyof Tables;
  // Starting mapping path
  readonly path?: MappingPath;
  /*
   * Offset on a starting path. Used when the last element of mapping path is
   * a -to-many index. E.x, if #1 is taken, it would try to change the index
   * to #2
   */
  readonly pathOffset?: number;
  /*
   * Whether to allow multiple mappings
   * Scope to use for definitions. More info in autoMapperdefinitions.ts
   */
  readonly scope?: AutoMapperScope;
};

type AutoMapperConstructorCheckExistingParameters =
  AutoMapperConstructorBaseParameters & {
    /*
     * Whether to check if the field is already mapped (outside AutoMapper,
     * in the mapping tree)
     */
    readonly pathIsMapped: PathIsMappedBind;
  };

type AutoMapperConstructorDontCheckExistingParameters =
  AutoMapperConstructorBaseParameters & {
    /*
     * Whether to check if the field is already mapped (outside AutoMapper,
     * in the mapping tree)
     */
    readonly pathIsMapped?: PathIsMappedBind;
  };

export type AutoMapperConstructorParameters =
  | AutoMapperConstructorCheckExistingParameters
  | AutoMapperConstructorDontCheckExistingParameters;

export type AutoMapperResults = R<MappingPath[]>;

type FindMappingsParameters = {
  readonly tableName: keyof Tables;
  readonly mappingPath: MappingPath;
  /*
   * Parent table name. Empty if current table is a base table. Used to
   * prevent circular relationships
   */
  readonly parentTableName?: keyof Tables;
  readonly parentRelationship?: undefined | Relationship;
};

type AutoMapperResultsActions = Action<
  'add',
  { headerName: string; mappingPath: MappingPath }
>;

type AutoMapperHeadersToMapActions = Action<'mapped', { headerName: string }>;

type AutoMapperSearchedTablesActions =
  | Action<'reset'>
  | Action<'add', { tableName: keyof Tables }>;

type AutoMapperFindMappingsQueueActions =
  | Action<'enqueue', { value: FindMappingsParameters; level: number }>
  | Action<'reset', { initialValue?: FindMappingsParameters }>
  | Action<'initializeLevel', { level: number }>;

// Find cases like `Phylum` and remap them to `Phylum > Name`
const matchBaseRankName = (
  label: string,
  stripedRankName: string,
  strippedHeaderName: string
): boolean => label === 'name' && stripedRankName === strippedHeaderName;

const matchRankAndFieldName = (
  // Find cases like `Kingdom Author`
  strippedHeaderName: string,
  stripedRankName: string,
  label: string,
  finalHeaderName: string,
  fieldName: string
): boolean =>
  strippedHeaderName === `${stripedRankName} ${label}` ||
  finalHeaderName === `${stripedRankName}${fieldName}`;

const isFieldInDontMatch = (
  tableName: keyof Tables,
  lastPathPart: string,
  scope: AutoMapperScope
): boolean =>
  autoMapperDefinitions.dontMatch[tableName as 'Accession']?.[
    lastPathPart as 'text1'
  ]?.includes(scope) ?? false;

const isMappingPathIsInProposedMappings = (
  allowMultipleMappings: boolean,
  results: AutoMapperResults,
  localPath: MappingPath,
  headerName: string
): boolean =>
  results[headerName]?.some(
    (mappingPath) =>
      mappingPathToString(mappingPath) === mappingPathToString(localPath)
  ) ||
  (!allowMultipleMappings &&
    Object.values(results).some((mappingPaths) =>
      mappingPaths.some(
        (mappingPath) =>
          mappingPathToString(localPath) === mappingPathToString(mappingPath)
      )
    ));

const isMappingPathInMappingsTree = (
  checkForExistingMappings: boolean,
  localPath: MappingPath,
  pathIsMapped?: PathIsMappedBind
) =>
  checkForExistingMappings &&
  typeof pathIsMapped === 'function' &&
  pathIsMapped(localPath);

const findRankSynonyms = (
  tableName: AnyTree['tableName'],
  targetRankName: string
): RA<string> =>
  autoMapperDefinitions.rankSynonyms[tableName]
    ?.filter(({ rankName }) => targetRankName === rankName)
    .flatMap(({ synonyms }) => synonyms) ?? [];

function handleOrdinalNumbers(header: string): string {
  const ordinalNumberMatch = AutoMapper.regexParseOrdinalNumbers.exec(header);
  return ordinalNumberMatch === null
    ? header
    : `${ordinalNumberMatch[2]} ${ordinalNumberMatch[1]}`;
}

export class AutoMapper {
  // Used to replace any white space characters with space
  private static readonly regexReplaceWhiteSpace: RegExp = /\s+/g;

  private static readonly regexRemoveDuplicateHeaderIndexes: RegExp =
    /\(\d+\)/g;

  // Used to remove non letter characters
  private static readonly regexRemoveNonAz: RegExp = /[^\sa-z]+/g;

  private static readonly regexRemoveParentheses: RegExp =
    /\([^)]*\)|\[[^\]]*\]|\{[^}]*\}|<[^>]*>/g;

  public static readonly regexParseOrdinalNumbers: RegExp =
    /^(\d+)(?:st|nd|rd|th) ([\sa-z]+)$/g;

  // How deep to go into the schema
  private static readonly depth: number = 6;

  // The definitions for the comparison functions
  private static readonly comparisons: {
    [key in keyof Options]:
      | ((header: string, match: string) => boolean)
      | ((header: string, match: RegExp) => boolean);
  } = {
    regex: (header: string, regex: RegExp) => regex.exec(header) !== null,
    string: (header: string, string: string) => header === string,
    contains: (header: string, string: string) => header.includes(string),
  };

  private readonly results: AutoMapperResults = {};

  private readonly scope: AutoMapperScope = 'autoMapper';

  private readonly allowMultipleMappings: boolean = false;

  private readonly checkForExistingMappings: boolean = false;

  private readonly pathOffset: number = 0;

  private readonly baseTable: keyof Tables;

  // For AutoMapper suggestions, starting table can be different from base table
  private readonly startingTable: keyof Tables;

  private readonly startingPath: MappingPath = [];

  private readonly pathIsMapped?: PathIsMappedBind;

  private readonly headersToMap: IR<{
    isMapped: boolean;
    // OriginalHeaderName.toLowerCase() and trimmed
    readonly lowercaseHeaderName: string;
    /*
     * LowercaseHeaderName but without numbers and special characters
     * (a-z only)
     */
    readonly strippedHeaderName: string;
    // StrippedHeaderName but without any white space
    readonly finalHeaderName: string;
  }> = {};

  private searchedTables: string[] = [];

  /*
   * Used to enforce higher priority for closer mappings
   * (breadth-first-search)
   */
  private findMappingsQueue: FindMappingsParameters[][] = [];

  private readonly dispatch: {
    results: (action: AutoMapperResultsActions) => void;
    headersToMap: (action: AutoMapperHeadersToMapActions) => void;
    searchedTables: (action: AutoMapperSearchedTablesActions) => void;
    findMappingsQueue: (action: AutoMapperFindMappingsQueueActions) => void;
  } = {
    results: generateDispatch<AutoMapperResultsActions>({
      add: ({ headerName, mappingPath }) => {
        this.results[headerName] ??= [];

        if (mappingPath.length === 0)
          throw new Error('Invalid mapping path suggested by autoMapper');

        this.results[headerName].push(mappingPath);
      },
    }),
    headersToMap: generateDispatch<AutoMapperHeadersToMapActions>({
      mapped: ({ headerName }) => {
        if (!this.allowMultipleMappings)
          this.headersToMap[headerName].isMapped = true;
      },
    }),
    searchedTables: generateDispatch<AutoMapperSearchedTablesActions>({
      add: ({ tableName }) => {
        this.searchedTables.push(tableName);
      },
      reset: () => {
        this.searchedTables = [];
      },
    }),
    findMappingsQueue: generateDispatch<AutoMapperFindMappingsQueueActions>({
      reset: ({ initialValue }) => {
        this.findMappingsQueue =
          typeof initialValue === 'object' ? [[initialValue]] : [];
      },
      initializeLevel: ({ level }) => {
        this.findMappingsQueue[level] ??= [];
      },
      enqueue: ({ level, value }) => {
        this.findMappingsQueue[level].push(value);
      },
    }),
  };

  public constructor({
    headers: rawHeaders,
    baseTable,
    startingTable = baseTable,
    path = [],
    pathOffset = 0,
    scope = 'autoMapper',
    pathIsMapped,
  }: AutoMapperConstructorParameters) {
    // Strip extra characters to increase mapping success
    this.headersToMap = Object.fromEntries(
      rawHeaders
        .map((originalName) => {
          const lowercaseName = handleOrdinalNumbers(
            originalName
              .toLowerCase()
              .replace(AutoMapper.regexReplaceWhiteSpace, ' ')
              .replace(AutoMapper.regexRemoveDuplicateHeaderIndexes, '')
              .trim()
          );
          const strippedName = lowercaseName
            .replace(AutoMapper.regexRemoveNonAz, ' ')
            .replace(AutoMapper.regexReplaceWhiteSpace, ' ')
            .trim();

          const finalName = lowercaseName
            .replace(AutoMapper.regexRemoveParentheses, ' ')
            .replace(AutoMapper.regexRemoveNonAz, ' ')
            .replace(AutoMapper.regexReplaceWhiteSpace, ' ')
            .trim()
            .split(' ')
            .join('');

          return {
            originalName,
            headerData: {
              isMapped: false,
              lowercaseHeaderName: lowercaseName,
              strippedHeaderName: strippedName,
              finalHeaderName: finalName,
            },
          };
        })
        /*
         * Remove headers that match the `dontMap` structure in
         * autoMapperDefinitions
         */
        .filter(({ headerData: { lowercaseHeaderName } }) =>
          Object.entries(AutoMapper.comparisons)
            .filter(
              (
                // Loop over defined comparisons only
                [comparisonKey]
              ) =>
                comparisonKey in
                (autoMapperDefinitions.dontMap[scope]?.headers ?? {})
            )
            .every(([comparisonKey, comparisonFunction]) =>
              // Loop over each value of a comparison
              Object.values(
                autoMapperDefinitions.dontMap[scope]?.headers[
                  comparisonKey as keyof Options
                ] ?? {}
              ).every(
                (comparisonValue) =>
                  !comparisonFunction?.(lowercaseHeaderName, comparisonValue)
              )
            )
        )
        .map(({ originalName, headerData }) => [originalName, headerData])
    );

    this.results = {};
    this.scope = scope;

    // Whether to allow finding multiple mappings for the same header
    this.allowMultipleMappings = scope === 'suggestion';

    // Whether to use getMappedFields to check for existing mappings
    this.checkForExistingMappings = scope === 'suggestion';
    this.pathOffset = path.length - pathOffset;
    this.baseTable = baseTable;
    this.startingTable = startingTable;
    this.startingPath = path;
    this.pathIsMapped = pathIsMapped;
  }

  /*
   * Method that would be used by external classes to match headers to
   * possible mappings
   */
  public map(): AutoMapperResults {
    if (Object.keys(this.headersToMap).length === 0) return {};

    // Do 2 passes over the schema
    this.findMappingsDriver('shortcutsAndTableSynonyms');
    this.findMappingsDriver('synonymsAndMatches');

    return this.results;
  }

  /*
   * Makes sure that `findMappings` runs over the schema in correct order
   * since mappings with a shorter mapping path are given higher priority
   * (breadth-first search)
   */
  private findMappingsDriver(mode: AutoMapperNode): void {
    const pathMatchesStartingPath = (path: MappingPath, level: number) =>
      !this.startingPath[level - 1] ??
      findArrayDivergencePoint(path, this.startingPath.slice(0, level)) !== -1;

    this.dispatch.searchedTables({ type: 'reset' });
    this.dispatch.findMappingsQueue({
      type: 'reset',
      initialValue:
        mode === 'synonymsAndMatches'
          ? {
              tableName: this.startingTable,
              mappingPath: this.startingPath,
            }
          : {
              tableName: this.baseTable,
              mappingPath: [],
            },
    });

    let queueData;
    do {
      queueData = Object.entries(this.findMappingsQueue);
      this.dispatch.findMappingsQueue({
        type: 'reset',
      });

      // Go through each level of the queue in order (breadth-first search)
      queueData.forEach(([level, mappingsData]) =>
        mappingsData
          .filter(
            (payload) =>
              mode !== 'shortcutsAndTableSynonyms' ||
              level === '0' ||
              pathMatchesStartingPath(
                payload.mappingPath,
                Number.parseInt(level)
              )
          )
          .forEach((payload) => this.findMappings(payload, mode))
      );
    } while (queueData.length > 0);
  }

  // Compares definitions to unmapped headers and makes a mapping if matched
  private readonly handleDefinitionComparison = (
    // Initial mapping path
    path: MappingPath,
    comparisons: Options,
    /*
     * Function that returns the next path part to use in a new mapping
     * (on success)
     */
    getNewPathPart: () => MappingPath,
    tableName: keyof Tables
  ) =>
    this.getUnmappedHeaders().forEach(([headerKey, { lowercaseHeaderName }]) =>
      Object.entries(AutoMapper.comparisons)
        .filter(
          (
            // Loop over defined comparisons
            [comparisonKey]
          ) => comparisonKey in comparisons
        )
        .some(([comparisonKey, comparisonFunction]) =>
          // Loop over each value of a comparison
          Object.values(comparisons[comparisonKey as keyof Options]!).some(
            (comparisonValue) =>
              comparisonFunction?.(lowercaseHeaderName, comparisonValue) &&
              this.makeMapping(path, getNewPathPart(), headerKey, tableName)
          )
        )
    );

  private readonly getUnmappedHeaders = () =>
    // Loop over unmapped headers
    Object.entries(this.headersToMap).filter(([, { isMapped }]) => !isMapped);

  /*
   * Goes over `shortcuts` and `synonyms` in autoMapperDefinitions.tsx and
   * tries to find matches. Calls handleDefinitionComparison to make
   * comparison
   *
   */
  private findMappingsInDefinitions<TABLE_NAME extends keyof Tables>({
    mappingPath,
    tableName,
    fieldName,
    mode,
    isTreeRank = false,
  }: {
    readonly mappingPath: MappingPath;
    readonly tableName: TABLE_NAME;
    readonly fieldName: string | undefined;
    readonly mode: AutoMapperNode;
    // Whether to format fieldName as a tree rank name
    readonly isTreeRank?: boolean;
  }): void {
    if (mode === 'shortcutsAndTableSynonyms') {
      if (typeof fieldName !== 'undefined') return;

      const tableDefinitionData = autoMapperDefinitions.shortcuts[tableName];

      tableDefinitionData?.[this.scope]?.forEach((shortcutData) => {
        const comparisons = shortcutData.headers;
        const getNewPathPart = (): MappingPath => shortcutData.mappingPath;
        this.handleDefinitionComparison(
          mappingPath,
          comparisons,
          getNewPathPart,
          tableName
        );
      });
    } else if (mode === 'synonymsAndMatches' && typeof fieldName === 'string') {
      const tableDefinitionData =
        autoMapperDefinitions.synonyms[tableName as 'Accession'];

      const comparisons =
        tableDefinitionData?.[fieldName as 'text1']?.[this.scope]?.headers;
      if (comparisons)
        this.handleDefinitionComparison(
          mappingPath,
          comparisons,
          () =>
            isTreeRank ? [formatTreeRank(fieldName), 'name'] : [fieldName],
          tableName
        );
    }
  }

  /*
   * Searches for `tableSynonym` that matches the current table and the
   * current mapping path
   */
  private findTableSynonyms(
    tableName: keyof Tables,
    mappingPath: MappingPath,
    mode: AutoMapperNode
  ): RA<string> {
    const tableSynonyms = autoMapperDefinitions.tableSynonyms[tableName];

    if (
      mode !== 'shortcutsAndTableSynonyms' ||
      typeof tableSynonyms === 'undefined'
    )
      return [];

    // Filter out -to-many references from the path for matching
    const filteredPath = filterArray(
      mappingPath.map((pathPart) =>
        valueIsToManyIndex(pathPart) ? undefined : pathPart
      )
    );

    const filteredPathString = mappingPathToString(filteredPath);
    const filteredPathWithBaseTableString = mappingPathToString([
      this.baseTable,
      ...filteredPath,
    ]);

    return filterArray(
      tableSynonyms.flatMap((tableSynonym: TableSynonym) => {
        const mappingPathString = mappingPathToString(
          tableSynonym.mappingPathFilter
        );
        return filteredPathString.endsWith(mappingPathString) ||
          filteredPathWithBaseTableString === mappingPathString
          ? tableSynonym.synonyms
          : undefined;
      })
    );
  }

  private readonly findFormattedHeaderFieldSynonyms = <
    TABLE_NAME extends keyof Tables
  >(
    tableName: TABLE_NAME,
    fieldName: string
  ): RA<string> =>
    autoMapperDefinitions.synonyms[tableName as 'Accession']?.[
      fieldName as 'text1'
    ]?.[this.scope]?.headers.formattedHeaderFieldSynonym ?? [];

  private readonly tableWasIterated = (
    mode: AutoMapperNode,
    newDepthLevel: number,
    targetTableName: keyof Tables
  ) =>
    mode === 'synonymsAndMatches' &&
    (this.searchedTables.includes(targetTableName) ||
      this.findMappingsQueue[newDepthLevel]
        .map(({ tableName }) => tableName)
        .includes(targetTableName));

  /*
   * Used internally to loop though each field of a particular table and try
   * to match them to unmapped headers. This method iterates over the same
   * table only once if in `synonymsAndMatches` mode.
   */
  private findMappings(
    { tableName, mappingPath = [], parentRelationship }: FindMappingsParameters,
    mode: AutoMapperNode
  ): void {
    if (mode === 'synonymsAndMatches') {
      if (
        // Don't iterate over the same table again
        this.searchedTables.includes(tableName) ||
        // Don't go beyond the depth limit
        mappingPath.length > AutoMapper.depth
      )
        return;

      this.dispatch.searchedTables({
        type: 'add',
        tableName,
      });
    }

    const treeTableName = tableName as AnyTree['tableName'];
    const ranksData = getTreeDefinitionItems(treeTableName, false);

    const model = defined(getModel(tableName));
    const fields = model.fields.filter(
      ({ overrides }) => !overrides.isHidden && !overrides.isReadOnly
    );
    const label = model.label.toLowerCase();

    if (Array.isArray(ranksData)) {
      let ranks = ranksData.map(({ name }) => name).slice(1);
      const pushRankToPath =
        mappingPath.length <= 0 ||
        !valueIsTreeRank(mappingPath[mappingPath.length - 1]);

      if (!pushRankToPath)
        ranks = [getNameFromTreeRankName(mappingPath[mappingPath.length - 1])];

      this.findMappingsInDefinitions({
        mappingPath,
        tableName: treeTableName,
        fieldName: undefined,
        mode,
        isTreeRank: true,
      });

      ranks.forEach((rankName) => {
        const stripedRankName = rankName.toLowerCase();
        const finalRankName = formatTreeRank(rankName);
        const rankSynonyms = [
          stripedRankName,
          ...findRankSynonyms(treeTableName, rankName).map((rankSynonym) =>
            rankSynonym.toLowerCase()
          ),
        ];

        rankSynonyms.forEach((stripedRankName) => {
          if (mode !== 'synonymsAndMatches') return;

          fields
            .map((field) => [field.label.toLowerCase(), field.name])
            .forEach(([label, fieldName]) =>
              this.getUnmappedHeaders().some(
                ([headerName, { strippedHeaderName, finalHeaderName }]) =>
                  (matchBaseRankName(
                    label,
                    stripedRankName,
                    strippedHeaderName
                  ) ||
                    matchBaseRankName(
                      label,
                      stripedRankName,
                      finalHeaderName
                    ) ||
                    matchRankAndFieldName(
                      strippedHeaderName,
                      stripedRankName,
                      label,
                      finalHeaderName,
                      fieldName
                    )) &&
                  /*
                   * Don't search for further mappings for this field if we can
                   * only map a single header to this field
                   */
                  this.makeMapping(
                    mappingPath,
                    pushRankToPath ? [finalRankName, fieldName] : [fieldName],
                    headerName,
                    tableName
                  )
              )
            );
        });
      });

      return;
    }

    const tableSynonyms = this.findTableSynonyms(tableName, mappingPath, mode);
    const tableNames = Array.from(
      new Set(
        tableSynonyms.length === 0
          ? [tableName.toLowerCase(), label]
          : tableSynonyms
      )
    );

    const findMappingsInDefinitionsPayload = {
      mappingPath,
      tableName,
      fieldName: undefined,
      mode,
    };

    this.findMappingsInDefinitions(findMappingsInDefinitionsPayload);

    fields.forEach((field) => {
      this.findMappingsInDefinitions({
        ...findMappingsInDefinitionsPayload,
        fieldName: field.name,
      });

      if (mode !== 'synonymsAndMatches') {
        if (tableSynonyms.length === 0) return;
        else {
          this.findMappingsInDefinitions({
            ...findMappingsInDefinitionsPayload,
            /*
             * Run though synonyms and matches if table has `tableSynonyms`
             * even if not in `synonymsAndMatches` mode
             */
            mode: 'synonymsAndMatches',
            fieldName: field.name,
          });
        }
      }

      const label = field.label.toLowerCase();
      const headerFieldSynonyms = this.findFormattedHeaderFieldSynonyms(
        tableName,
        field.name
      );
      const fieldNames = Array.from(
        new Set([...headerFieldSynonyms, label, field.name.toLowerCase()])
      );
      const conservativeFieldNames =
        mode === 'synonymsAndMatches' ? fieldNames : headerFieldSynonyms;

      let toManyIndex;
      this.getUnmappedHeaders().some(
        ([
          headerName,
          { lowercaseHeaderName, strippedHeaderName, finalHeaderName },
        ]) =>
          !(toManyIndex = undefined) &&
          /*
           * Compare each field's name and label to headers
           */
          (conservativeFieldNames.some((fieldName) =>
            [lowercaseHeaderName, strippedHeaderName, finalHeaderName].includes(
              fieldName
            )
          ) ||
            // Loop through table names and table synonyms
            tableNames.some((tableSynonym) =>
              // Loop through field names and field synonyms
              fieldNames.some(
                (fieldSynonym) =>
                  strippedHeaderName === `${fieldSynonym} ${tableSynonym}` ||
                  finalHeaderName === `${tableSynonym}${fieldSynonym}` ||
                  (strippedHeaderName.startsWith(tableSynonym) &&
                    (strippedHeaderName === `${tableSynonym} ${fieldSynonym}` ||
                      [
                        // Try extracting -to-many index
                        new RegExp(`${tableSynonym} (\\d+) ${fieldSynonym}`),
                        new RegExp(`${tableSynonym} ${fieldSynonym} (\\d+)`),
                      ].some((regularExpression) => {
                        const match =
                          regularExpression.exec(lowercaseHeaderName);

                        if (match === null || typeof match[1] === 'undefined')
                          return false;

                        toManyIndex = Number(match[1]);
                        return true;
                      })))
              )
            )) &&
          this.makeMapping(
            mappingPath,
            [field.name],
            headerName,
            tableName,
            toManyIndex
          )
      );
    });

    model.relationships
      .filter(({ overrides }) => !overrides.isHidden && !overrides.isReadOnly)
      .forEach((relationship) => {
        const localPath = [...mappingPath, relationship.name];

        if (relationshipIsToMany(relationship))
          localPath.push(formatToManyIndex(1));

        const newDepthLevel = localPath.length;

        if (newDepthLevel > AutoMapper.depth) return;

        this.dispatch.findMappingsQueue({
          type: 'initializeLevel',
          level: newDepthLevel,
        });

        if (
          // Don't iterate over the same tables again
          this.tableWasIterated(
            mode,
            newDepthLevel,
            relationship.relatedModel.name
          ) ||
          (typeof parentRelationship === 'object' &&
            ((mode !== 'synonymsAndMatches' &&
              isCircularRelationship(parentRelationship, relationship)) ||
              // Skip -to-many inside -to-many
              (relationshipIsToMany(relationship) &&
                relationshipIsToMany(parentRelationship))))
        )
          return;

        this.dispatch.findMappingsQueue({
          type: 'enqueue',
          level: newDepthLevel,
          value: {
            tableName: relationship.relatedModel.name,
            mappingPath: localPath,
            parentRelationship: relationship,
          },
        });
      });
  }

  /*
   * Used to check if the table's field is already mapped and if not,
   * makes a new mapping. Also, handles -to-many relationships by creating new
   * objects
   *
   * Returns:
   * Boolean: whether we can map another mapping to this header.
   * Most of the time false return means that the mapping was not made
   * (Mapping fails if field is inside a -to-one relationship or direct child
   * of base table and is already mapped).
   * Can also depend on this.allowMultipleMappings
   *
   */
  private makeMapping(
    /*
     * Mapping path from base table to this table. Should be an empty
     * array if this is base table
     */
    mappingPath: MappingPath,
    // Elements that should be pushed into `path`
    newPathParts: MappingPath,
    // The name of the header that should be mapped
    headerName: string,
    // Current table name (used to identify `don't map` conditions)
    tableName: keyof Tables,
    /*
     * Implants given toManyIndex into the mapping path
     * into the last -to-many box
     */
    toManyIndex: number | undefined = undefined
  ): boolean {
    /*
     * Since autoMapper and autoMapperDefinitions converts all tree ranks to
     *  lowercase, we need to convert them back to their proper case
     */
    let fixedNewPathParts = newPathParts;
    const formatTreeRankUndefined = (
      rankName: string | undefined
    ): string | undefined =>
      typeof rankName === 'string' ? formatTreeRank(rankName) : undefined;
    if (isTreeModel(tableName)) {
      fixedNewPathParts = newPathParts.map((mappingPathPart) =>
        valueIsTreeRank(mappingPathPart)
          ? formatTreeRankUndefined(
              defined(
                getTreeDefinitionItems(tableName as 'Geography', false).find(
                  ({ name }) =>
                    name.toLowerCase() ===
                    getNameFromTreeRankName(mappingPathPart).toLowerCase()
                )?.name
              )
            ) ?? mappingPathPart
          : mappingPathPart
      );
    }

    let localPath: Writable<MappingPath> = [
      ...mappingPath,
      ...fixedNewPathParts,
    ];
    const lastPathPart = localPath[localPath.length - 1];

    // Don't map if:
    if (
      // If this fields is designated as un-mappable in the current source
      isFieldInDontMatch(tableName, lastPathPart, this.scope) ||
      /*
       * Or if a starting path was given and proposed mapping is outside
       * the path
       */
      (this.startingPath.length > 0 &&
        findArrayDivergencePoint(
          localPath,
          this.startingPath.slice(0, localPath.length)
        ) === -1)
    )
      return false;

    // If exact -to-many index was found, insert it into the path
    let changesMade: string | boolean = false;
    if (typeof toManyIndex === 'number')
      localPath = localPath
        .reverse()
        .map((localPathPart) =>
          valueIsToManyIndex(localPathPart) && changesMade !== false
            ? (changesMade = formatToManyIndex(toManyIndex))
            : localPathPart
        )
        .reverse();

    /*
     * Check if this path is already mapped and if it is, increment
     * the -to-many index to make path unique
     */
    while (
      /*
       * Go over mapped headers to see if this path was already mapped.
       * Go over mappings proposed by AutoMapper:
       */
      isMappingPathIsInProposedMappings(
        this.allowMultipleMappings,
        this.results,
        localPath,
        headerName
      ) ||
      // Go over mappings that are already in the mappings tree:
      isMappingPathInMappingsTree(
        this.checkForExistingMappings,
        localPath,
        this.pathIsMapped
      )
    ) {
      // Increment the last -to-many index in the mapping path, if it exists
      if (
        !Object.entries(localPath)
          .reverse()
          .some(
            ([localPathIndex, localPathPart], index) =>
              localPath.length - index > this.pathOffset &&
              valueIsToManyIndex(localPathPart) &&
              (localPath[Number(localPathIndex)] = formatToManyIndex(
                getNumberFromToManyIndex(localPathPart) + 1
              ))
          )
      )
        return false;
    }

    // Remove header from the list of unmapped headers
    this.dispatch.headersToMap({
      type: 'mapped',
      headerName,
    });

    // Save result
    this.dispatch.results({
      type: 'add',
      headerName,
      mappingPath: localPath,
    });

    const pathContainsToManyReferences = mappingPath.some(valueIsToManyIndex);
    return !pathContainsToManyReferences && !this.allowMultipleMappings;
  }
}
