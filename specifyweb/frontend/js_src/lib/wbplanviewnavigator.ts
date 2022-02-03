/**
 * Helpful methods for navigating though schema across a certain mapping path.
 * Helps define information needed to display WbPlanView components
 *
 * @module
 */

import type { CustomSelectSubtype } from './components/customselectelement';
import type {
  HtmlGeneratorFieldData,
  MappingElementProps,
} from './components/wbplanviewcomponents';
import type {
  MappingPath,
  RelationshipType,
} from './components/wbplanviewmapper';
import type { GetMappedFieldsBind } from './components/wbplanviewmappercomponents';
import commonText from './localization/common';
import { getModel } from './schema';
import { getTreeDefinitionItems, isTreeModel } from './treedefinitions';
import type { IR, RA } from './types';
import { defined, filterArray } from './types';
import {
  formatToManyIndex,
  formatTreeRank,
  getGenericMappingPath,
  getNameFromTreeRankName,
  relationshipIsToMany,
  valueIsToManyIndex,
  valueIsTreeRank,
} from './wbplanviewmappinghelper';
import dataModelStorage from './wbplanviewmodel';
import type { DataModelRelationship } from './wbplanviewmodelfetcher';
import {
  getMaxToManyIndex,
  isCircularRelationship,
  isTooManyInsideOfTooMany,
} from './wbplanviewmodelhelper';

type NavigationCallbackPayload = {
  readonly tableName: string;
  readonly parentRelationshipType: RelationshipType;
  readonly parentTableName: string;
};

type NavigatorCallbackFunction<RETURN_TYPE> = (
  callbackPayload: Readonly<NavigationCallbackPayload>
) => RETURN_TYPE;

type NavigationCallbacks = {
  // Should return undefined if next element does not exist
  readonly getNextDirection: (tableName: string) =>
    | {
        // The name of the next path element
        readonly fieldName: string;
        /*
         * If nextPathElementName is not a field nor a relationships, {string}
         * current path element name.
         * Else nextPathElementName
         */
        readonly partName: string;
      }
    | undefined;
  // Handles toMany children
  readonly handleToManyChildren: NavigatorCallbackFunction<void>;
  // Handles tree ranks children
  readonly handleTreeRanks: NavigatorCallbackFunction<void>;
  // Handles fields and relationships
  readonly handleSimpleFields: NavigatorCallbackFunction<void>;
};

/**
 * Navigates though the schema according to a specified mapping path and
 * calls certain callbacks while doing that
 *
 * @remarks
 * Unlike the navigator implemented in the AutoMapper, this navigator navigates
 * with only one instance at a time (you can't fork the mapping path to visit
 * fields from multiple relationships at once)
 */
export function navigator({
  callbacks,
  recursivePayload = undefined,
  baseTableName,
}: {
  // Callbacks can be modified depending on the need to make navigator versatile
  readonly callbacks: NavigationCallbacks;
  // Used internally to make navigator call itself multiple times
  readonly recursivePayload?: {
    readonly tableName: string;
    readonly parentTableName: string;
    readonly parentPartName: string;
    readonly parentFieldName: string;
  };
  readonly baseTableName?: string;
}): void {
  if (typeof dataModelStorage.tables === 'undefined')
    throw new Error('WbPlanView Data Model is not initialized');

  const {
    tableName = defined(baseTableName),
    parentTableName = '',
    parentFieldName = '',
    parentPartName = '',
  } = recursivePayload ?? {};

  const next = callbacks.getNextDirection(tableName);
  if (typeof next === 'undefined') return;

  const parentRelationshipType: RelationshipType | undefined = (
    dataModelStorage.tables[parentTableName]?.[
      parentFieldName
    ] as DataModelRelationship
  )?.type;

  const childrenAreToManyElements =
    relationshipIsToMany(parentRelationshipType) &&
    !valueIsToManyIndex(parentPartName);

  const childrenAreRanks =
    isTreeModel(tableName) && !valueIsTreeRank(parentPartName);

  const callbackPayload = {
    tableName,
    parentRelationshipType,
    parentTableName,
  };

  if (childrenAreToManyElements)
    callbacks.handleToManyChildren(callbackPayload);
  else if (childrenAreRanks) callbacks.handleTreeRanks(callbackPayload);
  else callbacks.handleSimpleFields(callbackPayload);

  const isSpecial =
    valueIsToManyIndex(next.partName) || valueIsTreeRank(next.partName);
  const nextField = dataModelStorage.tables[tableName][next.partName];

  const nextTableName = isSpecial
    ? tableName
    : nextField?.isRelationship ?? false
    ? nextField?.tableName ?? ''
    : '';
  const nextParentTableName = isSpecial
    ? parentTableName
    : nextField?.isRelationship ?? false
    ? tableName
    : '';

  if (nextTableName !== '')
    navigator({
      callbacks,
      recursivePayload: {
        tableName: nextTableName,
        parentTableName: nextParentTableName,
        parentFieldName: next.fieldName,
        parentPartName: next.partName,
      },
    });
}

export function getTableFromMappingPath(
  baseTableName: string,
  mappingPath: MappingPath
): string {
  if (mappingPath.length === 0) return baseTableName;
  const field = defined(
    defined(getModel(baseTableName)).getField(
      getGenericMappingPath(mappingPath).join('.')
    )
  );
  return field.isRelationship
    ? field.relatedModelName.toLowerCase()
    : field.model.name.toLowerCase();
}

export type MappingLineData = Pick<
  MappingElementProps,
  'fieldsData' | 'customSelectSubtype' | 'tableName' | 'selectLabel'
>;

/** Get data required to build a mapping line from a source mapping path */
export function getMappingLineData({
  baseTableName,
  mappingPath,
  iterate = false,
  generateFieldData = 'all',
  getMappedFields,
  showHiddenFields = false,
  mustMatchPreferences = {},
}: {
  readonly baseTableName: string;
  // The mapping path
  readonly mappingPath: MappingPath;
  /*
   * If false, returns data only for the last element of the mapping
   * path
   * Else returns data for each mapping path part
   */
  readonly iterate?: boolean;
  /*
   * "none" - fieldsData would be an empty object
   * "selectedOnly" - fieldsData would only have data for the selected field
   * "all" - fieldsData has data for all files
   */
  readonly generateFieldData: 'none' | 'selectedOnly' | 'all';
  readonly getMappedFields?: GetMappedFieldsBind;
  readonly showHiddenFields?: boolean;
  readonly mustMatchPreferences?: IR<boolean>;
}): RA<MappingLineData> {
  const internalState: {
    position: number;
    mappingLineData: MappingLineData[];
    mappedFields: string[];
    defaultValue: string;
  } = {
    position: -1,
    mappingLineData: [],
    mappedFields: [],
    defaultValue: '0',
  };

  const isFieldVisible = (
    showHiddenFields: boolean,
    isHidden: boolean,
    fieldName: string
  ): boolean =>
    showHiddenFields ||
    !isHidden ||
    // Show a default field, even if it is hidden
    fieldName === internalState.defaultValue;

  const commitInstanceData = (
    customSelectSubtype: CustomSelectSubtype,
    tableName: string,
    fieldsData: RA<[string, HtmlGeneratorFieldData] | undefined>
  ): void =>
    void internalState.mappingLineData.push({
      customSelectSubtype,
      selectLabel: defined(getModel(tableName)).getLocalizedName(),
      fieldsData: Object.fromEntries(filterArray(fieldsData)),
      tableName,
    });

  const lastPartIndex =
    mappingPath.slice(-1)[0] === '0'
      ? mappingPath.length - 1
      : mappingPath.length - 2;

  const callbacks: NavigationCallbacks = {
    getNextDirection() {
      if (
        (!iterate && internalState.position !== lastPartIndex) ||
        internalState.position > lastPartIndex
      )
        return undefined;

      internalState.position += 1;
      const nextPart = mappingPath[internalState.position];
      internalState.defaultValue = nextPart;

      const localMappingPath = mappingPath.slice(0, internalState.position);
      internalState.mappedFields = [
        ...(getMappedFields?.(localMappingPath) ?? []),
        internalState.defaultValue,
      ];

      return {
        partName: nextPart,
        fieldName:
          valueIsTreeRank(nextPart) || valueIsToManyIndex(nextPart)
            ? mappingPath[internalState.position - 1]
            : nextPart,
      };
    },

    handleToManyChildren({ tableName, parentTableName }) {
      const maxMappedElementNumber = getMaxToManyIndex(
        internalState.mappedFields
      );

      const isToOne =
        getModel(parentTableName ?? '')?.getField(
          mappingPath[internalState.position - 1] ?? ''
        )?.type === 'zero-to-one';
      const toManyLimit = isToOne ? 1 : Number.POSITIVE_INFINITY;
      const additional =
        maxMappedElementNumber < toManyLimit
          ? [[formatToManyIndex(maxMappedElementNumber + 1), commonText('add')]]
          : [];

      commitInstanceData(
        'toMany',
        tableName,
        [
          ...Array.from({ length: maxMappedElementNumber }, (_, index) => [
            formatToManyIndex(index + 1),
          ]),
          ...additional,
        ].map(([key, optionLabel = key]) => {
          const isDefault = key === internalState.defaultValue;
          return isDefault || generateFieldData === 'all'
            ? [
                key,
                {
                  optionLabel,
                  isEnabled: true,
                  isRequired: false,
                  isHidden: false,
                  isRelationship: true,
                  isDefault,
                  tableName,
                },
              ]
            : undefined;
        })
      );
    },

    handleTreeRanks({ tableName }) {
      const defaultValue = getNameFromTreeRankName(internalState.defaultValue);

      commitInstanceData(
        'tree',
        tableName,
        generateFieldData === 'none'
          ? []
          : getTreeDefinitionItems(tableName as 'Geography', false).map(
              ({ name, isEnforced, title }) =>
                name === defaultValue || generateFieldData === 'all'
                  ? [
                      formatTreeRank(name),
                      {
                        optionLabel: title ?? name,
                        isEnabled: true,
                        isRequired:
                          isEnforced === true &&
                          !mustMatchPreferences[tableName],
                        isHidden: false,
                        isRelationship: true,
                        isDefault: name === defaultValue,
                        tableName,
                      },
                    ]
                  : undefined
            )
      );
    },

    handleSimpleFields: ({
      tableName,
      parentTableName,
      parentRelationshipType,
    }) =>
      commitInstanceData(
        'simple',
        tableName,
        generateFieldData === 'none'
          ? []
          : Object.entries(dataModelStorage.tables[tableName]).map(
              ([fieldName, field]) =>
                (generateFieldData === 'all' ||
                  fieldName === internalState.defaultValue) &&
                (!field.isRelationship ||
                  !isCircularRelationship({
                    targetTableName: tableName,
                    parentTableName,
                    foreignName: field.foreignName ?? '',
                    relationshipKey: fieldName,
                    currentMappingPathPart:
                      mappingPath[internalState.position - 1],
                    tableName,
                  })) &&
                !isTooManyInsideOfTooMany(field.type, parentRelationshipType) &&
                isFieldVisible(showHiddenFields, field.isHidden, fieldName)
                  ? [
                      fieldName,
                      {
                        optionLabel: field.label,
                        // Enable field
                        isEnabled:
                          // If it is not mapped
                          !internalState.mappedFields.includes(fieldName) ||
                          // Or is a relationship,
                          field.isRelationship,
                        isRequired:
                          field.isRequired && !mustMatchPreferences[tableName],
                        isHidden: field.isHidden,
                        isDefault: fieldName === internalState.defaultValue,
                        isRelationship: field.isRelationship,
                        tableName: field.tableName,
                      },
                    ]
                  : undefined
            )
      ),
  };

  navigator({
    callbacks,
    baseTableName,
  });

  return internalState.mappingLineData;
}
