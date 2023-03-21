import { requireContext } from '../../../tests/helpers';
import { schema } from '../../DataModel/schema';
import { getAutoNumberingFields } from '../AutoNumbering';

requireContext();

test('getAutoNumberingFields', () =>
  expect(
    getAutoNumberingFields(schema.models.CollectionObject).map(
      ({ name }) => name
    )
  ).toEqual(['catalogNumber']));
