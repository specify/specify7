import { requireContext } from '../../../tests/helpers';
import { tables } from '../../DataModel/tables';
import { getAutoNumberingFields } from '../AutoNumbering';

requireContext();

test('getAutoNumberingFields', () =>
  expect(
    getAutoNumberingFields(tables.CollectionObject).map(({ name }) => name)
  ).toEqual(['catalogNumber']));

test('getAutoNumberingFields returns empty array for table without auto-numberable fields', () =>
  expect(
    getAutoNumberingFields(tables.Locality).map(({ name }) => name)
  ).toEqual([]));
