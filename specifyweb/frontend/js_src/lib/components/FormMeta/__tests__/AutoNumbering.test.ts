import { requireContext } from '../../../tests/helpers';
import { getAutoNumberingFields } from '../AutoNumbering';
import { tables } from '../../DataModel/tables';

requireContext();

test('getAutoNumberingFields', () =>
  expect(
    getAutoNumberingFields(tables.CollectionObject).map(({ name }) => name)
  ).toEqual(['catalogNumber']));
