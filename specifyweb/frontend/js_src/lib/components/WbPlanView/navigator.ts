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
import type { AnyTree } from '../DataModel/helperTypes';
import type { Relationship } from '../DataModel/specifyField';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { getFrontEndOnlyFields, strictGetTable } from '../DataModel/tables';
import type { Tables } from '../DataModel/types';
import { getTreeDefinitions, isTreeTable } from '../InitialContext/treeRanks';
import { hasTablePermission, hasTreeAccess } from '../Permissions/helpers';
import type { CustomSelectSubtype } from './CustomSelectElement';
import type {
  HtmlGeneratorFieldData,
  MappingElementProps,
} from './LineComponents';
import type { MappingPath } from './Mapper';
import {
  anyTreeRank,
  emptyMapping,
  formatPartialField,
  formattedEntry,
  formatToManyIndex,
  formatTreeDefinition,
  formatTreeRank,
  getGenericMappingPath,
  getNameFromTreeDefinitionName,
  getNameFromTreeRankName,
  parsePartialField,
  relationshipIsToMany,
  valueIsPartialField,
  valueIsToManyIndex,
  valueIsTreeDefinition,
  valueIsTreeMeta,
} from './mappingHelpers';
import { getMaxToManyIndex, isCircularRelationship } from './modelHelpers';
import type { NavigatorSpec } from './navigatorSpecs';

type NavigationCallbackPayload = {
  readonly table: SpecifyTable;
  readonly parentRelationship?: Relationship;
};

type NavigationCallbacks = {
  // Should return undefined if next element does not exist
  readonly getNextDirection: (table: SpecifyTable) =>
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
  readonly handleToManyChildren: (
    callbackPayload: Readonly<NavigationCallbackPayload>
  ) => void;
  readonly handleTreeDefinitions: (
    callbackPayload: Readonly<NavigationCallbackPayload>
  ) => void;
  // Handles tree ranks children
  readonly handleTreeRanks: (
    callbackPayload: Readonly<NavigationCallbackPayload> & {
      readonly definitionName: string;
    }
  ) => void;
  // Handles field and relationships
  readonly handleSimpleFields: (
    callbackPayload: Readonly<NavigationCallbackPayload>
  ) => void;
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
  spec,
  callbacks,
  recursivePayload,
  baseTableName,
}: {
  readonly spec: NavigatorSpec;
  // Callbacks can be modified depending on the need to make navigator versatile
  readonly callbacks: NavigationCallbacks;
  // Used internally to make navigator call itself multiple times
  readonly recursivePayload?: {
    readonly table: SpecifyTable;
    readonly parentPartName: string;
    readonly parentRelationship?: Relationship;
  };
  readonly baseTableName: string | undefined;
}): void {
  const {
    table = strictGetTable(
      defined(baseTableName, 'navigator() called withouth baseTableName')
    ),
    parentRelationship = undefined,
    parentPartName = '',
  } = recursivePayload ?? {};

  const next = callbacks.getNextDirection(table);
  if (next === undefined) return;

  const childrenAreToManyElements =
    relationshipIsToMany(parentRelationship) &&
    !valueIsToManyIndex(parentPartName) &&
    !valueIsTreeMeta(parentPartName);

  const childrenAreRanks =
    isTreeTable(table.name) && !valueIsTreeMeta(parentPartName);

  const callbackPayload = {
    table,
    parentRelationship,
  };

  if (childrenAreToManyElements)
    callbacks.handleToManyChildren(callbackPayload);
  else if (childrenAreRanks) {
    const definitions = getTreeDefinitions(table.name, 'all');

    if (definitions.length > 1 && spec.useSpecificTreeInterface)
      callbacks.handleTreeDefinitions(callbackPayload);
    else
      callbacks.handleTreeRanks({
        ...callbackPayload,
        definitionName: spec.useSpecificTreeInterface
          ? (definitions[0].definition.name ?? anyTreeRank)
          : anyTreeRank,
      });
  } else if (valueIsTreeDefinition(parentPartName))
    callbacks.handleTreeRanks({
      ...callbackPayload,
      definitionName: getNameFromTreeDefinitionName(parentPartName),
    });
  else callbacks.handleSimpleFields(callbackPayload);

  const isSpecial =
    valueIsToManyIndex(next.partName) || valueIsTreeMeta(next.partName);

  const nextField = isSpecial
    ? parentRelationship
    : table.getField(next.fieldName);

  const nextTable = isSpecial
    ? table
    : typeof nextField === 'object' && nextField.isRelationship
      ? nextField.relatedTable
      : undefined;

  if (typeof nextTable === 'object' && nextField?.isRelationship !== false)
    navigator({
      spec,
      callbacks,
      recursivePayload: {
        table: nextTable,
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
  const field = strictGetTable(baseTableName).strictGetField(fieldPath);
  return (field.isRelationship ? field.relatedTable : field.table).name;
}

export type MappingLineData = Pick<
  MappingElementProps,
  'customSelectSubtype' | 'fieldsData' | 'selectLabel' | 'tableName'
> & {
  readonly defaultValue: string;
};

const queryBuilderTreeFields = new Set([
  'fullName',
  'author',
  'groupNumber',
  'geographyCode',
]);

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
  spec,
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
  readonly spec: NavigatorSpec;
}): RA<MappingLineData> {
  if (
    process.env.NODE_ENV !== 'production' &&
    mappingPath.includes(anyTreeRank)
  )
    throw new Error(
      'Mapping path should not contain anyTreeRank. ' +
        'You likely meant to use formatTreeRank(anyTreeRank) instead'
    );

  const isNoRestrictionsMode = spec.isNoRestrictions();
  const canDoAction = spec.hasActionPermission();
  const ensurePermission = spec.ensurePermission();

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
    defaultValue: emptyMapping,
    parsedDefaultValue: [emptyMapping, undefined],
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
    table: SpecifyTable,
    fieldsData: RA<readonly [string, HtmlGeneratorFieldData] | undefined>
  ): void =>
    void internalState.mappingLineData.push({
      customSelectSubtype,
      defaultValue: internalState.defaultValue,
      selectLabel: table.label,
      fieldsData: Object.fromEntries(filterArray(fieldsData)),
      tableName: table.name,
    });

  const lastPartIndex =
    mappingPath.at(-1) === emptyMapping
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
          valueIsTreeMeta(nextPart) || valueIsToManyIndex(nextPart)
            ? valueIsToManyIndex(mappingPath[internalState.position - 1])
              ? mappingPath[internalState.position - 2]
              : mappingPath[internalState.position - 1]
            : nextPart,
      };
    },

    handleToManyChildren({ table, parentRelationship }) {
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
        table,
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
                      tableName: table.name,
                    },
                  ]
                : undefined;
            })
      );
    },

    handleTreeDefinitions({ table }) {
      const defaultValue = getNameFromTreeDefinitionName(
        internalState.defaultValue
      );

      commitInstanceData(
        'tree',
        table,
        generateFieldData === 'none' ||
          !hasTreeAccess(table.name as AnyTree['tableName'], 'read')
          ? []
          : [
              spec.includeAnyTreeDefinition &&
              (generateFieldData === 'all' ||
                internalState.defaultValue ===
                  formatTreeDefinition(anyTreeRank))
                ? [
                    formatTreeDefinition(anyTreeRank),
                    {
                      optionLabel: queryText.anyTree(),
                      isRelationship: true,
                      isDefault:
                        internalState.defaultValue ===
                        formatTreeDefinition(anyTreeRank),
                      isEnabled: true,
                      tableName: table.name,
                    },
                  ]
                : undefined,
              ...(spec.includeSpecificTreeRanks
                ? getTreeDefinitions(
                    table.name as AnyTree['tableName'],
                    'all'
                  ).map(({ definition: { name } }) =>
                    name === defaultValue || generateFieldData === 'all'
                      ? ([
                          formatTreeDefinition(name),
                          {
                            optionLabel: name,
                            isRelationship: true,
                            isDefault: name === defaultValue,
                            tableName: table.name,
                          },
                        ] as const)
                      : undefined
                  )
                : []),
            ]
      );
    },

    handleTreeRanks({ table, definitionName }) {
      const defaultValue = getNameFromTreeRankName(internalState.defaultValue);

      commitInstanceData(
        'tree',
        table,
        generateFieldData === 'none' ||
          !hasTreeAccess(table.name as AnyTree['tableName'], 'read')
          ? []
          : [
              spec.includeAnyTreeRank &&
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
                      tableName: table.name,
                    },
                  ]
                : undefined,
              ...(spec.includeSpecificTreeRanks
                ? getTreeDefinitions(table.name as AnyTree['tableName'], 'all')
                    .filter(
                      ({ definition: { name } }) =>
                        definitionName === name ||
                        definitionName === anyTreeRank
                    )
                    .flatMap(({ ranks }) =>
                      // Exclude the root rank for each tree
                      ranks.slice(1).map(({ name, title }) =>
                        name === defaultValue || generateFieldData === 'all'
                          ? ([
                              formatTreeRank(name),
                              {
                                optionLabel: title ?? name,
                                isRelationship: true,
                                isDefault: name === defaultValue,
                                tableName: table.name,
                              },
                            ] as const)
                          : undefined
                      )
                    )
                : []),
            ]
      );
    },

    handleSimpleFields({ table, parentRelationship }) {
      if (generateFieldData === 'none') {
        commitInstanceData('simple', table, []);
        return;
      }

      const formatted =
        spec.includeFormattedAggregated &&
        (spec.includeRootFormattedAggregated ||
          internalState.mappingLineData.length > 0) &&
        ((generateFieldData === 'all' &&
          (!isTreeTable(table.name) ||
            mappingPath[internalState.position - 1] ===
              formatTreeRank(anyTreeRank) ||
            queryBuilderTreeFields.has(formattedEntry))) ||
          internalState.defaultValue === formattedEntry)
          ? ([
              formattedEntry,
              {
                optionLabel: relationshipIsToMany(parentRelationship)
                  ? queryText.aggregatedInline()
                  : queryText.formattedInline(),
                tableName: table.name,
                isRelationship: false,
                isDefault: internalState.defaultValue === formattedEntry,
                isEnabled: !internalState.mappedFields.includes(formattedEntry),
              },
            ] as const)
          : undefined;

      if (!spec.allowTransientToMany) {
        const isInToMany = internalState.mappingLineData.some(
          ({ customSelectSubtype }) => customSelectSubtype === 'toMany'
        );
        if (isInToMany) {
          commitInstanceData('simple', table, [formatted]);
          return;
        }
      }

      /*
       * Add ID field to the list if it is selected or hidden fields
       * are visible
       */
      const showId =
        internalState.defaultValue === table.idField.name ||
        (generateFieldData === 'all' &&
          isFieldVisible(
            showHiddenFields,
            table.idField.isHidden,
            table.idField.name
          ));
      const idField = showId
        ? ([
            table.idField.name,
            {
              optionLabel: commonText.id(),
              tableName: table.name,
              isRelationship: false,
              isDefault: internalState.defaultValue === table.idField.name,
              isEnabled: !internalState.mappedFields.includes(
                table.idField.name
              ),
              isHidden: true,
            },
          ] as const)
        : undefined;

      const fieldsData = [
        formatted,
        idField,
        ...table.fields
          .filter((field) => {
            let isIncluded = true;

            isIncluded &&=
              generateFieldData === 'all' ||
              field.name === internalState.parsedDefaultValue[0];

            isIncluded &&= isFieldVisible(
              showHiddenFields,
              spec.useSchemaOverrides
                ? field.overrides.isHidden
                : field.isHidden,
              field.name
            );

            isIncluded &&=
              isNoRestrictionsMode ||
              spec.includeReadOnly ||
              !field.overrides.isReadOnly;

            isIncluded &&=
              spec.includeAllTreeFields ||
              !isTreeTable(table.name) ||
              mappingPath[internalState.position - 1] ===
                formatTreeRank(anyTreeRank) ||
              queryBuilderTreeFields.has(field.name);

            // Hide frontend only field
            isIncluded &&= !(
              getFrontEndOnlyFields()[table.name]?.includes(field.name) ===
                true && field.name !== 'age'
            );

            if (field.isRelationship) {
              isIncluded &&=
                spec.allowNestedToMany ||
                parentRelationship === undefined ||
                (!isCircularRelationship(parentRelationship, field) &&
                  !(
                    relationshipIsToMany(field) &&
                    relationshipIsToMany(parentRelationship)
                  ));

              isIncluded &&=
                !canDoAction ||
                ensurePermission === undefined ||
                (isTreeTable(table.name)
                  ? hasTreeAccess(table.name, ensurePermission)
                  : hasTablePermission(
                      field.relatedTable.name,
                      ensurePermission
                    ));

              isIncluded &&=
                spec.includeRelationshipsFromTree || !isTreeTable(table.name);

              isIncluded &&=
                spec.includeToManyToTree ||
                /*
                 * Hide -to-many relationships to a tree table as they are
                 * not supported by the WorkBench
                 */
                !relationshipIsToMany(field) ||
                !isTreeTable(field.relatedTable.name);
            }

            return isIncluded;
          })
          .flatMap((field) => {
            const fieldData = {
              optionLabel: field.label,
              // Enable field
              isEnabled:
                // If it is not mapped
                !internalState.mappedFields.includes(field.name) ||
                // Or is a relationship
                field.isRelationship,
              isRequired:
                spec.enforceRequiredFields &&
                field.overrides.isRequired &&
                !mustMatchPreferences[table.name] &&
                // Relationships to system tables are not required by the uploader
                (!field.isRelationship ||
                  !field.relatedTable.overrides.isSystem),
              isHidden: spec.useSchemaOverrides
                ? field.overrides.isHidden
                : field.isHidden,
              isDefault: field.name === internalState.defaultValue,
              isRelationship: field.isRelationship,
              tableName: field.isRelationship
                ? field.relatedTable.name
                : undefined,
            };
            return spec.includePartialDates && field.isTemporal()
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
                            datePart === internalState.parsedDefaultValue[1],
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
      ] as const;
      commitInstanceData('simple', table, fieldsData);
    },
  };

  navigator({
    spec,
    callbacks,
    baseTableName,
  });

  const filtered = spec.includeToManyReferenceNumbers
    ? internalState.mappingLineData
    : internalState.mappingLineData.filter(
        ({ customSelectSubtype }) => customSelectSubtype !== 'toMany'
      );
  return spec.includeAnyTreeRank ||
    spec.includeAnyTreeDefinition ||
    spec.includeSpecificTreeRanks
    ? filtered
    : filtered.filter(
        ({ customSelectSubtype }) => customSelectSubtype !== 'tree'
      );
}
