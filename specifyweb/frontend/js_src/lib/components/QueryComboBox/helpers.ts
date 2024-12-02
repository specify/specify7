import type { RA, WritableArray } from '../../utils/types';
import { toTable, toTreeTable } from '../DataModel/helpers';
import type { AnySchema } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { idFromUrl, strictIdFromUrl } from '../DataModel/resource';
import type { Relationship } from '../DataModel/specifyField';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { tables } from '../DataModel/tables';
import type { SpQuery, SpQueryField } from '../DataModel/types';
import { getMainTableFields } from '../Formatters/formatters';
import { userInformation } from '../InitialContext/userInformation';
import { userPreferences } from '../Preferences/userPreferences';
import { queryFieldFilters } from '../QueryBuilder/FieldFilter';
import { QueryFieldSpec } from '../QueryBuilder/fieldSpec';
import { flippedSortTypes } from '../QueryBuilder/helpers';
import type { TypeSearch } from './spec';
import type { CollectionRelationships } from './useCollectionRelationships';
import type { QueryComboBoxTreeData } from './useTreeData';

export function makeComboBoxQuery({
  fieldName,
  value,
  isTreeTable,
  typeSearch: { table },
  specialConditions,
}: {
  readonly fieldName: string;
  readonly value: string;
  readonly isTreeTable: boolean;
  readonly typeSearch: TypeSearch;
  readonly specialConditions: RA<SpecifyResource<SpQueryField>>;
}): SpecifyResource<SpQuery> {
  const query = new tables.SpQuery.Resource({}, { noBusinessRules: true });
  query.set('name', 'Ephemeral QueryCBX query');
  query.set('contextName', table.name);
  query.set('contextTableId', table.tableId);
  query.set('selectDistinct', false);
  query.set('selectSeries', false);
  query.set('countOnly', false);
  query.set('specifyUser', userInformation.resource_uri);
  query.set('isFavorite', false);
  query.set('ordinal', null);

  const searchAlgorithm = userPreferences.get(
    'form',
    'queryComboBox',
    isTreeTable ? 'treeSearchAlgorithm' : 'searchAlgorithm'
  );
  const searchField = QueryFieldSpec.fromPath(table.name, fieldName.split('.'))
    .toSpQueryField()
    .set('isDisplay', false)
    .set('startValue', searchAlgorithm === 'contains' ? `%${value}%` : value)
    .set(
      'operStart',
      searchAlgorithm === 'contains'
        ? queryFieldFilters.like.id
        : queryFieldFilters.startsWith.id
    );

  const displayField = QueryFieldSpec.fromPath(table.name, [])
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
  treeDefinition,
}: {
  readonly resource: SpecifyResource<AnySchema>;
  readonly fieldName: string;
  readonly treeData: QueryComboBoxTreeData | undefined;
  readonly collectionRelationships: CollectionRelationships | undefined;
  readonly relatedTable: SpecifyTable;
  readonly subViewRelationship: Relationship | undefined;
  readonly treeDefinition: string | undefined;
}): RA<SpecifyResource<SpQueryField>> {
  const fields: WritableArray<SpecifyResource<SpQueryField>> = [];
  const treeResource = toTreeTable(resource);
  if (typeof treeResource === 'object') {
    const tableId = resource.specifyTable.tableId;
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
    resource.specifyTable === tables.Determination &&
    fieldName === 'fullName' &&
    treeDefinition !== undefined
  ) {
    fields.push(
      QueryFieldSpec.fromPath(tables.Taxon.name, ['definition', 'id'])
        .toSpQueryField()
        .set('isDisplay', false)
        .set('startValue', strictIdFromUrl(treeDefinition).toString())
        .set('operStart', queryFieldFilters.equal.id)
    );
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

/**
 * If some value is currently in the input field, try to figure out which
 * field it is intended for and populate that field in the new resource.
 * Most of the time, that field is determined based on the search field
 */
export function pendingValueToResource(
  relationship: Relationship,
  typeSearch: TypeSearch | false | undefined,
  pendingValue: string
): SpecifyResource<AnySchema> {
  const mainFields = getMainTableFields(relationship.relatedTable.name);
  const typeSearchFields =
    (typeof typeSearch === 'object'
      ? typeSearch?.searchFields
          .filter(
            ([searchField]) =>
              !searchField.isRelationship &&
              searchField.table === relationship.relatedTable
          )
          .map(([field]) => field)
      : undefined) ?? [];
  const fieldName = (
    mainFields.find((field) => typeSearchFields.includes(field)) ??
    mainFields[0]
  )?.name;
  return new relationship.relatedTable.Resource(
    typeof fieldName === 'string' ? { [fieldName]: pendingValue } : {}
  );
}
