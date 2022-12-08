import { dependentFields } from '../CarryForward';
import { requireContext } from '../../../tests/helpers';

requireContext();

test('derivedFields', () => expect(dependentFields()).toMatchSnapshot());
