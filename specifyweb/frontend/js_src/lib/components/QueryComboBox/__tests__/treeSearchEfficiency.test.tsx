/**
 * Tests for tree search efficiency improvements (#7752).
 *
 * Tree tables (Taxon, Geography, Storage, etc.) can have 200K+ rows.
 * Using LIKE '%pattern%' causes full table scans; LIKE 'pattern%' can use
 * B-tree indexes. The typeahead also doesn't need 1000 results — 50 is
 * more than enough for a dropdown.
 */
import { requireContext } from '../../../tests/helpers';
import { serializeResource } from '../../DataModel/serializers';
import { tables } from '../../DataModel/tables';
import { queryFieldFilterSpecs } from '../../QueryBuilder/FieldFilterSpec';
import { localized } from '../../../utils/types';
import { QUERY_COMBO_BOX_PAGE_SIZE } from '../constants';
import { makeComboBoxQuery } from '../helpers';

requireContext();

describe('Tree search efficiency', () => {
  test('makeComboBoxQuery for tree tables uses startsWith by default', () => {
    const query = makeComboBoxQuery({
      fieldName: 'fullName',
      value: 'rosa',
      isTreeTable: true,
      typeSearch: {
        table: tables.Taxon,
        searchFields: [[tables.Taxon.strictGetLiteralField('fullName')]],
        name: localized('Taxon'),
        title: localized('Taxon'),
        formatter: localized(''),
        displayFields: undefined,
        format: localized('%s'),
      },
      specialConditions: [],
    });

    const serialized = serializeResource(query);
    const searchField = serialized.fields.find(
      (field: { readonly isDisplay: boolean }) => !field.isDisplay
    );

    // startsWith operator (id 15), NOT like (id 0)
    expect(searchField?.operStart).toBe(queryFieldFilterSpecs.startsWith.id);
    // Value should NOT be wrapped in % wildcards
    expect(searchField?.startValue).toBe('rosa');
  });

  test('makeComboBoxQuery for non-tree tables uses startsWith by default', () => {
    const query = makeComboBoxQuery({
      fieldName: 'lastName',
      value: 'smith',
      isTreeTable: false,
      typeSearch: {
        table: tables.Agent,
        searchFields: [[tables.Agent.strictGetLiteralField('lastName')]],
        name: localized('Agent'),
        title: localized('Agent'),
        formatter: localized(''),
        displayFields: undefined,
        format: localized('%s'),
      },
      specialConditions: [],
    });

    const serialized = serializeResource(query);
    const searchField = serialized.fields.find(
      (field: { readonly isDisplay: boolean }) => !field.isDisplay
    );

    // Non-tree tables also default to startsWith
    expect(searchField?.operStart).toBe(queryFieldFilterSpecs.startsWith.id);
    expect(searchField?.startValue).toBe('smith');
  });

  test('search limit is at most 50', () => {
    // The exported constant from index.tsx controls runQuery limit.
    // If someone bumps it back to 1000, this test catches it.
    expect(QUERY_COMBO_BOX_PAGE_SIZE).toBeLessThanOrEqual(50);
  });
});
