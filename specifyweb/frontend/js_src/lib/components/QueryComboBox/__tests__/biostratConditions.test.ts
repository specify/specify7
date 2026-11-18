import { requireContext } from '../../../tests/helpers';
import { serializeResource } from '../../DataModel/serializers';
import { tables } from '../../DataModel/tables';
import { queryFieldFilterSpecs } from '../../QueryBuilder/FieldFilterSpec';
import { getQueryComboBoxConditions } from '../helpers';

requireContext();

describe('getQueryComboBoxConditions with BioStrat typeSearchName', () => {
  const getBaseParams = () => ({
    // Use a non-tree resource to avoid toTreeTable() requiring tree data
    resource: new tables.CollectionObject.Resource(
      {},
      { noBusinessRules: true }
    ),
    fieldName: 'name' as const,
    treeData: undefined,
    collectionRelationships: undefined,
    relatedTable: tables.GeologicTimePeriod,
    subViewRelationship: undefined,
    treeDefinition: undefined,
  });

  test('adds isBioStrat=true filter when typeSearchName is BioStrat', () => {
    const conditions = getQueryComboBoxConditions({
      ...getBaseParams(),
      typeSearchName: 'BioStrat',
    });
    const serialized = conditions.map(serializeResource);
    expect(serialized).toContainEqual(
      expect.objectContaining({
        fieldName: 'isBioStrat',
        startValue: 'true',
        operStart: queryFieldFilterSpecs.true.id,
      })
    );
  });

  test('does NOT add isBioStrat filter when typeSearchName is something else', () => {
    const conditions = getQueryComboBoxConditions({
      ...getBaseParams(),
      typeSearchName: 'ChronosStrat',
    });
    const serialized = conditions.map(serializeResource);
    expect(
      serialized.filter(({ fieldName }) => fieldName === 'isBioStrat')
    ).toHaveLength(0);
  });

  test('does NOT add isBioStrat filter when typeSearchName is undefined', () => {
    const conditions = getQueryComboBoxConditions({
      ...getBaseParams(),
    });
    const serialized = conditions.map(serializeResource);
    expect(
      serialized.filter(({ fieldName }) => fieldName === 'isBioStrat')
    ).toHaveLength(0);
  });

  test('does NOT add isBioStrat filter for non-GeologicTimePeriod tables', () => {
    const conditions = getQueryComboBoxConditions({
      ...getBaseParams(),
      relatedTable: tables.Taxon,
      typeSearchName: 'BioStrat',
    });
    const serialized = conditions.map(serializeResource);
    expect(
      serialized.filter(({ fieldName }) => fieldName === 'isBioStrat')
    ).toHaveLength(0);
  });
});
