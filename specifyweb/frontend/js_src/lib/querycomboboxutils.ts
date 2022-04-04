import { queryFieldFilters } from './components/querybuilderfieldinput';
import type { SpQuery, SpQueryField } from './datamodel';
import type { AnySchema } from './datamodelutils';
import type { SpecifyResource } from './legacytypes';
import { QueryFieldSpec } from './queryfieldspec';
import { idFromUrl } from './resource';
import { schema } from './schema';
import type { LiteralField, Relationship } from './specifyfield';
import type { SpecifyModel } from './specifymodel';
import { toTable, toTreeTable } from './specifymodel';
import type { RA } from './types';
import { userInformation } from './userinfo';

export function makeQueryComboBoxQuery({
  fieldName,
  value,
  treeData,
  typeSearch: { relatedModel },
  specialConditions,
}: {
  readonly fieldName: string;
  readonly value: string;
  readonly treeData: QueryComboBoxTreeData | undefined;
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
  query.set('countOnly', null);
  query.set('specifyUser', userInformation.resource_uri);
  query.set('isFavorite', false);
  query.set('ordinal', null);

  const formattedField = QueryFieldSpec.fromPath([
    relatedModel.name,
    ...fieldName.split('.'),
  ])
    .toSpQueryField()
    .set('isDisplay', false)
    .set('startValue', typeof treeData === 'object' ? `%${value}` : value)
    .set('operStart', queryFieldFilters.startsWith.id);
  formattedField.noBusinessRules = true;

  const searchField = QueryFieldSpec.fromPath([
    relatedModel.name,
    ...fieldName.split('.'),
  ])
    .toSpQueryField()
    .set('isDisplay', false)
    .set('startValue', typeof treeData === 'object' ? `%${value}` : value)
    .set('operStart', queryFieldFilters.startsWith.id);
  searchField.noBusinessRules = true;

  const displayField = QueryFieldSpec.fromPath([relatedModel.name])
    .toSpQueryField()
    .set('isDisplay', true)
    .set('sortType', 1)
    .set('operStart', 0);
  displayField.noBusinessRules = true;

  query.set('fields', [
    formattedField,
    searchField,
    displayField,
    ...specialConditions,
  ]);

  return query;
}

export function getQueryComboBoxConditions({
  resource,
  fieldName,
  collectionRelationships,
  treeData,
  subViewRelationship,
  typeSearch: { relatedModel },
}: {
  readonly resource: SpecifyResource<AnySchema>;
  readonly fieldName: string;
  readonly treeData: QueryComboBoxTreeData | undefined;
  readonly collectionRelationships: CollectionRelationships | undefined;
  readonly typeSearch: TypeSearch;
  readonly subViewRelationship: Relationship | undefined;
}): RA<SpecifyResource<SpQueryField>> {
  const fields: SpecifyResource<SpQueryField>[] = [];
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
      const lastTreeRankId = treeData?.treeRanks.slice(-1)[0].rankId ?? 0;

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
        `${relatedModel.tableId}..collectionRelTypeId`,
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

export type QueryComboBoxTreeData = {
  readonly lowestChildRank: number | undefined;
  readonly treeRanks: RA<{
    readonly rankId: number;
    readonly isEnforced: boolean;
  }>;
};

export type CollectionRelationships = {
  readonly left: RA<{
    readonly id: number;
    readonly collection: number | undefined;
  }>;
  readonly right: RA<{
    readonly id: number;
    readonly collection: number | undefined;
  }>;
};

export type TypeSearch = {
  readonly title: string;
  readonly searchFields: RA<LiteralField | Relationship>;
  readonly searchFieldsNames: RA<string>;
  readonly relatedModel: SpecifyModel;
  readonly dataObjectFormatter: string | undefined;
};
