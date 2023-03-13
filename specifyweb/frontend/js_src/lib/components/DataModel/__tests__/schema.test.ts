import { requireContext } from '../../../tests/helpers';
import { getModel, schema } from '../schema';

requireContext();

describe('getModel', () => {
  test('CollectionObject', () =>
    expect(getModel('CollectionObject')).toBe(schema.models.CollectionObject));
  test('collectionObject', () =>
    expect(getModel('collectionObject')).toBe(schema.models.CollectionObject));
  test('edu.ku.brc.specify.datamodel.Accession', () =>
    expect(getModel('edu.ku.brc.specify.datamodel.Accession')).toBe(
      schema.models.Accession
    ));
});
