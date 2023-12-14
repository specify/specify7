import { act, renderHook, waitFor } from '@testing-library/react';

import { mockTime, requireContext } from '../../../tests/helpers';
import { dayjs } from '../../../utils/dayJs';
import { GET } from '../../../utils/utils';
import { tables } from '../../DataModel/tables';
import { dateTestUtils } from './dateTestUtils';
import { useMoment } from '../useMoment';

mockTime();
requireContext();

const { dateFieldName, precisionField, baseProps } = dateTestUtils;

test('useMoment', async () => {
  const resource = new tables.CollectionObject.Resource(undefined, {
    noBusinessRules: true,
  });
  const defaultValue = new Date();
  resource.bulkSet({ [dateFieldName]: defaultValue });

  const { result } = renderHook(() =>
    useMoment({
      resource,
      dateFieldName,
      precisionFieldName: precisionField,
      defaultPrecision: baseProps.defaultPrecision,
    })
  );
  const [originalMoment, setMoment, isInitialized] = result.current;

  expect(isInitialized.current).toBe(false);

  // Read default value from the resource
  await waitFor(() => {
    expect(originalMoment?.toDate().getTime()).toEqual(defaultValue.getTime());
  });

  // Listens to resource update and parses the value
  act(
    // Setting to invalid date
    () => void resource.set(dateFieldName, 'abc')
  );
  await waitFor(() => expect(result.current[GET]?.isValid()).toBe(false));

  // Can update moment
  const otherDate = new Date('2020-01-01');
  const moment = dayjs(otherDate);
  act(() => setMoment(moment));
  await waitFor(() => expect(result.current[GET]).toEqual(moment));
});
