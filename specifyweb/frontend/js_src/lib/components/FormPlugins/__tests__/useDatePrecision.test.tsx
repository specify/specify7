import { act, renderHook, waitFor } from '@testing-library/react';

import { mockTime, requireContext } from '../../../tests/helpers';
import { GET, SET } from '../../../utils/utils';
import { tables } from '../../DataModel/tables';
import { dateTestUtils } from '../dateTestUtils';
import {
  datePrecisions,
  useDatePrecision,
  useUnsetDanglingDatePrecision,
} from '../useDatePrecision';

mockTime();
requireContext();

const { precisionField, baseProps } = dateTestUtils;

test('useDatePrecision', async () => {
  const resource = new tables.CollectionObject.Resource(undefined, {
    noBusinessRules: true,
  });
  const { result } = renderHook(() =>
    useDatePrecision(resource, precisionField, baseProps.defaultPrecision)
  );

  // Default precision is used
  expect(result.current.precision[GET]).toBe(baseProps.defaultPrecision);

  // Can update precision
  act(() => result.current.precision[SET]('year'));
  await waitFor(() => expect(result.current.precision[GET]).toBe('year'));

  // Listens to change on the resource
  act(() => void resource.set(precisionField, datePrecisions['month-year']));
  await waitFor(() => expect(result.current.precision[GET]).toBe('month-year'));

  expect(result.current.precisionValidationRef).toBeInstanceOf(Function);
});

test('useUnsetDanglingDatePrecision', async () => {
  const resource = new tables.CollectionObject.Resource(undefined, {
    noBusinessRules: true,
  });
  resource.bulkSet({ [precisionField]: 1 });

  let isDateEmpty = false;
  const { rerender } = renderHook(() =>
    useUnsetDanglingDatePrecision(resource, precisionField, isDateEmpty)
  );

  expect(resource.get(precisionField)).toBe(1);

  // Unset the current date
  isDateEmpty = true;
  rerender();

  await waitFor(() => expect(resource.get(precisionField)).toBeNull());
});
