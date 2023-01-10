import { requireContext } from '../../../tests/helpers';
import { dependentFields } from '../CarryForward';

requireContext();

test('derivedFields', () => expect(dependentFields()).toMatchSnapshot());
