import { act, renderHook, waitFor } from '@testing-library/react';

import { mockTime, requireContext } from '../../../tests/helpers';
import { GET, SET } from '../../../utils/utils';
import { tables } from '../../DataModel/tables';
import { datePrecisions, useDatePrecision } from '../useDatePrecision';
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
