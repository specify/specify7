import { mockTime, requireContext } from '../../../tests/helpers';
import { snapshot } from '../../../tests/reactUtils';
import { dateTestUtils } from '../dateTestUtils';
import { PartialDateUi } from '../PartialDateUi';

mockTime();
requireContext();

const { props, getBaseResource } = dateTestUtils;

// Snapshot tests
snapshot(PartialDateUi, () => props(getBaseResource()));
snapshot(PartialDateUi, () =>
  props(getBaseResource(), {
    canChangePrecision: false,
    defaultPrecision: 'month-year',
  })
);
snapshot(PartialDateUi, () =>
  props(getBaseResource(), {
    canChangePrecision: false,
    defaultPrecision: 'year',
  })
);

// Interaction tests

/*
 * // ME: add tests:
 * Test all props with all precision types?
 * Test reading existing values from resource
 * Test non-accessible date pickers
 * Test changing precision on the fly and how that mutates value
 * Refactor the date picker into smaller, more testable parts?
 */

/*
 *Test('<Form> removes notSubmitted class name on submit', async () => {
 *const { asFragment, getByRole, user } = mount(
 *  <Form aria-label="form" onSubmit={(event): void => event.preventDefault()}>
 *    <input type="submit" />
 *  </Form>
 *);
 *const form = getByRole('form');
 *expect(form).toHaveClass(className.notSubmittedForm);
 *
 *const button = getByRole('button');
 *await user.click(button);
 *
 *expect(form).not.toHaveClass(className.notSubmittedForm);
 *
 *expect(asFragment()).toMatchSnapshot();
 *});
 */
