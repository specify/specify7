import {requireContext} from '../../../tests/helpers';
import {exportsForTests} from '../spec';

const { tablesWithFormTable } = exportsForTests;

requireContext();

test('Tables with form tables computed correctly', () =>
  expect(tablesWithFormTable()).toMatchSnapshot());
