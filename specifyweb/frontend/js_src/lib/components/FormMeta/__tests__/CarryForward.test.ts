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

test('strictDependentFields', () =>
  expect(strictDependentFields()).toMatchSnapshot());

test('dependentFields', () => expect(dependentFields()).toMatchSnapshot());
