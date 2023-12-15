import { act, renderHook, waitFor } from '@testing-library/react';

import { mockTime, requireContext } from '../../../tests/helpers';
import { dayjs } from '../../../utils/dayJs';
import { GET } from '../../../utils/utils';
import { tables } from '../../DataModel/tables';
import { useMoment } from '../useMoment';
import { dateTestUtils } from './dateTestUtils';

mockTime();
requireContext();

const { dateFieldName } = dateTestUtils;

describe('useMoment', () => {
  test('complete lifecycle', async () => {
    const resource = new tables.CollectionObject.Resource(undefined, {
      noBusinessRules: true,
    });
    const defaultValue = new Date();
    resource.bulkSet({ [dateFieldName]: defaultValue });

    const { result } = renderHook(() =>
      useMoment(resource, dateFieldName, undefined)
    );
    const [originalMoment, setMoment] = result.current;

    // Read default value from the resource
    await waitFor(() => {
      expect(originalMoment?.toDate().getTime()).toEqual(
        defaultValue.getTime()
      );
    });

    // Listens to resource update and parses the value
    act(
      // Setting to invalid date
      () => void resource.set(dateFieldName, 'abc')
    );
    await waitFor(() => expect(result.current[GET]?.isValid()).toBe(false));

    // Can update moment
    const otherDate = '2020-01-01';
    const moment = dayjs(new Date(otherDate));
    act(() => setMoment(moment));
    await waitFor(() => expect(result.current[GET]).toEqual(moment));
    expect(resource.get(dateFieldName)).toBe(otherDate);
  });

  test('sets default value on resource if missing', async () => {
    const resource = new tables.CollectionObject.Resource(undefined, {
      noBusinessRules: true,
    });
    const date = '2020-01-01';
    const defaultValue = new Date(date);

    renderHook(() => useMoment(resource, dateFieldName, defaultValue));

    await waitFor(() => {
      expect(new Date(resource?.get(dateFieldName) ?? '').getTime()).toEqual(
        defaultValue.getTime()
      );
    });
  });
});
