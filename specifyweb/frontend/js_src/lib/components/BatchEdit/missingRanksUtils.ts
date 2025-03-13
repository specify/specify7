import { f } from '../../utils/functools';
import type { RA, RR } from '../../utils/types';
import { defined, filterArray } from '../../utils/types';
import { group, sortFunction } from '../../utils/utils';
import type {
  AnyTree,
  FilterTablesByEndsWith,
  SerializedResource,
} from '../DataModel/helperTypes';
import type { LiteralField, Relationship } from '../DataModel/specifyField';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { strictGetTable } from '../DataModel/tables';
import {
  getTreeDefinitions,
  isTreeTable,
  strictGetTreeDefinitionItems,
} from '../InitialContext/treeRanks';
import type { QueryFieldSpec } from '../QueryBuilder/fieldSpec';
import { anyTreeRank } from '../WbPlanView/mappingHelpers';
import type { MissingRanks, TreeDefinitionName } from './MissingRanks';

const getTreeDefFromName = (
  rankName: string,
  treeDefItems: RA<SerializedResource<FilterTablesByEndsWith<'TreeDefItem'>>>
) =>
  defined(
    treeDefItems.find(
      (treeRank) => treeRank.name.toLowerCase() === rankName.toLowerCase()
    )
  );

export function findAllMissing(
  queryFieldSpecs: RA<QueryFieldSpec>
): MissingRanks {
  const treeFieldSpecs = group(
    filterArray(
      queryFieldSpecs.map((fieldSpec) =>
        isTreeTable(fieldSpec.table.name) &&
        fieldSpec.treeRank !== anyTreeRank &&
        fieldSpec.treeRank !== undefined
          ? [
              fieldSpec.table,
              { rank: fieldSpec.treeRank, field: fieldSpec.getField() },
            ]
          : undefined
      )
    )
  );

  return Object.fromEntries(
    treeFieldSpecs
      .map(([treeTable, treeRanks]) => [
        treeTable.name,
        findMissingRanks(treeTable, treeRanks),
      ])
      .filter(([_, rankData]) => Object.values(rankData).length > 0)
  );
}

// TODO: discuss if we need to add more of them, and if we need to add more of them for other table.
const requiredTreeFields: RA<keyof AnyTree['fields']> = ['name'] as const;

const nameExistsInRanks = (
  name: string,
  ranks: RA<SerializedResource<FilterTablesByEndsWith<'TreeDefItem'>>>
): boolean => ranks.some((rank) => rank.name === name);

function findMissingRanks(
  treeTable: SpecifyTable,
  treeRanks: RA<
    | { readonly rank: string; readonly field?: LiteralField | Relationship }
    | undefined
  >
): RR<TreeDefinitionName, RA<string>> {
  const allTreeDefItems = strictGetTreeDefinitionItems(
    treeTable.name as 'Geography',
    false,
    'all'
  );

  // Duplicates don't affect any logic here
  const currentTreeRanks = filterArray(
    treeRanks.map((treeRank) =>
      f.maybe(treeRank, ({ rank, field }) => ({
        specifyRank: getTreeDefFromName(rank, allTreeDefItems),
        field,
      }))
    )
  );

  const currentRanksSorted = Array.from(currentTreeRanks).sort(
    sortFunction(({ specifyRank: { rankId } }) => rankId)
  );

  const highestRank = currentRanksSorted[0];

  const treeDefinitions = getTreeDefinitions(
    treeTable.name as 'Geography',
    'all'
  );

  return Object.fromEntries(
    treeDefinitions
      .map(({ definition, ranks }) => [
        definition.name,
        findMissingRanksInTreeDefItems(
          ranks,
          treeTable.name,
          highestRank,
          currentTreeRanks
        ),
      ])
      .filter(([_, missingRanks]) => missingRanks.length > 0)
  );
}

type RankData = {
  readonly specifyRank: SerializedResource<
    FilterTablesByEndsWith<'TreeDefItem'>
  >;
  readonly field: LiteralField | Relationship | undefined;
};

const findMissingRanksInTreeDefItems = (
  treeDefItems: RA<SerializedResource<FilterTablesByEndsWith<'TreeDefItem'>>>,
  tableName: string,
  highestRank: RankData,
  currentTreeRanks: RA<RankData>
): RA<string> =>
  treeDefItems.flatMap(({ treeDef, rankId, name }) =>
    rankId < highestRank.specifyRank.rankId
      ? []
      : filterArray(
          requiredTreeFields.map((requiredField) =>
            currentTreeRanks.some(
              (rank) =>
                (rank.specifyRank.name === name &&
                  rank.field !== undefined &&
                  requiredField === rank.field.name &&
                  rank.specifyRank.treeDef === treeDef) ||
                !nameExistsInRanks(rank.specifyRank.name, treeDefItems)
            )
              ? undefined
              : `${name} - ${
                  defined(strictGetTable(tableName).getField(requiredField))
                    .label
                }`
          )
        )
  );
