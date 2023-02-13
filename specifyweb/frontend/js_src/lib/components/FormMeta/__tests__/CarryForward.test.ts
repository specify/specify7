import { requireContext } from '../../../tests/helpers';
import { dependentFields } from '../CarryForward';

requireContext();

test('dependentFields', () => expect(dependentFields()).toMatchSnapshot());
