import { requireContext } from '../../../tests/helpers';
import { dependentFields, strictDependentFields } from '../CarryForward';

requireContext();

test('strictDependentFields', () =>
  expect(strictDependentFields()).toMatchSnapshot());

test('dependentFields', () => expect(dependentFields()).toMatchSnapshot());
