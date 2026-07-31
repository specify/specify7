import { requireContext } from '../../../tests/helpers';
import type { QueryField } from '../helpers';
import { QueryFieldSpec } from '../fieldSpec';
import { reorderFieldSpecsForSeries } from '../ResultsWrapper';

requireContext();

function makeItem(mappingPath: readonly string[], baseTable = 'CollectionObject') {
  const field: QueryField = {
    id: 0,
    mappingPath,
    sortType: undefined,
    isDisplay: true,
    filters: [{ type: 'any', startValue: '', isNot: false, isStrict: false }],
  };
  const fieldSpec = QueryFieldSpec.fromPath(
    baseTable as 'CollectionObject',
    mappingPath
  );
  return { field, fieldSpec };
}

describe('reorderFieldSpecsForSeries', () => {
  test('no-op when series is off', () => {
    const items = [
      makeItem(['timestampCreated']),
      makeItem(['catalogNumber']),
      makeItem(['determinations', 'taxon', '-formatted']),
    ];
    const result = reorderFieldSpecsForSeries(items, false, 'CollectionObject');
    expect(result).toBe(items);
  });

  test('no-op when table is not CollectionObject', () => {
    const items = [
      makeItem(['timestampCreated'], 'Accession'),
      makeItem(['accessionNumber'], 'Accession'),
    ];
    const result = reorderFieldSpecsForSeries(
      items as ReturnType<typeof makeItem>[],
      true,
      'Accession'
    );
    expect(result).toBe(items);
  });

  test('no-op when catalogNumber is already first', () => {
    const items = [
      makeItem(['catalogNumber']),
      makeItem(['timestampCreated']),
    ];
    const result = reorderFieldSpecsForSeries(items, true, 'CollectionObject');
    expect(result).toBe(items);
  });

  test('no-op when catalogNumber is absent', () => {
    const items = [
      makeItem(['timestampCreated']),
      makeItem(['determinations', 'taxon', '-formatted']),
    ];
    const result = reorderFieldSpecsForSeries(items, true, 'CollectionObject');
    expect(result).toBe(items);
  });

  test('moves catalogNumber to front when series is on', () => {
    const items = [
      makeItem(['timestampCreated']),
      makeItem(['catalogNumber']),
      makeItem(['determinations', 'taxon', '-formatted']),
    ];
    const result = reorderFieldSpecsForSeries(items, true, 'CollectionObject');

    expect(result).toHaveLength(3);
    expect(result[0].field.mappingPath).toEqual(['catalogNumber']);
    expect(result[1].field.mappingPath).toEqual(['timestampCreated']);
    expect(result[2].field.mappingPath).toEqual([
      'determinations',
      'taxon',
      '-formatted',
    ]);
  });

  test('moves catalogNumber from last position to front', () => {
    const items = [
      makeItem(['timestampCreated']),
      makeItem(['determinations', 'taxon', '-formatted']),
      makeItem(['catalogNumber']),
    ];
    const result = reorderFieldSpecsForSeries(items, true, 'CollectionObject');

    expect(result).toHaveLength(3);
    expect(result[0].field.mappingPath).toEqual(['catalogNumber']);
    expect(result[1].field.mappingPath).toEqual(['timestampCreated']);
    expect(result[2].field.mappingPath).toEqual([
      'determinations',
      'taxon',
      '-formatted',
    ]);
  });
});
