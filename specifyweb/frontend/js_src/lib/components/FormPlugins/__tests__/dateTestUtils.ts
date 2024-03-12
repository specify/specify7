import type { SpecifyResource } from '../../DataModel/legacyTypes';
import { tables } from '../../DataModel/tables';
import type { CollectionObject } from '../../DataModel/types';
import type { PartialDateUi } from '../PartialDateUi';
import { datePrecisions } from '../useDatePrecision';

// Test helpers
const dateFieldName = 'catalogedDate' as const;
const precisionField = 'catalogedDatePrecision' as const;
const getBaseResource = (): SpecifyResource<CollectionObject> =>
  new tables.CollectionObject.Resource(undefined, { noBusinessRules: true });
function getResource(): SpecifyResource<CollectionObject> {
  const resource = getBaseResource();
  resource.set(dateFieldName, '2023-12-07');
  resource.set(precisionField, datePrecisions.full);
  return resource;
}

const baseProps: Omit<Parameters<typeof PartialDateUi>[0], 'dateField'> = {
  resource: undefined,
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
  dateField: tables.CollectionObject.strictGetLiteralField(dateFieldName),
  resource,
  ...extra,
});

export const dateTestUtils = {
  dateFieldName,
  precisionField,
  getBaseResource,
  getResource,
  baseProps,
  props,
};
