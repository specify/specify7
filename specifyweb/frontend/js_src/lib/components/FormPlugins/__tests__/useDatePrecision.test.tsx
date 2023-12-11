import { act, renderHook, waitFor } from '@testing-library/react';

import { requireContext } from '../../../tests/helpers';
import { GET, SET } from '../../../utils/utils';
import { tables } from '../../DataModel/tables';
import { datePrecisions, useDatePrecision } from '../useDatePrecision';

requireContext();

const precisionField = 'catalogedDatePrecision';
test('useDatePrecision', async () => {
  const resource = new tables.CollectionObject.Resource(undefined, {
    noBusinessRules: true,
  });
  const { result } = renderHook(() =>
    useDatePrecision(resource, precisionField, 'full')
  );

  // Default precision is used
  expect(result.current.precision[GET]).toBe('full');

  // Can update precision
  act(() => result.current.precision[SET]('year'));
  await waitFor(() => expect(result.current.precision[GET]).toBe('year'));

  // Listens to change on the resource
  act(() => void resource.set(precisionField, datePrecisions.full));
  await waitFor(() => expect(result.current.precision[GET]).toBe('full'));

  expect(result.current.precisionValidationRef).toBeInstanceOf(Function);
});
