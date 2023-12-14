import { act, renderHook, waitFor } from '@testing-library/react';

import { mockTime, requireContext } from '../../../tests/helpers';
import { GET, SET } from '../../../utils/utils';
import { tables } from '../../DataModel/tables';
import {
  datePrecisions,
  useDatePrecision,
  useSyncDatePrecision,
} from '../useDatePrecision';
import { dateTestUtils } from './dateTestUtils';

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

describe('useSyncDatePrecision', () => {
  test('unset precision if date is empty', async () => {
    const resource = new tables.CollectionObject.Resource(undefined, {
      noBusinessRules: true,
    });
    resource.bulkSet({ [precisionField]: 1 });

    let hasDate = true;
    const { rerender } = renderHook(() =>
      useSyncDatePrecision(
        resource,
        precisionField,
        baseProps.defaultPrecision,
        hasDate
      )
    );

    expect(resource.get(precisionField)).toBe(1);

    // Unset the current date
    hasDate = false;
    rerender();

    await waitFor(() => expect(resource.get(precisionField)).toBeNull());
  });

  test('set precision when date is set', async () => {
    const resource = new tables.CollectionObject.Resource(undefined, {
      noBusinessRules: true,
    });

    let hasDate: boolean | 'loading' = 'loading';
    const { rerender } = renderHook(() =>
      useSyncDatePrecision(resource, precisionField, 'month-year', hasDate)
    );

    expect(resource.get(precisionField)).toBeUndefined();

    // Set current date
    hasDate = true;
    rerender();

    await waitFor(() =>
      expect(resource.get(precisionField)).toEqual(datePrecisions['month-year'])
    );
  });
});
