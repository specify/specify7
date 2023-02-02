/**
 * Helpful methods for navigating though schema across a certain mapping path.
 * Helps define information needed to display WbPlanView components
 *
 * @module
 */

import { commonText } from '../../localization/common';
import { queryText } from '../../localization/query';
import type { IR, RA, WritableArray } from '../../utils/types';
import { defined, filterArray } from '../../utils/types';
import { dateParts } from '../Atoms/Internationalization';
import { getFrontEndOnlyFields, strictGetModel } from '../DataModel/schema';
import type { Relationship } from '../DataModel/specifyField';
import type { SpecifyModel } from '../DataModel/specifyModel';
import type { Tables } from '../DataModel/types';
import {
  isTreeModel,
  strictGetTreeDefinitionItems,
} from '../InitialContext/treeRanks';
import {
  hasPermission,
  hasTablePermission,
  hasTreeAccess,
} from '../Permissions/helpers';
import type { CustomSelectSubtype } from './CustomSelectElement';
import type {
  HtmlGeneratorFieldData,
  MappingElementProps,
} from './LineComponents';
import type { MappingPath } from './Mapper';
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
} from './mappingHelpers';
import { getMaxToManyIndex, isCircularRelationship } from './modelHelpers';
import { userPreferences } from '../Preferences/userPreferences';

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
  // Handles field and relationships
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
  recursivePayload,
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
  readonly baseTableName: string | undefined;
}): void {
  const {
    model = strictGetModel(
      defined(baseTableName, 'navigator() called withouth baseTableName')
    ),
    parentRelationship = undefined,
    parentPartName = '',
  } = recursivePayload ?? {};

  const next = callbacks.getNextDirection(model);
  if (next === undefined) return;

  const childrenAreToManyElements =
    relationshipIsToMany(parentRelationship) &&
    !valueIsToManyIndex(parentPartName) &&
    !valueIsTreeRank(parentPartName);

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
      baseTableName: undefined,
    });
}

export function getTableFromMappingPath(
  baseTableName: keyof Tables,
  mappingPath: MappingPath
): keyof Tables {
  if (mappingPath.length === 0) return baseTableName;
  const fieldName = valueIsPartialField(mappingPath.at(-1)!)
    ? parsePartialField(mappingPath.at(-1)!)[0]
    : mappingPath.at(-1)!;
  const fieldPath = getGenericMappingPath([
    ...mappingPath.slice(0, -1),
    fieldName,
  ]).join('.');
  if (fieldPath.length === 0) return baseTableName;
  const field = strictGetModel(baseTableName).strictGetField(fieldPath);
  return (field.isRelationship ? field.relatedModel : field.model).name;
}

export type MappingLineData = Pick<
  MappingElementProps,
  'customSelectSubtype' | 'fieldsData' | 'selectLabel' | 'tableName'
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
  readonly generateFieldData: 'all' | 'none' | 'selectedOnly';
  readonly getMappedFields?: (mappingPath: MappingPath) => RA<string>;
  readonly showHiddenFields?: boolean;
  readonly mustMatchPreferences?: IR<boolean>;
  // WbPlanView has readOnly fields removed
  readonly scope?: 'queryBuilder' | 'wbPlanView';
}): RA<MappingLineData> {
  const isNoRestrictionsMode =
    scope === 'queryBuilder'
      ? userPreferences.get('queryBuilder', 'general', 'noRestrictionsMode')
      : userPreferences.get('workBench', 'wbPlanView', 'noRestrictionsMode');
  const internalState: {
    // eslint-disable-next-line functional/prefer-readonly-type
    position: number;
    readonly mappingLineData: WritableArray<MappingLineData>;
    // eslint-disable-next-line functional/prefer-readonly-type
    mappedFields: RA<string>;
    // eslint-disable-next-line functional/prefer-readonly-type
    defaultValue: string;
    // eslint-disable-next-line functional/prefer-readonly-type
    parsedDefaultValue: readonly [fieldName: string, part: string | undefined];
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
    fieldsData: RA<readonly [string, HtmlGeneratorFieldData] | undefined>
  ): void =>
    void internalState.mappingLineData.push({
      customSelectSubtype,
      selectLabel: model.label,
      fieldsData: Object.fromEntries(filterArray(fieldsData)),
      tableName: model.name,
    });

  const lastPartIndex =
    mappingPath.at(-1) === '0'
      ? mappingPath.length - 1
      : mappingPath.length - 2;

  /*
   * If user doesn't have upload a data set, there is no need to remove
   * tables without create access from the mapper
   */
  const canDoWbUpload = hasPermission('/workbench/dataset', 'upload');
  /*
   * Similar for the query builder: if can't run a query, no need to remove
   * tables without read access
   */
  const canExecuteQuery = hasPermission('/querybuilder/query', 'execute');

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
          ? [[formatToManyIndex(maxMappedElementNumber + 1), commonText.add()]]
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
                      optionLabel: queryText.anyRank(),
                      isRelationship: true,
                      isDefault:
                        internalState.defaultValue ===
                        formatTreeRank(anyTreeRank),
                      isEnabled: true,
                      tableName: model.name,
                    },
                  ]
                : undefined,
              ...strictGetTreeDefinitionItems(
                model.name as 'Geography',
                false
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

    // REFACTOR: make this more readable
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
                  mappingPath[internalState.position - 1] ===
                    formatTreeRank(anyTreeRank) ||
                  queryBuilderTreeFields.has(formattedEntry))) ||
                internalState.defaultValue === formattedEntry)
                ? [
                    formattedEntry,
                    {
                      optionLabel: relationshipIsToMany(parentRelationship)
                        ? queryText.aggregatedInline()
                        : queryText.formattedInline(),
                      tableName: model.name,
                      isRelationship: false,
                      isDefault: internalState.defaultValue === formattedEntry,
                      isEnabled:
                        !internalState.mappedFields.includes(formattedEntry),
                    },
                  ]
                : undefined,
              /*
               * Add ID field to the list if it is selected or hidden fields
               * are visible
               */
              internalState.defaultValue === model.idField.name ||
              (generateFieldData === 'all' &&
                isFieldVisible(
                  showHiddenFields,
                  model.idField.isHidden,
                  model.idField.name
                ))
                ? [
                    model.idField.name,
                    {
                      optionLabel: commonText.id(),
                      tableName: model.name,
                      isRelationship: false,
                      isDefault:
                        internalState.defaultValue === model.idField.name,
                      isEnabled: !internalState.mappedFields.includes(
                        model.idField.name
                      ),
                      isHidden: true,
                    },
                  ]
                : undefined,
              ...model.fields
                .filter(
                  (field) =>
                    (generateFieldData === 'all' ||
                      field.name === internalState.parsedDefaultValue[0]) &&
                    (!field.isRelationship ||
                      parentRelationship === undefined ||
                      (!isCircularRelationship(parentRelationship, field) &&
                        /*
                         * Hide nested -to-many relationships as they are not
                         * supported by the WorkBench
                         */
                        (scope === 'queryBuilder' ||
                          !(
                            relationshipIsToMany(field) &&
                            relationshipIsToMany(parentRelationship)
                          )))) &&
                    isFieldVisible(
                      showHiddenFields,
                      scope === 'queryBuilder'
                        ? field.isHidden
                        : field.overrides.isHidden,
                      field.name
                    ) &&
                    (!field.isRelationship ||
                      (scope === 'queryBuilder'
                        ? !canExecuteQuery ||
                          (isTreeModel(model.name)
                            ? hasTreeAccess(model.name, 'read')
                            : hasTablePermission(
                                field.relatedModel.name,
                                'read'
                              )) ||
                          userPreferences.get(
                            'queryBuilder',
                            'general',
                            'showNoReadTables'
                          )
                        : !canDoWbUpload ||
                          (isTreeModel(model.name)
                            ? hasTreeAccess(model.name, 'create')
                            : hasTablePermission(
                                field.relatedModel.name,
                                'create'
                              )) ||
                          userPreferences.get(
                            'workBench',
                            'wbPlanView',
                            'showNoAccessTables'
                          ))) &&
                    /*
                     * Hide relationship from tree tables in WbPlanView as they
                     * are not supported by the WorkBench
                     */
                    (scope === 'queryBuilder' ||
                      !field.isRelationship ||
                      !isTreeModel(model.name)) &&
                    /*
                     * Hide -to-many relationships to a tree table as they are
                     * not supported by the WorkBench
                     */
                    (scope === 'queryBuilder' ||
                      !field.isRelationship ||
                      !relationshipIsToMany(field) ||
                      !isTreeModel(field.relatedModel.name)) &&
                    (isNoRestrictionsMode ||
                      // Display read only fields in query builder only
                      scope === 'queryBuilder' ||
                      !field.overrides.isReadOnly) &&
                    // Hide most fields for non "any" tree ranks in query builder
                    (scope !== 'queryBuilder' ||
                      !isTreeModel(model.name) ||
                      mappingPath[internalState.position - 1] ===
                        formatTreeRank(anyTreeRank) ||
                      queryBuilderTreeFields.has(field.name)) &&
                    getFrontEndOnlyFields()[model.name]?.includes(
                      field.name
                    ) !== true
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
                      !mustMatchPreferences[model.name] &&
                      // Relationships to system tables are not required by the uploader
                      (!field.isRelationship ||
                        !field.relatedModel.overrides.isSystem),
                    isHidden:
                      scope === 'queryBuilder'
                        ? field.isHidden
                        : field.overrides.isHidden,
                    isDefault: field.name === internalState.defaultValue,
                    isRelationship: field.isRelationship,
                    tableName: field.isRelationship
                      ? field.relatedModel.name
                      : undefined,
                  };
                  return scope === 'queryBuilder' && field.isTemporal()
                    ? Object.entries({
                        fullDate: commonText.fullDate(),
                        ...dateParts,
                      })
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
