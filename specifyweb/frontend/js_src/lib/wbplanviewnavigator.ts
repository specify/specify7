/*
 *
 * Helpful methods for navigating though schema across a certain mapping path.
 * Helps define information needed to display wbplanview components
 *
 *
 */

import * as cache from './cache';
import type {
  CustomSelectSubtype,
  CustomSelectType,
} from './components/customselectelement';
import type { IR, R, RA } from './types';
import type {
  HtmlGeneratorFieldData,
  MappingElementProps,
} from './components/wbplanviewcomponents';
import type {
  AutoMapperSuggestion,
  MappingPath,
  MappingPathWritable,
  RelationshipType,
  SelectElementPosition,
} from './components/wbplanviewmapper';
import type { GetMappedFieldsBind } from './components/wbplanviewmappercomponents';
import commonText from './localization/common';
import wbText from './localization/workbench';
import type { ColumnOptions } from './uploadplantomappingstree';
import { columnOptionsAreDefault } from './wbplanviewlinesgetter';
import {
  formatReferenceItem,
  formatTreeRank,
  getCanonicalMappingPath,
  getNameFromTreeRankName,
  mappingPathToString,
  relationshipIsToMany,
  valueIsReferenceItem,
  valueIsTreeRank,
} from './wbplanviewmappinghelper';
import dataModelStorage from './wbplanviewmodel';
import type {
  DataModelField,
  DataModelRelationship,
} from './wbplanviewmodelfetcher';
import {
  getMaxToManyValue,
  isCircularRelationship,
  isTooManyInsideOfTooMany,
  tableIsTree,
} from './wbplanviewmodelhelper';

type FindNextNavigationDirection<RETURN_STRUCTURE> = {
  readonly finished: boolean;
} & (
  | {
      readonly finished: true;
      readonly finalData: RETURN_STRUCTURE[];
    }
  | {
      readonly finished: false;
      readonly payload: {
        readonly nextTableName: string;
        readonly nextParentTableName: string;
        readonly nextRealPathElementName: string;
        readonly nextPathElementName: string;
      };
    }
);

interface NavigationCallbackPayload<RETURN_TYPE> {
  readonly tableName: string;
  data?: RETURN_TYPE;
  parentRelationshipType?: RelationshipType;
  parentTableName?: string;
}

type NavigatorCallbackFunction<RETURN_STRUCTURE, RETURN_TYPE> = (
  callbackPayload: Readonly<NavigationCallbackPayload<RETURN_STRUCTURE>>
) => RETURN_TYPE;

interface NavigationCallbacks<RETURN_STRUCTURE> {
  /*
   * Should return {boolean} specifying whether to run
   * dataModel.navigatorInstance() for a particular mapping path part
   */
  readonly iterate: NavigatorCallbackFunction<RETURN_STRUCTURE, boolean>;
  // Should return undefined if next element does not exist
  readonly getNextPathElement: NavigatorCallbackFunction<
    RETURN_STRUCTURE,
    | {
        // The name of the next path element
        readonly nextPathElementName: string;
        /*
         * If the next path element is not a field nor a relationship:
         *   {undefined}.
         * Else, {object} the information about a field from dataModel.tables
         */
        readonly nextPathElement: DataModelField;
        /*
         * If nextPathElementName is not a field nor a relationships, {string}
         * current path element name.
         * Else nextPathElementName
         */
        readonly nextRealPathElementName: string;
      }
    | undefined
  >;
  /*
   * Formats internalPayload and returns it. Would be used as a return
   * value for the navigator
   */
  readonly getFinalData: NavigatorCallbackFunction<
    RETURN_STRUCTURE,
    RETURN_STRUCTURE[]
  >;
  /*
   * Commits callbackPayload.data to internalPayload and returns
   * committed data
   */
  readonly getInstanceData: NavigatorCallbackFunction<
    RETURN_STRUCTURE,
    RETURN_STRUCTURE
  >;
  /*
   * Commits callbackPayload.data to internalPayload and returns
   * committed data
   */
  readonly commitInstanceData: NavigatorCallbackFunction<
    RETURN_STRUCTURE,
    RETURN_STRUCTURE
  >;
  /*
   * Called inside of navigatorInstance before it calls callbacks for
   * tree ranks / reference items / simple fields
   */
  readonly navigatorInstancePre: NavigatorCallbackFunction<
    RETURN_STRUCTURE,
    void
  >;
  // Handles toMany children
  readonly handleToManyChildren: NavigatorCallbackFunction<
    RETURN_STRUCTURE,
    void
  >;
  // Handles tree ranks children
  readonly handleTreeRanks: NavigatorCallbackFunction<RETURN_STRUCTURE, void>;
  // Handles fields and relationships
  readonly handleSimpleFields: NavigatorCallbackFunction<
    RETURN_STRUCTURE,
    void
  >;
}

function findNextNavigationDirection<RETURN_STRUCTURE>(
  callbacks: Readonly<NavigationCallbacks<RETURN_STRUCTURE>>,
  callbackPayload: Readonly<NavigationCallbackPayload<RETURN_STRUCTURE>>,
  tableName: string,
  parentTableName: string
): FindNextNavigationDirection<RETURN_STRUCTURE> {
  const nextPathElementsData = callbacks.getNextPathElement(callbackPayload);

  if (typeof nextPathElementsData === 'undefined')
    return {
      finished: true,
      finalData: callbacks.getFinalData(callbackPayload),
    };

  const { nextPathElementName, nextPathElement, nextRealPathElementName } =
    nextPathElementsData;

  let nextTableName = '';
  let nextParentTableName = '';

  if (
    valueIsReferenceItem(nextPathElementName) ||
    valueIsTreeRank(nextPathElementName)
  ) {
    nextTableName = tableName;
    nextParentTableName = parentTableName;
  } else if (
    typeof nextPathElement !== 'undefined' &&
    nextPathElement.isRelationship
  ) {
    nextTableName = nextPathElement.tableName;
    nextParentTableName = tableName;
  }

  return {
    finished: false,
    payload: {
      nextTableName,
      nextParentTableName,
      nextRealPathElementName,
      nextPathElementName,
    },
  };
}

/*
 * Navigates though the schema according to a specified mapping path and
 * calls certain callbacks while doing that
 */
export function navigator<RETURN_STRUCTURE>({
  callbacks,
  recursivePayload = undefined,
  config: { baseTableName },
}: {
  // Callbacks can be modified depending on the need to make navigator versatile
  readonly callbacks: NavigationCallbacks<RETURN_STRUCTURE>;
  /*
   * {object|undefined} used internally to make navigator call itself
   * multiple times
   */
  readonly recursivePayload?: {
    readonly tableName: string;
    readonly parentTableName: string;
    readonly parentTableRelationshipName: string;
    readonly parentPathElementName: string;
  };
  readonly config: {
    // The name of the base table to use
    readonly baseTableName?: string;
  };
}): RETURN_STRUCTURE[] {
  if (typeof dataModelStorage.tables === 'undefined')
    throw new Error('WbPlanView Data Model is not initialized');

  let tableName = '';
  let parentTableName = '';
  let parentTableRelationshipName = '';
  let parentPathElementName = '';

  if (typeof recursivePayload === 'undefined') {
    if (typeof baseTableName === 'undefined')
      throw new Error(
        'Base table needs to be specified for a navigator to be able' +
          ' to loop though schema'
      );
    tableName = baseTableName;
  } else
    ({
      tableName,
      parentTableName,
      parentTableRelationshipName,
      parentPathElementName,
    } = recursivePayload);

  /*
   * An object that is shared between navigator, navigatorInstance and
   * some callbacks
   */
  const callbackPayload = {
    tableName,
  };

  if (callbacks.iterate(callbackPayload))
    navigatorInstance<RETURN_STRUCTURE>({
      tableName,
      parentTableName,
      parentTableRelationshipName,
      parentPathElementName,
      callbacks,
      callbackPayload,
    });

  const nextNavigationDirection = findNextNavigationDirection<RETURN_STRUCTURE>(
    callbacks,
    callbackPayload,
    tableName,
    parentTableName
  );

  if (nextNavigationDirection.finished)
    return nextNavigationDirection.finalData;

  const {
    nextPathElementName,
    nextTableName,
    nextParentTableName,
    nextRealPathElementName,
  } = nextNavigationDirection.payload;

  let schemaNavigatorResults: RETURN_STRUCTURE[] = [];

  if (nextTableName !== '')
    schemaNavigatorResults = navigator({
      callbacks,
      recursivePayload: {
        tableName: nextTableName,
        parentTableName: nextParentTableName,
        parentTableRelationshipName: nextRealPathElementName,
        parentPathElementName: nextPathElementName,
      },
      config: {},
    });

  return schemaNavigatorResults.length === 0
    ? callbacks.getFinalData(callbackPayload)
    : schemaNavigatorResults;
}

function getNavigationChildrenTypes(
  parentTableName: string,
  parentTableRelationshipName: string,
  parentPathElementName: string,
  tableName: string
) {
  const parentRelationshipType: RelationshipType | undefined = (
    dataModelStorage.tables[parentTableName]?.fields[
      parentTableRelationshipName
    ] as DataModelRelationship
  )?.type;

  return {
    parentRelationshipType,
    childrenAreToManyElements:
      relationshipIsToMany(parentRelationshipType) &&
      !valueIsReferenceItem(parentPathElementName),
    childrenAreRanks:
      tableIsTree(tableName) && !valueIsTreeRank(parentPathElementName),
  };
}

function callNavigatorInstanceCallbacks<RETURN_STRUCTURE>(
  childrenAreToManyElements: boolean,
  childrenAreRanks: boolean,
  callbacks: NavigationCallbacks<RETURN_STRUCTURE>,
  callbackPayload: Readonly<NavigationCallbackPayload<RETURN_STRUCTURE>>
): void {
  if (childrenAreToManyElements)
    callbacks.handleToManyChildren(callbackPayload);
  else if (childrenAreRanks) callbacks.handleTreeRanks(callbackPayload);
  else callbacks.handleSimpleFields(callbackPayload);
}

/* Called by navigator if callback.iterate() returned true */
function navigatorInstance<RETURN_STRUCTURE>({
  tableName,
  parentTableName = '',
  parentTableRelationshipName = '',
  parentPathElementName = '',
  callbacks,
  callbackPayload,
}: {
  // The name of the current table
  readonly tableName: string;
  // Parent table name
  readonly parentTableName?: string;
  // NextRealPathElementName as returned by callbacks.getNextPathElement
  readonly parentTableRelationshipName?: string;
  // NextPathElementName as returned by callbacks.getNextPathElement
  readonly parentPathElementName?: string;
  // Callbacks (described in the navigator)
  readonly callbacks: NavigationCallbacks<RETURN_STRUCTURE>;
  // Callbacks payload (described in the navigator)
  readonly callbackPayload: NavigationCallbackPayload<RETURN_STRUCTURE>;
}): RETURN_STRUCTURE {
  const {
    parentRelationshipType,
    childrenAreToManyElements,
    childrenAreRanks,
  } = getNavigationChildrenTypes(
    parentTableName,
    parentTableRelationshipName,
    parentPathElementName,
    tableName
  );

  if (childrenAreToManyElements && childrenAreRanks)
    throw new Error('Unable to properly determine picklist type');

  callbacks.navigatorInstancePre(callbackPayload);

  callbackPayload.parentRelationshipType = parentRelationshipType;
  callbackPayload.parentTableName = parentTableName;

  callNavigatorInstanceCallbacks(
    childrenAreToManyElements,
    childrenAreRanks,
    callbacks,
    callbackPayload
  );

  const data = callbacks.getInstanceData(callbackPayload);
  callbackPayload.data = data;
  callbacks.commitInstanceData(callbackPayload);

  return data;
}

export function getTableFromMappingPath({
  baseTableName,
  mappingPath,
}: {
  readonly baseTableName: string;
  readonly mappingPath: MappingPath;
}): string {
  const trimmedMappingPath =
    valueIsReferenceItem(mappingPath.slice(-1)[0]) ||
    valueIsTreeRank(mappingPath.slice(-1)[0])
      ? mappingPath.slice(0, -1)
      : mappingPath;

  const canonicalMappingPath = getCanonicalMappingPath(trimmedMappingPath);

  const cacheName = mappingPathToString([
    baseTableName,
    ...canonicalMappingPath,
  ]);
  const results = cache.get('wbPlanViewNavigatorTables', cacheName);
  if (typeof results === 'string') return results;

  const tableName = getMappingLineData({
    baseTableName,
    mappingPath: canonicalMappingPath,
  }).slice(-1)[0]?.tableName;

  if (typeof tableName === 'undefined')
    throw new Error('Unable to extract the table name from mapping path');

  cache.set('wbPlanViewNavigatorTables', cacheName, tableName);

  return tableName;
}

/*
 * Get data required to build a mapping line from a source mapping path
 * and other options
 */
export function getMappingLineData({
  baseTableName,
  mappingPath: readonlyMappingPath = ['0'],
  openSelectElement,
  iterate = false,
  generateLastRelationshipData = true,
  customSelectType = 'CLOSED_LIST',
  handleChange,
  handleOpen,
  handleClose,
  handleAutoMapperSuggestionSelection,
  getMappedFields,
  autoMapperSuggestions,
  showHiddenFields = false,
  mustMatchPreferences = {},
  columnOptions,
  mappingOptionsMenuGenerator = undefined,
}: {
  readonly baseTableName: string;
  // The mapping path
  readonly mappingPath?: MappingPath;
  // Index of custom select element that should be open
  readonly openSelectElement?: SelectElementPosition;
  /*
   * {bool} if False, returns data only for the last element of the mapping
   * path
   * Else returns data for each mapping path part
   */
  readonly iterate?: boolean;
  /*
   * {bool} whether to generate data for the last element of the mapping
   * path if the last element is a relationship
   */
  readonly generateLastRelationshipData?: boolean;
  readonly customSelectType?: CustomSelectType;
  readonly showHiddenFields?: boolean;
  readonly handleChange?: (payload: {
    readonly index: number;
    readonly close: boolean;
    readonly newValue: string;
    readonly isRelationship: boolean;
    readonly currentTableName: string;
    readonly newTableName: string;
    readonly isDoubleClick: boolean;
  }) => void;
  readonly handleOpen?: (index: number) => void;
  readonly handleClose?: () => void;
  readonly handleAutoMapperSuggestionSelection?: (suggestion: string) => void;
  readonly getMappedFields?: GetMappedFieldsBind;
  readonly autoMapperSuggestions?: RA<AutoMapperSuggestion>;
  readonly mustMatchPreferences?: IR<boolean>;
  readonly columnOptions?: ColumnOptions;
  readonly mappingOptionsMenuGenerator?: () => IR<HtmlGeneratorFieldData>;
}): MappingElementProps[] {
  const internalState: {
    mappingPathPosition: number;
    mappingLineData: MappingElementProps[];
    customSelectType: CustomSelectType;
    customSelectSubtype?: CustomSelectSubtype;
    isOpen?: boolean;
    nextMappingPathElement?: string;
    defaultValue?: string;
    currentMappingPathPart?: string;
    resultFields: R<HtmlGeneratorFieldData>;
    mappedFields: string[];
    generateMappingOptionsMenu: boolean;
  } = {
    mappingPathPosition: -1,
    mappingLineData: [],
    customSelectType,
    mappedFields: [],
    resultFields: {},
    isOpen: false,
    generateMappingOptionsMenu: false,
  };

  const mappingPath: MappingPathWritable = Array.from(readonlyMappingPath);

  const firstIterationRequirement = (): boolean =>
    iterate ||
    mappingPath.length === 0 ||
    internalState.mappingPathPosition + 1 === mappingPath.length;

  const secondIterationRequirement = (): boolean =>
    generateLastRelationshipData ||
    internalState.mappingPathPosition + 1 !== mappingPath.length;

  const isFieldVisible = (
    showHiddenFields: boolean,
    isHidden: boolean,
    fieldName: string
  ): boolean =>
    showHiddenFields ||
    !isHidden ||
    // Show a default field, even if it is hidden
    fieldName === internalState.defaultValue;

  function fieldIsDefault(
    fieldName: string,
    defaultValue: string | undefined,
    isRelationship: boolean
  ): boolean {
    const isDefault = fieldName === defaultValue;
    if (isDefault)
      internalState.generateMappingOptionsMenu =
        !isRelationship && typeof mappingOptionsMenuGenerator !== 'undefined';
    return isDefault;
  }

  const callbacks: NavigationCallbacks<MappingElementProps> = {
    iterate: () => firstIterationRequirement() && secondIterationRequirement(),

    getNextPathElement({ tableName }) {
      internalState.mappingPathPosition += 1;

      let nextPathElementName = mappingPath[internalState.mappingPathPosition];

      if (typeof nextPathElementName == 'undefined') return undefined;

      const formattedTreeRankName = formatTreeRank(nextPathElementName);
      const treeRankName = getNameFromTreeRankName(formattedTreeRankName);
      if (
        tableIsTree(tableName) &&
        typeof dataModelStorage.ranks[tableName][treeRankName] !== 'undefined'
      ) {
        nextPathElementName = formattedTreeRankName;
        mappingPath[internalState.mappingPathPosition] = formattedTreeRankName;
      }

      return {
        nextPathElementName,
        nextPathElement:
          dataModelStorage.tables[tableName].fields[nextPathElementName],
        nextRealPathElementName:
          valueIsTreeRank(nextPathElementName) ||
          valueIsReferenceItem(nextPathElementName)
            ? mappingPath[internalState.mappingPathPosition - 1]
            : nextPathElementName,
      };
    },

    navigatorInstancePre({ tableName }) {
      internalState.isOpen =
        openSelectElement?.index === internalState.mappingPathPosition + 1 ||
        ['OPENED_LIST', 'BASE_TABLE_SELECTION_LIST'].includes(
          internalState.customSelectType
        );

      internalState.customSelectSubtype = 'simple';

      const localMappingPath = mappingPath.slice(
        0,
        internalState.mappingPathPosition + 1
      );

      internalState.nextMappingPathElement =
        mappingPath[internalState.mappingPathPosition + 1];

      if (typeof internalState.nextMappingPathElement === 'undefined')
        internalState.defaultValue = '0';
      else {
        const formattedTreeRankName = formatTreeRank(
          internalState.nextMappingPathElement
        );
        const treeRankName = getNameFromTreeRankName(formattedTreeRankName);
        if (
          tableIsTree(tableName) &&
          typeof dataModelStorage.ranks[tableName][treeRankName] !== 'undefined'
        ) {
          internalState.nextMappingPathElement = formattedTreeRankName;
          mappingPath[internalState.mappingPathPosition] =
            formattedTreeRankName;
        }

        internalState.defaultValue = internalState.nextMappingPathElement;
      }

      internalState.currentMappingPathPart =
        mappingPath[internalState.mappingPathPosition];
      internalState.resultFields = {};
      internalState.mappedFields =
        typeof getMappedFields === 'function'
          ? Object.keys(getMappedFields(localMappingPath))
          : [];

      internalState.generateMappingOptionsMenu = false;
    },

    handleToManyChildren({ tableName, parentTableName }) {
      internalState.customSelectSubtype = 'toMany';

      if (typeof internalState.nextMappingPathElement !== 'undefined')
        internalState.mappedFields.push(internalState.nextMappingPathElement);

      const maxMappedElementNumber = getMaxToManyValue(
        internalState.mappedFields
      );

      for (let index = 1; index <= maxMappedElementNumber; index += 1) {
        const mappedObjectName = formatReferenceItem(index);

        internalState.resultFields[mappedObjectName] = {
          optionLabel: mappedObjectName,
          isEnabled: true,
          isRequired: false,
          isHidden: false,
          isRelationship: true,
          isDefault: mappedObjectName === internalState.defaultValue,
          tableName,
        };
      }

      /*
       * Allow only a single -to-many reference number for `zero-to-one`
       * relationships
       */
      if (
        maxMappedElementNumber < 1 ||
        !dataModelStorage.originalRelationships['zero-to-one']?.[
          parentTableName ?? ''
        ]?.includes(internalState.currentMappingPathPart ?? '')
      )
        internalState.resultFields.add = {
          optionLabel: commonText('add'),
          isEnabled: true,
          isRequired: false,
          isHidden: false,
          isRelationship: true,
          isDefault: false,
          tableName,
        };
    },

    handleTreeRanks({ tableName }) {
      internalState.customSelectSubtype = 'tree';
      const tableRanks = dataModelStorage.ranks[tableName];

      internalState.resultFields = Object.fromEntries(
        Object.entries(tableRanks).map(([rankName, { isRequired, title }]) => [
          formatTreeRank(rankName),
          {
            optionLabel: title,
            isEnabled: true,
            isRequired: isRequired && !mustMatchPreferences[tableName],
            isHidden: false,
            isRelationship: true,
            isDefault: formatTreeRank(rankName) === internalState.defaultValue,
            tableName,
          },
        ])
      );
    },

    handleSimpleFields: ({
      tableName,
      parentTableName,
      parentRelationshipType,
    }) =>
      (internalState.resultFields = Object.fromEntries(
        Object.entries(dataModelStorage.tables[tableName].fields)
          .filter(
            ([
              fieldName,
              {
                isRelationship,
                type: relationshipType,
                isHidden,
                foreignName,
                tableName: fieldTableName,
              },
            ]) =>
              (!isRelationship ||
                !isCircularRelationship({
                  // Skip circular relationships
                  targetTableName: fieldTableName,
                  parentTableName,
                  foreignName,
                  relationshipKey: fieldName,
                  currentMappingPathPart: internalState.currentMappingPathPart,
                  tableName,
                })) &&
              /*
               * Skip -to-many inside -to-many
               * TODO: remove this once upload plan is ready
               */
              !isTooManyInsideOfTooMany(
                relationshipType,
                parentRelationshipType
              ) &&
              // Skip hidden fields when user decided to hide them
              isFieldVisible(showHiddenFields, isHidden, fieldName)
          )
          .map(
            ([
              fieldName,
              {
                isRelationship,
                isHidden,
                isRequired,
                label,
                tableName: fieldTableName,
              },
            ]) => [
              fieldName,
              {
                optionLabel: label,
                // Enable field
                isEnabled:
                  // If it is not mapped
                  !internalState.mappedFields.includes(fieldName) ||
                  // Or is a relationship,
                  isRelationship,
                isRequired: isRequired && !mustMatchPreferences[tableName],
                isHidden,
                isDefault: fieldIsDefault(
                  fieldName,
                  internalState.defaultValue,
                  isRelationship
                ),
                isRelationship,
                tableName: fieldTableName,
              },
            ]
          )
      )),

    getInstanceData({ tableName }) {
      const mappingPathPosition = internalState.mappingPathPosition + 1;
      return {
        customSelectType: internalState.customSelectType,
        customSelectSubtype: internalState.customSelectSubtype,
        selectLabel: dataModelStorage.tables[tableName].label,
        fieldsData: internalState.resultFields,
        tableName,
        ...(Boolean(internalState.isOpen)
          ? {
              isOpen: true,
              handleChange:
                typeof handleChange === 'function'
                  ? (payload): void =>
                      handleChange({
                        index: mappingPathPosition,
                        ...payload,
                      })
                  : undefined,
              handleClose: handleClose?.bind(undefined, mappingPathPosition),
              autoMapperSuggestions,
              handleAutoMapperSuggestionSelection,
            }
          : {
              isOpen: false,
              handleOpen: handleOpen?.bind(undefined, mappingPathPosition),
            }),
      };
    },

    commitInstanceData({ data }) {
      if (typeof data === 'undefined')
        throw new Error("No data to commit to navigator's state");
      internalState.mappingLineData.push(data);
      return data;
    },

    getFinalData: () =>
      internalState.generateMappingOptionsMenu
        ? [
            ...internalState.mappingLineData,
            {
              customSelectType: 'MAPPING_OPTIONS_LIST',
              customSelectSubtype: 'simple',
              fieldsData: mappingOptionsMenuGenerator!(),
              previewOption: {
                optionName: 'mappingOptions',
                optionLabel: '⚙',
                tableName: '',
                isRelationship: !columnOptionsAreDefault(columnOptions!),
              },
              selectLabel: wbText('mappingOptions'),
              ...(openSelectElement?.index ===
              internalState.mappingLineData.length
                ? {
                    isOpen: true,
                    handleChange: undefined,
                    handleClose: handleClose?.bind(
                      undefined,
                      internalState.mappingLineData.length
                    ),
                    autoMapperSuggestions,
                    handleAutoMapperSuggestionSelection,
                  }
                : {
                    isOpen: false,
                    handleOpen: handleOpen?.bind(
                      undefined,
                      internalState.mappingLineData.length
                    ),
                  }),
            },
          ]
        : internalState.mappingLineData,
  };

  return navigator<MappingElementProps>({
    callbacks,
    config: {
      baseTableName,
    },
  });
}
