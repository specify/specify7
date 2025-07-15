import { requireContext } from '../../../tests/helpers';
import { getTable, tables } from '../tables';

requireContext();

describe('getTable', () => {
  test('CollectionObject', () =>
    expect(getTable('CollectionObject')).toBe(tables.CollectionObject));
  test('collectionObject', () =>
    expect(getTable('collectionObject')).toBe(tables.CollectionObject));
  test('edu.ku.brc.specify.datamodel.Accession', () =>
    expect(getTable('edu.ku.brc.specify.datamodel.Accession')).toBe(
      tables.Accession
    ));
});
