import { requireContext } from '../../../tests/helpers';
import {
  dependentFields,
  strictDependentFields,
  tableValidForBulkClone,
} from '../CarryForward';
import { tables } from '../../DataModel/tables';

requireContext();

test('tableValidForBulkClone returns true for CollectionObject', () =>
  expect(tableValidForBulkClone(tables.CollectionObject)).toBe(true));

test('tableValidForBulkClone returns false for non-CollectionObject table', () =>
  expect(tableValidForBulkClone(tables.Locality)).toBe(false));

test('tableValidForBulkClone returns false when formatter has regex part', () => {
  const catalogNumber =
    tables.CollectionObject.strictGetLiteralField('catalogNumber');
  jest.spyOn(catalogNumber, 'getUiFormatter').mockReturnValue({
    parts: [{ type: 'regex', canAutonumber: () => false } as any],
  } as any);
  expect(tableValidForBulkClone(tables.CollectionObject)).toBe(false);
  jest.restoreAllMocks();
});

test('tableValidForBulkClone returns false when formatter has alpha part', () => {
  const catalogNumber =
    tables.CollectionObject.strictGetLiteralField('catalogNumber');
  jest.spyOn(catalogNumber, 'getUiFormatter').mockReturnValue({
    parts: [{ type: 'alpha', canAutonumber: () => false } as any],
  } as any);
  expect(tableValidForBulkClone(tables.CollectionObject)).toBe(false);
  jest.restoreAllMocks();
});

test('strictDependentFields', () =>
  expect(strictDependentFields()).toMatchSnapshot());

test('dependentFields', () => expect(dependentFields()).toMatchSnapshot());
