import { getAutoNumberingFields } from '../AutoNumbering';
import { requireContext } from '../../../tests/helpers';
import { schema } from '../../DataModel/schema';

requireContext();

test('getAutoNumberingFields', () =>
  expect(
    getAutoNumberingFields(schema.models.CollectionObject).map(
      ({ name }) => name
    )
  ).toEqual(['catalogNumber']));
