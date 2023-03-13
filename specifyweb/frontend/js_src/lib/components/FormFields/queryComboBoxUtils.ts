import type { RA, WritableArray } from '../../utils/types';
import { toTable, toTreeTable } from '../DataModel/helpers';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { idFromUrl } from '../DataModel/resource';
import { schema } from '../DataModel/schema';
import type { LiteralField, Relationship } from '../DataModel/specifyField';
import type { SpecifyModel } from '../DataModel/specifyModel';
import type { SpQuery, SpQueryField } from '../DataModel/types';
import { userInformation } from '../InitialContext/userInformation';
import { queryFieldFilters } from '../QueryBuilder/FieldFilter';
import { QueryFieldSpec } from '../QueryBuilder/fieldSpec';
import { flippedSortTypes } from '../QueryBuilder/helpers';
import { getUserPref } from '../UserPreferences/helpers';
import type { CollectionRelationships } from './useCollectionRelationships';
import type { QueryComboBoxTreeData } from './useTreeData';

export function makeComboBoxQuery({
  fieldName,
  value,
  isTreeTable,
  typeSearch: { relatedModel },
  specialConditions,
}: {
  readonly fieldName: string;
  readonly value: string;
  readonly isTreeTable: boolean;
  readonly typeSearch: TypeSearch;
  readonly specialConditions: RA<SpecifyResource<SpQueryField>>;
}): SpecifyResource<SpQuery> {
  const query = new schema.models.SpQuery.Resource(
    {},
    { noBusinessRules: true }
  );
  query.set('name', 'Ephemeral QueryCBX query');
  query.set('contextName', relatedModel.name);
  query.set('contextTableId', relatedModel.tableId);
  query.set('selectDistinct', false);
  query.set('countOnly', false);
  query.set('specifyUser', userInformation.resource_uri);
  query.set('isFavorite', false);
  query.set('ordinal', null);

  const searchAlgorithm = getUserPref(
    'form',
    'queryComboBox',
    isTreeTable ? 'treeSearchAlgorithm' : 'searchAlgorithm'
  );
  const searchField = QueryFieldSpec.fromPath(
    relatedModel.name,
    fieldName.split('.')
  )
    .toSpQueryField()
    .set('isDisplay', false)
    .set('startValue', searchAlgorithm === 'contains' ? `%${value}%` : value)
    .set(
      'operStart',
      searchAlgorithm === 'contains'
        ? queryFieldFilters.like.id
        : queryFieldFilters.startsWith.id
    );

  const displayField = QueryFieldSpec.fromPath(relatedModel.name, [])
    .toSpQueryField()
    .set('isDisplay', true)
    .set('sortType', flippedSortTypes.ascending);

  query.set('fields', [searchField, displayField, ...specialConditions]);

  return query;
}

export function getQueryComboBoxConditions({
  resource,
  fieldName,
  collectionRelationships,
  treeData,
  subViewRelationship,
  relatedTable,
}: {
  readonly resource: SpecifyResource<AnySchema>;
  readonly fieldName: string;
  readonly treeData: QueryComboBoxTreeData | undefined;
  readonly collectionRelationships: CollectionRelationships | undefined;
  readonly relatedTable: SpecifyModel;
  readonly subViewRelationship: Relationship | undefined;
}): RA<SpecifyResource<SpQueryField>> {
  const fields: WritableArray<SpecifyResource<SpQueryField>> = [];
  const treeResource = toTreeTable(resource);
  if (typeof treeResource === 'object') {
    const tableId = resource.specifyModel.tableId;
    // Add not-a-descendant condition
    if (!treeResource.isNew())
      fields.push(
        QueryFieldSpec.fromStringId(`${tableId}..nodeNumber`, false)
          .toSpQueryField()
          .set('isDisplay', false)
          .set('isNot', true)
          .set('operStart', queryFieldFilters.between.id)
          .set(
            'startValue',
            [
              treeResource.get('nodeNumber') ?? '',
              treeResource.get('highestChildNodeNumber') ?? '',
            ].join(',')
          )
      );
    if (fieldName === 'parent') {
      // Add rank limits
      let nextRankId = 0;
      if (typeof treeData === 'object') {
        let rankIndex =
          treeData.treeRanks.findIndex(
            // "rankId" is the original value; not updated with unsaved changes
            ({ rankId }) => rankId === treeResource.get('rankId')
          ) + 1;
        if (rankIndex !== 0) {
          while (
            rankIndex < treeData.treeRanks.length &&
            !treeData.treeRanks[rankIndex].isEnforced
          )
            rankIndex += 1;
          nextRankId = treeData.treeRanks[rankIndex - 1].rankId;
        }
      }
      const lastTreeRankId = treeData?.treeRanks.at(-1)!.rankId ?? 0;

      const lowestRankId = Math.min(
        lastTreeRankId,
        nextRankId || lastTreeRankId,
        treeData?.lowestChildRank ?? lastTreeRankId
      );
      if (lowestRankId !== 0)
        fields.push(
          QueryFieldSpec.fromStringId(`${tableId}..rankId`, false)
            .toSpQueryField()
            .set('isDisplay', false)
            .set('startValue', lowestRankId.toString())
            .set('operStart', queryFieldFilters.less.id)
        );
    } else if (fieldName === 'acceptedParent') {
      // Nothing to do
    } else if (fieldName === 'hybridParent1' || fieldName === 'hybridParent2') {
      // Nothing to do
    }
  }

  if (
    typeof collectionRelationships === 'object' &&
    fieldName === 'collectionRelType'
  )
    // Add condition for current collection
    fields.push(
      QueryFieldSpec.fromStringId(
        `${relatedTable.tableId}..collectionRelTypeId`,
        true
      )
        .toSpQueryField()
        .set('isDisplay', false)
        .set('operStart', queryFieldFilters.in.id)
        .set(
          'startValue',
          collectionRelationships[
            subViewRelationship?.name === 'leftSideRels' ? 'left' : 'right'
          ]
            .map(({ id }) => id)
            .join(',')
        )
    );
  return fields;
}

export const getRelatedCollectionId = (
  { left, right }: CollectionRelationships,
  resource: SpecifyResource<AnySchema>,
  fieldName: string
): number | undefined =>
  (fieldName === 'rightSide'
    ? left
    : fieldName === 'leftSide'
    ? right
    : undefined
  )?.find(
    ({ id }) =>
      id ===
      idFromUrl(
        toTable(resource, 'CollectionRelationship')?.get('collectionRelType') ??
          ''
      )
  )?.collection;

export type TypeSearch = {
  readonly title: string;
  readonly searchFields: RA<RA<LiteralField | Relationship>>;
  readonly relatedModel: SpecifyModel;
  readonly dataObjectFormatter: string | undefined;
};
