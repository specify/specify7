/*
*
* Helpful methods for navigating though schema across a certain mapping path.
* Helps define information needed to display wbplanview components
*
* */

'use strict';

import {
  formatReferenceItem,
  formatTreeRank,
  getMaxToManyValue,
  getNameFromTreeRankName,
  isCircularRelationship,
  isTooManyInsideOfTooMany,
  relationshipIsToMany,
  tableIsTree,
  valueIsReferenceItem,
  valueIsTreeRank,
}                       from './wbplanviewmodelhelper';
import dataModelStorage from './wbplanviewmodel';
import {
  AutomapperSuggestion,
  GetMappedFieldsBind,
  MappingPath,
  RelationshipType,
  SelectElementPosition,
}                       from './components/wbplanviewmapper';
import {
  DataModelField,
  DataModelRelationship,
}                         from './wbplanviewmodelfetcher';
import {
  CustomSelectSubtype,
  CustomSelectType,
}                         from './components/customselectelement';
import {
  HtmlGeneratorFieldData,
  MappingElementProps,
}                         from './components/wbplanviewcomponents';


interface FindNextNavigationDirectionBase {
  finished: boolean,
}

type FindNextNavigationDirection<RETURN_STRUCTURE> =
  FindNextNavigationDirectionBase
  &
  (
    {
      finished: true,
      finalData: RETURN_STRUCTURE[],
    } | {
    finished: false,
    payload: {
      nextTableName: string,
      nextParentTableName: string,
      nextRealPathElementName: string,
      nextPathElementName: string,
    },
  }
    )

interface NavigationCallbackPayload<RETURN_TYPE> {
  tableName: string,
  data?: RETURN_TYPE,
  parentRelationshipType?: RelationshipType,
  parentTableName?: string,
}

type NavigatorCallbackFunction<RETURN_STRUCTURE, RETURN_TYPE> = (
  callbackPayload: Readonly<NavigationCallbackPayload<RETURN_STRUCTURE>>,
) => RETURN_TYPE;

interface NavigationCallbacks<RETURN_STRUCTURE> {
  // should return {boolean} specifying whether to run
  // dataModel.navigatorInstance() for a particular mapping path part
  readonly iterate: NavigatorCallbackFunction<RETURN_STRUCTURE, boolean>,
  // should return undefined if next element does not exist
  readonly getNextPathElement: NavigatorCallbackFunction<RETURN_STRUCTURE, {
    // the name of the next path element
    readonly nextPathElementName: string,
    // if the next path element is not a field nor a relationship, {undefined}.
    // Else, {object} the information about a field from dataModel.tables
    readonly nextPathElement: DataModelField,
    // If nextPathElementName is not a field nor a relationships, {string}
    // current path element name.
    // Else nextPathElementName
    readonly nextRealPathElementName: string,
  } | undefined>,
  // formats internalPayload and returns it. Would be used as a return
  // value for the navigator
  readonly getFinalData:
    NavigatorCallbackFunction<RETURN_STRUCTURE, RETURN_STRUCTURE[]>,
  // commits callbackPayload.data to internalPayload and returns
  // committed data
  readonly getInstanceData:
    NavigatorCallbackFunction<RETURN_STRUCTURE, RETURN_STRUCTURE>,
  // commits callbackPayload.data to internalPayload and returns
  // committed data
  readonly commitInstanceData:
    NavigatorCallbackFunction<RETURN_STRUCTURE, RETURN_STRUCTURE>,
  // called inside of navigatorInstance before it calls callbacks for
  // tree ranks / reference items / simple fields
  readonly navigatorInstancePre:
    NavigatorCallbackFunction<RETURN_STRUCTURE, void>,
  // handles toMany children
  readonly handleToManyChildren:
    NavigatorCallbackFunction<RETURN_STRUCTURE, void>,
  // handles tree ranks children
  readonly handleTreeRanks:
    NavigatorCallbackFunction<RETURN_STRUCTURE, void>,
  // handles fields and relationships
  readonly handleSimpleFields:
    NavigatorCallbackFunction<RETURN_STRUCTURE, void>,
}


function findNextNavigationDirection<RETURN_STRUCTURE>(
  callbacks: NavigationCallbacks<RETURN_STRUCTURE>,
  callbackPayload: Readonly<NavigationCallbackPayload<RETURN_STRUCTURE>>,
  tableName: string,
  parentTableName: string,
): FindNextNavigationDirection<RETURN_STRUCTURE> {
  const nextPathElementsData =
    callbacks.getNextPathElement(callbackPayload);

  if (typeof nextPathElementsData === 'undefined')
    return {
      finished: true,
      finalData: callbacks.getFinalData(callbackPayload),
    };

  const {
    nextPathElementName,
    nextPathElement,
    nextRealPathElementName,
  } = nextPathElementsData;

  let nextTableName = '';
  let nextParentTableName = '';

  if (
    valueIsReferenceItem(nextPathElementName) ||
    valueIsTreeRank(nextPathElementName)
  ) {
    nextTableName = tableName;
    nextParentTableName = parentTableName;
  }
  else if (
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

// Navigates though the schema according to a specified mapping path and
// calls certain callbacks while doing that
export function navigator<RETURN_STRUCTURE>({
  callbacks,
  recursivePayload = undefined,
  config: {
    baseTableName,
  },
}: {
  // Callbacks can be modified depending on the need to make navigator versatile
  readonly callbacks: NavigationCallbacks<RETURN_STRUCTURE>,
  // {object|undefined} used internally to make navigator call itself
  // multiple times
  readonly recursivePayload?: {
    readonly tableName: string,
    readonly parentTableName: string,
    readonly parentTableRelationshipName: string,
    readonly parentPathElementName: string,
  }
  readonly config: {
    readonly baseTableName?: string  // the name of the base table to use
  }
}): RETURN_STRUCTURE[] {

  let tableName = '';
  let parentTableName = '';
  let parentTableRelationshipName = '';
  let parentPathElementName = '';

  if (typeof recursivePayload === 'undefined') {
    if (typeof baseTableName === 'undefined')
      throw new Error(
        'Base table needs to be specified for a navigator to be able' +
        ' to loop though schema',
      );
    tableName = baseTableName;
  }
  else
    (
      {
        tableName,
        parentTableName,
        parentTableRelationshipName,
        parentPathElementName,
      } = recursivePayload
    );

  // an object that is shared between navigator, navigatorInstance and
  // some callbacks
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


  const nextNavigationDirection =
    findNextNavigationDirection<RETURN_STRUCTURE>(
      callbacks,
      callbackPayload,
      tableName,
      parentTableName,
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
    schemaNavigatorResults = navigator(
      {
        callbacks,
        recursivePayload: {
          tableName: nextTableName,
          parentTableName: nextParentTableName,
          parentTableRelationshipName: nextRealPathElementName,
          parentPathElementName: nextPathElementName,
        },
        config: {},
      },
    );

  return schemaNavigatorResults.length === 0 ?
    callbacks.getFinalData(callbackPayload) :
    schemaNavigatorResults;

}

function getNavigationChildrenTypes(
  parentTableName: string,
  parentTableRelationshipName: string,
  parentPathElementName: string,
  tableName: string,
) {
  const parentRelationshipType: RelationshipType | undefined =
    (
      dataModelStorage.tables[
        parentTableName]?.fields[
        parentTableRelationshipName] as DataModelRelationship
    )?.type;

  return {
    parentRelationshipType,
    childrenAreToManyElements:
      relationshipIsToMany(parentRelationshipType) &&
      !valueIsReferenceItem(parentPathElementName),
    childrenAreRanks:
      tableIsTree(tableName) &&
      !valueIsTreeRank(parentPathElementName),
  };
}

function callNavigatorInstanceCallbacks<RETURN_STRUCTURE>(
  childrenAreToManyElements: boolean,
  childrenAreRanks: boolean,
  callbacks: NavigationCallbacks<RETURN_STRUCTURE>,
  callbackPayload: Readonly<NavigationCallbackPayload<RETURN_STRUCTURE>>,
) {
  if (childrenAreToManyElements)
    callbacks.handleToManyChildren(callbackPayload);
  else if (childrenAreRanks)
    callbacks.handleTreeRanks(callbackPayload);
  else
    callbacks.handleSimpleFields(callbackPayload);
}

/* Called by navigator if callback.iterate returned true */
function navigatorInstance<RETURN_STRUCTURE>({
  tableName,
  parentTableName = '',
  parentTableRelationshipName = '',
  parentPathElementName = '',
  callbacks,
  callbackPayload,
}: {
  readonly tableName: string,  // the name of the current table
  readonly parentTableName?: string,  // parent table name
  // nextRealPathElementName as returned by callbacks.getNextPathElement
  readonly parentTableRelationshipName?: string,
  // nextPathElementName as returned by callbacks.getNextPathElement
  readonly parentPathElementName?: string,
  // callbacks (described in the navigator)
  readonly callbacks: NavigationCallbacks<RETURN_STRUCTURE>
  // callbacks payload (described in the navigator)
  readonly callbackPayload: NavigationCallbackPayload<RETURN_STRUCTURE>
}): RETURN_STRUCTURE {


  const {
    parentRelationshipType,
    childrenAreToManyElements,
    childrenAreRanks,
  } = getNavigationChildrenTypes(
    parentTableName,
    parentTableRelationshipName,
    parentPathElementName,
    tableName,
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
    callbackPayload,
  );


  const data = callbacks.getInstanceData(callbackPayload);
  callbackPayload.data = data;
  callbacks.commitInstanceData(callbackPayload);

  return data;

}


/*
* Get data required to build a mapping line from a source mapping path
* and other options
* */
export function getMappingLineData({
  baseTableName,
  mappingPath = ['0'],
  openSelectElement,
  iterate = true,
  generateLastRelationshipData = true,
  customSelectType,
  handleChange,
  handleOpen,
  handleClose,
  handleAutomapperSuggestionSelection,
  getMappedFields,
  automapperSuggestions,
  showHiddenFields = true,
  mappingOptionsMenuGenerator = undefined,
}: {
  readonly baseTableName: string,
  readonly mappingPath?: MappingPath,  // the mapping path
  // index of custom select element that should be open
  readonly openSelectElement?: SelectElementPosition
  // {bool} if False, returns data only for the last element of the mapping
  // path only
  // Else returns data for each mapping path part
  readonly iterate?: boolean,
  // {bool} whether to generate data for the last element of the mapping
  // path if the last element is a relationship
  readonly generateLastRelationshipData?: boolean
  readonly customSelectType: CustomSelectType,
  readonly showHiddenFields?: boolean,
  readonly handleChange?: (
    index: number,
    newValue: string,
    isRelationship: boolean,
    currentTable: string,
    newTable: string,
  ) => void,
  readonly handleOpen?: (
    index: number,
  ) => void
  readonly handleClose?: (
    index: number,
  ) => void
  readonly handleAutomapperSuggestionSelection?: (suggestion: string) => void,
  readonly getMappedFields?: GetMappedFieldsBind,
  readonly automapperSuggestions?: AutomapperSuggestion[],
  readonly mappingOptionsMenuGenerator?: ()=>
    Record<string,HtmlGeneratorFieldData>,
}): MappingElementProps[] {

  const internalState: {
    mappingPathPosition: number,
    mappingLineData: MappingElementProps[],
    customSelectType: CustomSelectType,
    customSelectSubtype?: CustomSelectSubtype
    isOpen?: boolean,
    nextMappingPathElement?: string,
    defaultValue?: string,
    currentMappingPathPart?: string,
    resultFields: Record<string,HtmlGeneratorFieldData>
    mappedFields: string[],
    generateMappingOptionsMenu: boolean,
  } = {
    mappingPathPosition: -1,
    mappingLineData: [],
    customSelectType,
    mappedFields: [],
    resultFields: {},
    isOpen: false,
    generateMappingOptionsMenu: false,
  };

  const firstIterationRequirement = () =>
    iterate ||
    mappingPath.length === 0 ||
    internalState.mappingPathPosition + 1 === mappingPath.length;

  const secondIterationRequirement = () =>
    generateLastRelationshipData ||
    internalState.mappingPathPosition + 1 !== mappingPath.length;

  const isFieldVisible = (
    showHiddenFields: boolean,
    isHidden: boolean,
    fieldName: string,
  ) =>
    showHiddenFields ||
    !isHidden ||
    // show a default field, even if it is hidden
    fieldName === internalState.defaultValue;

  function fieldIsDefault(
    fieldName: string,
    defaultValue: string | undefined,
    isRelationship: boolean,
  ) {
    const isDefault = fieldName === defaultValue;
    if(isDefault)
      internalState.generateMappingOptionsMenu =
        !isRelationship &&
        typeof mappingOptionsMenuGenerator !== 'undefined';
    return isDefault;
  }

  const callbacks: NavigationCallbacks<MappingElementProps> = {

    iterate: () =>
      firstIterationRequirement() && secondIterationRequirement(),

    getNextPathElement({tableName}) {

      if (internalState.mappingPathPosition === -2)
        internalState.mappingPathPosition = mappingPath.length - 1;

      internalState.mappingPathPosition++;

      let nextPathElementName =
        mappingPath[internalState.mappingPathPosition];

      if (typeof nextPathElementName == 'undefined')
        return undefined;

      const formattedTreeRankName = formatTreeRank(nextPathElementName);
      const treeRankName =
        getNameFromTreeRankName(formattedTreeRankName);
      if (
        tableIsTree(tableName) &&
        typeof dataModelStorage.ranks[tableName][treeRankName
          ] !== 'undefined'
      ) {
        nextPathElementName = formattedTreeRankName;
        mappingPath[internalState.mappingPathPosition] =
          formattedTreeRankName;
      }

      let nextRealPathElementName;
      if (
        valueIsTreeRank(nextPathElementName) ||
        valueIsReferenceItem(nextPathElementName)
      )
        nextRealPathElementName =
          mappingPath[internalState.mappingPathPosition - 1];
      else
        nextRealPathElementName = nextPathElementName;

      return {
        nextPathElementName,
        nextPathElement:
          dataModelStorage.tables[tableName].fields[nextPathElementName],
        nextRealPathElementName,
      };

    },

    navigatorInstancePre({tableName}) {

      internalState.isOpen =
        (
          openSelectElement?.index ===
          internalState.mappingPathPosition + 1
        ) ||
        [
          'OPENED_LIST',
          'BASE_TABLE_SELECTION_LIST',
          'MAPPING_OPTION_LINE_LIST',
        ].indexOf(internalState.customSelectType) !== -1;

      internalState.customSelectSubtype = 'simple';

      const localMappingPath = mappingPath.slice(
        0,
        internalState.mappingPathPosition + 1,
      );

      internalState.nextMappingPathElement =
        mappingPath[internalState.mappingPathPosition + 1];

      if (typeof internalState.nextMappingPathElement === 'undefined')
        internalState.defaultValue = '0';
      else {
        const formattedTreeRankName = formatTreeRank(
          internalState.nextMappingPathElement,
        );
        const treeRankName = getNameFromTreeRankName(
          formattedTreeRankName,
        );
        if (
          tableIsTree(tableName) &&
          typeof dataModelStorage.ranks[tableName][treeRankName
            ] !== 'undefined'
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
      internalState.mappedFields = typeof getMappedFields === 'function' ?
        Object.keys(getMappedFields(localMappingPath)) :
        [];

      internalState.generateMappingOptionsMenu = false;
    },

    handleToManyChildren({tableName}) {

      internalState.customSelectSubtype = 'toMany';

      if (typeof internalState.nextMappingPathElement !== 'undefined')
        internalState.mappedFields.push(
          internalState.nextMappingPathElement,
        );

      const maxMappedElementNumber =
        getMaxToManyValue(internalState.mappedFields);

      for (let i = 1; i <= maxMappedElementNumber; i++) {
        const mappedObjectName = formatReferenceItem(i);

        internalState.resultFields[mappedObjectName] = {
          fieldFriendlyName: mappedObjectName,
          isEnabled: true,
          isRequired: false,
          isHidden: false,
          isRelationship: true,
          isDefault: mappedObjectName === internalState.defaultValue,
          tableName,
        };
      }
      internalState.resultFields.add = {
        fieldFriendlyName: 'Add',
        isEnabled: true,
        isRequired: false,
        isHidden: false,
        isRelationship: true,
        isDefault: false,
        tableName,
      };

    },

    handleTreeRanks({tableName}) {

      internalState.customSelectSubtype = 'tree';
      const tableRanks = dataModelStorage.ranks[tableName];

      internalState.resultFields = Object.fromEntries(
        Object.entries(tableRanks).map(([rankName, isRequired]) => [
          formatTreeRank(rankName),
          {
            fieldFriendlyName: rankName,
            isEnabled: true,
            isRequired,
            isHidden: false,
            isRelationship: true,
            isDefault:
              formatTreeRank(rankName) === internalState.defaultValue,
            tableName,
          },
        ]),
      );

    },

    handleSimpleFields: ({
      tableName,
      parentTableName,
      parentRelationshipType,
    }) => (
      internalState.resultFields = Object.fromEntries(
        Object.entries(dataModelStorage.tables[tableName].fields).filter((
          [
            fieldName,
            {
              isRelationship,
              type: relationshipType,
              isHidden,
              foreignName,
              tableName: fieldTableName,
            },
          ],
          ) =>
          (
            !isRelationship ||
            !isCircularRelationship({  // skip circular relationships
              targetTableName: fieldTableName,
              parentTableName,
              foreignName,
              relationshipKey: fieldName,
              currentMappingPathPart:
              internalState.currentMappingPathPart,
              tableName: parentTableName,
            })
          ) &&
          // skip -to-many inside -to-many
          // TODO: remove this once upload plan is ready
          !isTooManyInsideOfTooMany(
            relationshipType,
            parentRelationshipType,
          ) &&
          // skip hidden fields when user decided to hide them
          isFieldVisible(showHiddenFields, isHidden, fieldName),
        ).map((
          [
            fieldName,
            {
              isRelationship,
              isHidden,
              isRequired,
              friendlyName,
              tableName: fieldTableName,
            },
          ],
        ) => [
          fieldName,
          {
            fieldFriendlyName: friendlyName,
            isEnabled:  // enable field
            // if it is not mapped
              internalState.mappedFields.indexOf(fieldName) === -1 ||
              isRelationship,  // or is a relationship,
            isRequired,
            isHidden,
            isDefault: fieldIsDefault(
              fieldName,
              internalState.defaultValue,
              isRelationship,
            ),
            isRelationship,
            tableName: fieldTableName,
          },
        ]),
      )
    ),

    getInstanceData: ({tableName}) => (
      {
        customSelectType: internalState.customSelectType,
        customSelectSubtype: internalState.customSelectSubtype,
        selectLabel: dataModelStorage.tables[tableName].tableFriendlyName,
        fieldsData: internalState.resultFields,
        tableName,
        ...(
          internalState.isOpen ?
            {
              isOpen: true,
              handleChange:
                handleChange &&
                handleChange.bind(
                  null,
                  internalState.mappingPathPosition + 1,
                ),
              handleClose:
                handleClose &&
                handleClose.bind(
                  null,
                  internalState.mappingPathPosition + 1,
                ),
              automapperSuggestions,
              handleAutomapperSuggestionSelection,
            } :
            {
              isOpen: false,
              handleOpen:
                handleOpen &&
                handleOpen.bind(null, internalState.mappingPathPosition + 1),
            }
        ),
      }
    ),

    commitInstanceData({data}) {
      if (typeof data === 'undefined')
        throw new Error('No data to commit to navigator\'s state');
      internalState.mappingLineData.push(data);
      return data;
    },

    getFinalData: () =>
      internalState.generateMappingOptionsMenu ?
        [
          ...internalState.mappingLineData,
          {
            customSelectType: 'MAPPING_OPTIONS_LIST',
            customSelectSubtype: 'simple',
            fieldsData: mappingOptionsMenuGenerator!(),
            defaultOption: {
              optionName: 'mappingOptions',
              optionLabel: '⚙',
              tableName: '',
              isRelationship: false,
            },
            ...(
              openSelectElement?.index ===
              internalState.mappingLineData.length ?
                {
                  isOpen: true,
                  handleChange: undefined,
                  handleClose:
                    handleClose &&
                    handleClose.bind(
                      null,
                      internalState.mappingLineData.length,
                    ),
                  automapperSuggestions,
                  handleAutomapperSuggestionSelection,
                } :
                {
                  isOpen: false,
                  handleOpen:
                    handleOpen &&
                    handleOpen.bind(
                      null,
                      internalState.mappingLineData.length,
                    ),
                }
            ),
          },
        ] :
        internalState.mappingLineData,
  };

  return navigator<MappingElementProps>({
    callbacks,
    config: {
      baseTableName,
    },
  });

}