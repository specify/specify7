import { act, renderHook } from '@testing-library/react';

import { hasPermission } from '../../Permissions/helpers';
import type { SerializedResource } from '../../DataModel/helperTypes';
import type { SpQuery } from '../../DataModel/types';
import { useQueryExecution } from '../useQueryExecution';

jest.mock('../../Permissions/helpers', () => ({
  hasPermission: jest.fn(() => true),
}));

const query = {
  fields: [{ fieldName: 'Saved field' }],
  countOnly: false,
} as unknown as SerializedResource<SpQuery>;

afterEach(() => {
  jest.useRealTimers();
});

test('keeps count mode out of the query resource and defers an authorized run', () => {
  jest.useFakeTimers();
  const onRun = jest.fn();
  const { result } = renderHook(() =>
    useQueryExecution({
      query,
      onRun,
    })
  );

  act(() => result.current.runQuery('count'));
  expect(hasPermission).toHaveBeenCalledWith('/querybuilder/query', 'execute');
  expect(result.current.isCountOnly).toBe(true);
  expect(query.countOnly).toBe(false);
  expect(onRun).not.toHaveBeenCalled();

  act(() => jest.runOnlyPendingTimers());

  expect(onRun).toHaveBeenCalledTimes(1);
});

test('schedules a regular query run after pending input changes', () => {
  jest.useFakeTimers();
  const onRun = jest.fn();
  const { result } = renderHook(() =>
    useQueryExecution({
      query,
      onRun,
    })
  );

  act(() => result.current.scheduleQueryRun());

  expect(result.current.isCountOnly).toBe(false);

  act(() => jest.runOnlyPendingTimers());

  expect(onRun).toHaveBeenCalledTimes(1);
});
