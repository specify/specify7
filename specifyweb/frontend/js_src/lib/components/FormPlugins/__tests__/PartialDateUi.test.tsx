import { mockTime, requireContext } from '../../../tests/helpers';
import { snapshot } from '../../../tests/reactUtils';
import type { SpecifyResource } from '../../DataModel/legacyTypes';
import { tables } from '../../DataModel/tables';
import type { CollectionObject } from '../../DataModel/types';
import { PartialDateUi } from '../PartialDateUi';
import { datePrecisions } from '../useDatePrecision';

mockTime();
requireContext();

// Test helpers
const dateFieldName = 'catalogedDate';
const precisionField = 'catalogedDatePrecision';
const getBaseResource = (): SpecifyResource<CollectionObject> =>
  new tables.CollectionObject.Resource(undefined, { noBusinessRules: true });
function getResource(): SpecifyResource<CollectionObject> {
  const resource = getBaseResource();
  resource.set(dateFieldName, '2023-12-07');
  resource.set(precisionField, datePrecisions.full);
  return resource;
}

const baseProps: Parameters<typeof PartialDateUi>[0] = {
  resource: undefined,
  dateFieldName,
  precisionField,
  defaultPrecision: 'full',
  defaultValue: undefined,
  id: undefined,
  isRequired: false,
  canChangePrecision: true,
};
const props = (
  resource = getResource(),
  extra: Partial<Parameters<typeof PartialDateUi>[0]> = {}
): Parameters<typeof PartialDateUi>[0] => ({
  ...baseProps,
  resource,
  ...extra,
});

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
