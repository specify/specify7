import { requireContext } from '../../../tests/helpers';
import { QueryFieldSpec } from '../fieldSpec';
import { fieldSpecsToLocalityMappings } from '../ToMap';

requireContext();

test('fieldSpecsToLocalityMappings', () =>
  expect(
    fieldSpecsToLocalityMappings(
      'CollectionObject',
      [
        ['catalogNumber'],
        ['determinations', '#1', 'taxon', '$-any', 'fullName'],
        ['determinations', '#1', 'taxon', '$Species', 'taxonId'],
        ['determinations', '#1', 'isCurrent'],
        ['collectingEvent', 'locality'],
      ].map((path) => QueryFieldSpec.fromPath('CollectionObject', path))
    )
  ).toMatchInlineSnapshot(`[]`));
