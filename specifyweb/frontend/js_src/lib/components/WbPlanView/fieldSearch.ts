import { commonText } from '../../localization/common';
import { queryText } from '../../localization/query';
import type { RA } from '../../utils/types';
import type { Relationship } from '../DataModel/specifyField';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { strictGetTable } from '../DataModel/tables';
import type { Tables } from '../DataModel/types';
import { getTreeDefinitions, isTreeTable } from '../InitialContext/treeRanks';
import { hasTablePermission, hasTreeAccess } from '../Permissions/helpers';
import type { MappingPath } from './Mapper';
import {
  anyTreeRank,
  formatPartialField,
  formatToManyIndex,
  formatTreeDefinition,
  formatTreeRank,
  formattedEntry,
  relationshipIsRemoteToOne,
  relationshipIsToMany,
  valueIsTreeMeta,
} from './mappingHelpers';
import type { NavigatorSpec } from './navigatorSpecs';

export type FieldSearchResult = {
  readonly mappingPath: MappingPath;
  readonly label: string;
  readonly isHidden: boolean;
  readonly joinCount: number;
  readonly tableName: keyof Tables;
  readonly searchRank: number;
};

const fieldSearchDepthLimit = 6;
const fieldSearchResultLimit = 500;
const fieldSearchVisitedStateLimit = 10_000;
// There are some tables that should not be searchable.
const fieldSearchExcludedTables: ReadonlySet<keyof Tables> = new Set([
  'SpecifyUser',
  'Workbench',
]);

type FieldSearchPathPreference = {
  readonly baseTableName: keyof Tables;
  readonly path: readonly string[];
  readonly priority: number;
};

// Lower priorities are shown first. Keep all matching paths; these only affect
// ordering. Paths omit to-many indexes and special mapping fields.
const fieldSearchPathPreferences: readonly FieldSearchPathPreference[] = [
  {
    baseTableName: 'CollectionObject',
    path: ['collectingEvent', 'collectors'],
    priority: -100,
  },
  {
    baseTableName: 'CollectionObject',
    path: ['cataloger', 'collectors'],
    priority: 100,
  },
];

const fieldSearchLabel = (value: unknown): string => `${value}`;

const normalizeFieldSearchPath = (path: MappingPath): readonly string[] =>
  path.filter(
    (part) =>
      !part.startsWith('#') && !part.startsWith('$') && part !== formattedEntry
  );

const getFieldSearchPathPriority = (
  baseTableName: keyof Tables,
  mappingPath: MappingPath
): number => {
  const normalizedPath = normalizeFieldSearchPath(mappingPath);
  return (
    fieldSearchPathPreferences.find(
      ({ baseTableName: preferenceBaseTableName, path }) =>
        preferenceBaseTableName === baseTableName &&
        path.every((part, index) => normalizedPath[index] === part)
    )?.priority ?? 0
  );
};

/** Find selectable fields in downstream relationships in join order. */
export function searchFields({
  baseTableName,
  limit = fieldSearchResultLimit,
  offset = 0,
  search,
  showHiddenFields = false,
  spec,
}: {
  readonly baseTableName: keyof Tables;
  readonly limit?: number;
  readonly offset?: number;
  readonly search: string;
  readonly showHiddenFields?: boolean;
  readonly spec: NavigatorSpec;
}): RA<FieldSearchResult> {
  const normalizedSearch = search.trim().toLocaleLowerCase();
  if (
    normalizedSearch.length === 0 ||
    limit <= 0 ||
    fieldSearchExcludedTables.has(baseTableName)
  )
    return [];

  type QueueItem = {
    readonly table: SpecifyTable;
    readonly mappingPath: MappingPath;
    readonly tablePath: readonly string[];
    readonly relationshipLabels: readonly string[];
    readonly relationshipNames: readonly string[];
    readonly isHidden: boolean;
    readonly joinCount: number;
  };

  const queue: QueueItem[] = [
    {
      table: strictGetTable(baseTableName),
      mappingPath: [],
      tablePath: [baseTableName],
      relationshipLabels: [],
      relationshipNames: [],
      isHidden: false,
      joinCount: 0,
    },
  ];
  const results: FieldSearchResult[] = [];
  let queueIndex = 0;
  let visitedStateCount = 0;

  const addResult = (result: FieldSearchResult): void => {
    results.push(result);
  };

  const matches = (values: readonly string[]): boolean =>
    values.some((value) =>
      value.toLocaleLowerCase().includes(normalizedSearch)
    );

  while (
    queueIndex < queue.length &&
    visitedStateCount < fieldSearchVisitedStateLimit
  ) {
    const current = queue[queueIndex++]!;
    visitedStateCount += 1;
    const fields = [current.table.idField, ...current.table.fields];

    fields.forEach((field) => {
      if (
        field.isVirtual ||
        field.isRelationship ||
        isTreeTable(current.table.name)
      )
        return;
      const isHidden =
        current.isHidden ||
        (spec.useSchemaOverrides ? field.overrides.isHidden : field.isHidden);
      if (isHidden && !showHiddenFields) return;
      if (
        !spec.isNoRestrictions() &&
        !spec.includeReadOnly &&
        field.overrides.isReadOnly
      )
        return;
      if (
        !matches([
          field.name,
          fieldSearchLabel(field.label),
          ...current.relationshipLabels,
          ...current.relationshipNames,
        ])
      )
        return;

      addResult({
        mappingPath: [
          ...current.mappingPath,
          field.isTemporal()
            ? formatPartialField(field.name, 'fullDate')
            : field.name,
        ],
        label: [
          ...current.relationshipLabels,
          field.name === current.table.idField.name
            ? commonText.id()
            : fieldSearchLabel(field.label),
        ].join(' → '),
        isHidden,
        joinCount: current.joinCount,
        tableName: current.table.name,
        searchRank: 1,
      });
    });

    if (
      isTreeTable(current.table.name) &&
      hasTreeAccess(current.table.name, 'read')
    ) {
      const definitions = getTreeDefinitions(current.table.name, 'all') ?? [];
      definitions.forEach(({ definition, ranks }) => {
        const definitionPath =
          spec.useSpecificTreeInterface && definitions.length > 1
            ? [formatTreeDefinition(definition.name)]
            : [];
        ranks.slice(1).forEach((rank) => {
          const rankLabel = fieldSearchLabel(rank.title ?? rank.name);
          const rankMatches = matches([rank.name, rankLabel]);

          // A field-name match applies to every rank. Use one canonical path
          // instead of returning the same field once for every concrete rank.
          if (!rankMatches && rank !== ranks[1]) return;

          const rankPath = [
            ...current.mappingPath,
            ...definitionPath,
            formatTreeRank(rankMatches ? rank.name : anyTreeRank),
          ];

          current.table.fields
            .filter((field) => !field.isVirtual && !field.isRelationship)
            .filter((field) => {
              const isHidden =
                current.isHidden ||
                (spec.useSchemaOverrides
                  ? field.overrides.isHidden
                  : field.isHidden);
              if (isHidden && !showHiddenFields) return false;
              if (
                !spec.isNoRestrictions() &&
                !spec.includeReadOnly &&
                field.overrides.isReadOnly &&
                !(rankMatches && field.name === 'name')
              )
                return false;
              return rankMatches
                ? field.name === 'name'
                : matches([
                    field.name,
                    fieldSearchLabel(field.label),
                    ...current.relationshipLabels,
                    ...current.relationshipNames,
                  ]);
            })
            .forEach((field) => {
              const isHidden =
                current.isHidden ||
                (spec.useSchemaOverrides
                  ? field.overrides.isHidden
                  : field.isHidden);
              addResult({
                mappingPath: [...rankPath, field.name],
                label: [
                  ...current.relationshipLabels,
                  ...(rankMatches
                    ? [rankLabel]
                    : [fieldSearchLabel(field.label)]),
                ].join(' → '),
                isHidden,
                joinCount: current.joinCount,
                tableName: current.table.name,
                searchRank: rankMatches ? 0 : 1,
              });
            });
        });
      });
    }

    if (current.joinCount >= fieldSearchDepthLimit) continue;

    current.table.fields
      .filter((field): field is Relationship => field.isRelationship)
      .filter((relationship) => {
        // Someday when we support virtual fields in the Query Builder,
        // this should be re-enabled.
        if (
          relationship.isVirtual ||
          fieldSearchExcludedTables.has(relationship.relatedTable.name)
        )
          return false;
        const isHidden = current.isHidden || relationship.overrides.isHidden;
        if (isHidden && !showHiddenFields) return false;
        if (
          !spec.isNoRestrictions() &&
          !spec.includeReadOnly &&
          relationship.overrides.isReadOnly
        )
          return false;
        const permission = spec.ensurePermission();
        const relatedName = relationship.relatedTable.name;
        if (
          spec.hasActionPermission() &&
          permission !== undefined &&
          (isTreeTable(relatedName)
            ? !hasTreeAccess(relatedName, permission)
            : !hasTablePermission(relatedName, permission))
        )
          return false;
        if (
          !spec.allowNestedToMany &&
          (relationshipIsToMany(relationship) ||
            relationshipIsRemoteToOne(relationship)) &&
          current.mappingPath.some((part) => part.startsWith('#'))
        )
          return false;
        if (
          !spec.includeToManyToTree &&
          (relationshipIsToMany(relationship) ||
            relationshipIsRemoteToOne(relationship)) &&
          isTreeTable(relationship.relatedTable.name)
        )
          return false;
        return (
          !isTreeTable(current.table.name) || spec.includeRelationshipsFromTree
        );
      })
      .forEach((relationship) => {
        const relationshipIsToManyField =
          relationshipIsToMany(relationship) ||
          relationshipIsRemoteToOne(relationship);
        const treeRankPath =
          isTreeTable(current.table.name) &&
          !valueIsTreeMeta(current.mappingPath.at(-1))
            ? [formatTreeRank(anyTreeRank)]
            : [];
        const relationshipPath = [
          ...current.mappingPath,
          ...treeRankPath,
          relationship.name,
          ...(relationshipIsToManyField ? [formatToManyIndex(1)] : []),
        ];
        if (matches([relationship.name, fieldSearchLabel(relationship.label)]))
          addResult({
            mappingPath: [
              ...relationshipPath,
              ...(isTreeTable(relationship.relatedTable.name)
                ? [formatTreeRank(anyTreeRank)]
                : []),
              formattedEntry,
            ],
            label: [
              ...current.relationshipLabels,
              fieldSearchLabel(relationship.label),
              relationshipIsToManyField
                ? queryText.aggregatedInline()
                : queryText.formattedInline(),
            ].join(' → '),
            isHidden: current.isHidden || relationship.overrides.isHidden,
            joinCount: current.joinCount + 1,
            tableName: relationship.relatedTable.name,
            searchRank: 1,
          });

        // Return matching self-referential relationships, but do not traverse
        // through them or the search could revisit the same table forever.
        if (current.tablePath.includes(relationship.relatedTable.name)) return;

        queue.push({
          table: relationship.relatedTable,
          mappingPath: relationshipPath,
          tablePath: [...current.tablePath, relationship.relatedTable.name],
          relationshipLabels: [
            ...current.relationshipLabels,
            fieldSearchLabel(relationship.label),
          ],
          relationshipNames: [...current.relationshipNames, relationship.name],
          isHidden: current.isHidden || relationship.overrides.isHidden,
          joinCount: current.joinCount + 1,
        });
      });
  }

  const specialPath = ['determinations', 'taxon'];
  return results
    .sort((a, b) => {
      const hiddenOrder = Number(a.isHidden) - Number(b.isHidden);
      if (hiddenOrder !== 0) return hiddenOrder;
      const depthOrder = a.joinCount - b.joinCount;
      if (depthOrder !== 0) return depthOrder;
      const pathPriorityOrder =
        getFieldSearchPathPriority(baseTableName, a.mappingPath) -
        getFieldSearchPathPriority(baseTableName, b.mappingPath);
      if (pathPriorityOrder !== 0) return pathPriorityOrder;
      const searchRankOrder = a.searchRank - b.searchRank;
      if (searchRankOrder !== 0) return searchRankOrder;
      const specialOrder = (path: MappingPath): number =>
        baseTableName === 'CollectionObject' &&
        path.includes(specialPath[0]) &&
        path.includes(specialPath[1])
          ? 0
          : 1;
      return (
        specialOrder(a.mappingPath) - specialOrder(b.mappingPath) ||
        a.label.localeCompare(b.label)
      );
    })
    .slice(offset, offset + Math.min(limit, fieldSearchResultLimit));
}
