import { requireContext } from '../../../tests/helpers';
import { exportsForTests } from '../viewSpec';

requireContext();

const { tablesWithFormTable } = exportsForTests;

test('Tables with form tables computed correctly', () =>
  expect(tablesWithFormTable()).toMatchSnapshot());
