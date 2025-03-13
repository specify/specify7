import { f } from '../../utils/functools';
import { RA, defined, filterArray, RR } from '../../utils/types';
import { group, sortFunction } from '../../utils/utils';
import {
  SerializedResource,
  FilterTablesByEndsWith,
  AnyTree,
} from '../DataModel/helperTypes';
import { LiteralField, Relationship } from '../DataModel/specifyField';
import { SpecifyTable } from '../DataModel/specifyTable';
import { strictGetTable } from '../DataModel/tables';
import {
  isTreeTable,
  strictGetTreeDefinitionItems,
  getTreeDefinitions,
} from '../InitialContext/treeRanks';
import { QueryFieldSpec } from '../QueryBuilder/fieldSpec';
import { anyTreeRank } from '../WbPlanView/mappingHelpers';
import { MissingRanks, TreeDefinitionName } from './MissingRanks';

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
  specifyRank: SerializedResource<FilterTablesByEndsWith<'TreeDefItem'>>;
  field: LiteralField | Relationship | undefined;
};

const findMissingRanksInTreeDefItems = (
  treeDefItems: RA<SerializedResource<FilterTablesByEndsWith<'TreeDefItem'>>>,
  tableName: string,
  highestRank: RankData,
  currentTreeRanks: RA<RankData>
): RA<string> => {
  return treeDefItems.flatMap(({ treeDef, rankId, name }) =>
    rankId < highestRank.specifyRank.rankId
      ? []
      : filterArray(
          requiredTreeFields.map((requiredField) => {
            return currentTreeRanks.some(
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
                }`;
          })
        )
  );
};
