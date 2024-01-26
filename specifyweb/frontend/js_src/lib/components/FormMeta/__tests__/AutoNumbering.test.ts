import { requireContext } from '../../../tests/helpers';
import { tables } from '../../DataModel/tables';
import { getAutoNumberingFields } from '../AutoNumbering';

requireContext();

test('getAutoNumberingFields', () =>
  expect(
    getAutoNumberingFields(tables.CollectionObject).map(({ name }) => name)
  ).toEqual(['catalogNumber']));
