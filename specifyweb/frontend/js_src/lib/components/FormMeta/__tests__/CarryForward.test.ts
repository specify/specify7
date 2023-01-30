import { dependentFields, strictDependentFields } from '../CarryForward';
import { requireContext } from '../../../tests/helpers';

requireContext();

test('strictDependentFields', () =>
  expect(strictDependentFields()).toMatchSnapshot());

test('derivedFields', () => expect(dependentFields()).toMatchSnapshot());
