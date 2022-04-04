/**
 * Helpful methods for navigating though schema across a certain mapping path.
 * Helps define information needed to display WbPlanView components
 *
 * @module
 */

import type { CustomSelectSubtype } from './components/customselectelement';
import { dateParts } from './components/internationalization';
import type {
  HtmlGeneratorFieldData,
  MappingElementProps,
} from './components/wbplanviewcomponents';
import type { MappingPath } from './components/wbplanviewmapper';
import type { Tables } from './datamodel';
import commonText from './localization/common';
import queryText from './localization/query';
import { getModel } from './schema';
import type { Relationship } from './specifyfield';
import type { SpecifyModel } from './specifymodel';
import { getTreeDefinitionItems, isTreeModel } from './treedefinitions';
import type { IR, RA } from './types';
import { defined, filterArray } from './types';
import {
  anyTreeRank,
  formatPartialField,
  formattedEntry,
  formatToManyIndex,
  formatTreeRank,
  getGenericMappingPath,
  getNameFromTreeRankName,
  parsePartialField,
  relationshipIsToMany,
  valueIsPartialField,
  valueIsToManyIndex,
  valueIsTreeRank,
} from './wbplanviewmappinghelper';
import {
  getMaxToManyIndex,
  isCircularRelationship,
} from './wbplanviewmodelhelper';
import { hasTreeAccess } from './permissions';

type NavigationCallbackPayload = {
  readonly model: SpecifyModel;
  readonly parentRelationship?: Relationship;
};

type NavigatorCallbackFunction<RETURN_TYPE> = (
  callbackPayload: Readonly<NavigationCallbackPayload>
) => RETURN_TYPE;

type NavigationCallbacks = {
  // Should return undefined if next element does not exist
  readonly getNextDirection: (model: SpecifyModel) =>
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
function navigator({
  callbacks,
  recursivePayload = undefined,
  baseTableName,
}: {
  // Callbacks can be modified depending on the need to make navigator versatile
  readonly callbacks: NavigationCallbacks;
  // Used internally to make navigator call itself multiple times
  readonly recursivePayload?: {
    readonly model: SpecifyModel;
    readonly parentPartName: string;
    readonly parentRelationship?: Relationship;
  };
  readonly baseTableName?: string;
}): void {
  const {
    model = defined(getModel(defined(baseTableName))),
    parentRelationship = undefined,
    parentPartName = '',
  } = recursivePayload ?? {};

  const next = callbacks.getNextDirection(model);
  if (typeof next === 'undefined') return;

  const childrenAreToManyElements =
    relationshipIsToMany(parentRelationship) &&
    !valueIsToManyIndex(parentPartName);

  const childrenAreRanks =
    isTreeModel(model.name) && !valueIsTreeRank(parentPartName);

  const callbackPayload = {
    model,
    parentRelationship,
  };

  if (childrenAreToManyElements)
    callbacks.handleToManyChildren(callbackPayload);
  else if (childrenAreRanks) callbacks.handleTreeRanks(callbackPayload);
  else callbacks.handleSimpleFields(callbackPayload);

  const isSpecial =
    valueIsToManyIndex(next.partName) || valueIsTreeRank(next.partName);
  const nextField = isSpecial
    ? parentRelationship
    : model.getField(next.fieldName);

  const nextTable = isSpecial
    ? model
    : typeof nextField === 'object' && nextField.isRelationship
    ? nextField.relatedModel
    : undefined;

  if (typeof nextTable === 'object' && nextField?.isRelationship !== false)
    navigator({
      callbacks,
      recursivePayload: {
        model: nextTable,
        parentRelationship: nextField,
        parentPartName: next.partName,
      },
    });
}

export function getTableFromMappingPath(
  baseTableName: keyof Tables,
  mappingPath: MappingPath
): keyof Tables {
  if (mappingPath.length === 0) return baseTableName;
  const fieldName = valueIsPartialField(mappingPath.slice(-1)[0])
    ? parsePartialField(mappingPath.slice(-1)[0])[0]
    : mappingPath.slice(-1)[0];
  const field = defined(
    defined(getModel(baseTableName)).getField(
      getGenericMappingPath([...mappingPath.slice(0, -1), fieldName]).join('.')
    )
  );
  return (field.isRelationship ? field.relatedModel : field.model).name;
}

export type MappingLineData = Pick<
  MappingElementProps,
  'fieldsData' | 'customSelectSubtype' | 'tableName' | 'selectLabel'
>;

const queryBuilderTreeFields = new Set(['fullName', 'author']);

/**
 * Get data required to build a mapping line from a source mapping path
 * Handles circular dependencies and must match tables
 */
export function getMappingLineData({
  baseTableName,
  mappingPath,
  generateFieldData = 'all',
  getMappedFields,
  showHiddenFields = false,
  mustMatchPreferences = {},
  scope = 'wbPlanView',
}: {
  readonly baseTableName: keyof Tables;
  // The mapping path
  readonly mappingPath: MappingPath;
  /*
   * "none" - fieldsData would be an empty object
   * "selectedOnly" - fieldsData would only have data for the selected field
   * "all" - fieldsData has data for all files
   */
  readonly generateFieldData: 'none' | 'selectedOnly' | 'all';
  readonly getMappedFields?: (mappingPath: MappingPath) => RA<string>;
  readonly showHiddenFields?: boolean;
  readonly mustMatchPreferences?: IR<boolean>;
  // WbPlanView has readOnly fields removed
  readonly scope?: 'queryBuilder' | 'wbPlanView';
}): RA<MappingLineData> {
  const internalState: {
    position: number;
    mappingLineData: MappingLineData[];
    mappedFields: RA<string>;
    defaultValue: string;
    parsedDefaultValue: Readonly<[fieldName: string, part: string | undefined]>;
  } = {
    position: -1,
    mappingLineData: [],
    mappedFields: [],
    defaultValue: '0',
    parsedDefaultValue: ['0', undefined],
  };

  const isFieldVisible = (
    showHiddenFields: boolean,
    isHidden: boolean,
    fieldName: string
  ): boolean =>
    showHiddenFields ||
    !isHidden ||
    // Show a default field, even if it is hidden
    fieldName === internalState.parsedDefaultValue[0];

  const commitInstanceData = (
    customSelectSubtype: CustomSelectSubtype,
    model: SpecifyModel,
    fieldsData: RA<Readonly<[string, HtmlGeneratorFieldData]> | undefined>
  ): void =>
    void internalState.mappingLineData.push({
      customSelectSubtype,
      selectLabel: model.label,
      fieldsData: Object.fromEntries(filterArray(fieldsData)),
      tableName: model.name,
    });

  const lastPartIndex =
    mappingPath.slice(-1)[0] === '0'
      ? mappingPath.length - 1
      : mappingPath.length - 2;

  const callbacks: NavigationCallbacks = {
    getNextDirection() {
      if (internalState.position > lastPartIndex) return undefined;

      internalState.position += 1;
      const nextPart = mappingPath[internalState.position];
      internalState.parsedDefaultValue = valueIsPartialField(nextPart)
        ? parsePartialField(nextPart)
        : [nextPart, undefined];
      internalState.defaultValue = nextPart;

      const localMappingPath = mappingPath.slice(0, internalState.position);
      internalState.mappedFields = getMappedFields?.(localMappingPath) ?? [];

      return {
        partName: nextPart,
        fieldName:
          valueIsTreeRank(nextPart) || valueIsToManyIndex(nextPart)
            ? mappingPath[internalState.position - 1]
            : nextPart,
      };
    },

    handleToManyChildren({ model, parentRelationship }) {
      const maxMappedElementNumber = getMaxToManyIndex([
        ...internalState.mappedFields,
        internalState.defaultValue,
      ]);

      const isToOne = parentRelationship?.type === 'zero-to-one';
      const toManyLimit = isToOne ? 1 : Number.POSITIVE_INFINITY;
      const additional =
        maxMappedElementNumber < toManyLimit
          ? [[formatToManyIndex(maxMappedElementNumber + 1), commonText('add')]]
          : [];

      commitInstanceData(
        'toMany',
        model,
        generateFieldData === 'none'
          ? []
          : [
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
                      isRelationship: true,
                      isDefault,
                      tableName: model.name,
                    },
                  ]
                : undefined;
            })
      );
    },

    handleTreeRanks({ model }) {
      const defaultValue = getNameFromTreeRankName(internalState.defaultValue);

      commitInstanceData(
        'tree',
        model,
        generateFieldData === 'none' ||
          !hasTreeAccess(model.name as 'Geography', 'read')
          ? []
          : [
              scope === 'queryBuilder' &&
              (generateFieldData === 'all' ||
                internalState.defaultValue === formatTreeRank(anyTreeRank))
                ? [
                    formatTreeRank(anyTreeRank),
                    {
                      optionLabel: queryText('anyRank'),
                      isRelationship: true,
                      isDefault:
                        internalState.defaultValue ===
                        formatTreeRank(anyTreeRank),
                      isEnabled: !internalState.mappedFields.includes(
                        formatTreeRank(anyTreeRank)
                      ),
                      tableName: model.name,
                    },
                  ]
                : undefined,
              ...defined(
                getTreeDefinitionItems(model.name as 'Geography', false)
              ).map(({ name, title }) =>
                name === defaultValue || generateFieldData === 'all'
                  ? ([
                      formatTreeRank(name),
                      {
                        optionLabel: title ?? name,
                        isRelationship: true,
                        isDefault: name === defaultValue,
                        tableName: model.name,
                      },
                    ] as const)
                  : undefined
              ),
            ]
      );
    },

    handleSimpleFields: ({ model, parentRelationship }) =>
      commitInstanceData(
        'simple',
        model,
        generateFieldData === 'none'
          ? []
          : [
              scope === 'queryBuilder' &&
              ((generateFieldData === 'all' &&
                (!isTreeModel(model.name) ||
                  mappingPath[internalState.position - 1] ==
                    formatTreeRank(anyTreeRank) ||
                  queryBuilderTreeFields.has(formattedEntry))) ||
                internalState.defaultValue === formattedEntry)
                ? [
                    formattedEntry,
                    {
                      optionLabel: relationshipIsToMany(parentRelationship)
                        ? queryText('aggregated')
                        : queryText('formatted'),
                      tableName: model.name,
                      isRelationship: false,
                      isDefault: internalState.defaultValue === formattedEntry,
                      isEnabled:
                        !internalState.mappedFields.includes(formattedEntry),
                    },
                  ]
                : undefined,
              ...model.fields
                .filter(
                  (field) =>
                    (generateFieldData === 'all' ||
                      field.name === internalState.parsedDefaultValue[0]) &&
                    (!field.isRelationship ||
                      typeof parentRelationship === 'undefined' ||
                      (!isCircularRelationship(parentRelationship, field) &&
                        !(
                          relationshipIsToMany(field) &&
                          relationshipIsToMany(parentRelationship)
                        ))) &&
                    isFieldVisible(
                      showHiddenFields,
                      field.overrides.isHidden,
                      field.name
                    ) &&
                    // Display read only fields in query builder only
                    (scope === 'queryBuilder' || !field.overrides.isReadOnly) &&
                    // Hide most fields for non "any" tree ranks in query builder
                    (scope !== 'queryBuilder' ||
                      !isTreeModel(model.name) ||
                      mappingPath[internalState.position - 1] ==
                        formatTreeRank(anyTreeRank) ||
                      queryBuilderTreeFields.has(field.name))
                )
                .flatMap((field) => {
                  const fieldData = {
                    optionLabel: field.label,
                    // Enable field
                    isEnabled:
                      // If it is not mapped
                      !internalState.mappedFields.includes(field.name) ||
                      // Or is a relationship
                      field.isRelationship,
                    // All fields are optional in the query builder
                    isRequired:
                      scope !== 'queryBuilder' &&
                      field.overrides.isRequired &&
                      !mustMatchPreferences[model.name],
                    isHidden: field.overrides.isHidden,
                    isDefault: field.name === internalState.defaultValue,
                    isRelationship: field.isRelationship,
                    tableName: field.isRelationship
                      ? field.relatedModel.name
                      : undefined,
                  };
                  return scope === 'queryBuilder' && field.isTemporal()
                    ? Object.entries(dateParts)
                        .map(
                          ([datePart, label]) =>
                            [
                              formatPartialField(field.name, datePart),
                              {
                                ...fieldData,
                                optionLabel: `${fieldData.optionLabel}${
                                  datePart === 'fullDate' ? '' : ` (${label})`
                                }`,
                                isDefault:
                                  field.name ===
                                    internalState.parsedDefaultValue[0] &&
                                  datePart ===
                                    internalState.parsedDefaultValue[1],
                                isEnabled:
                                  fieldData.isEnabled &&
                                  !internalState.mappedFields.includes(
                                    formatPartialField(field.name, datePart)
                                  ),
                              },
                            ] as const
                        )
                        .filter(
                          ([_fieldName, fieldData]) =>
                            generateFieldData === 'all' || fieldData.isDefault
                        )
                    : ([[field.name, fieldData]] as const);
                }),
            ]
      ),
  };

  navigator({
    callbacks,
    baseTableName,
  });

  return internalState.mappingLineData;
}
