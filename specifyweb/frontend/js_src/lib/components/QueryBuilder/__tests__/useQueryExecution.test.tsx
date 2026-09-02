import { act, renderHook } from '@testing-library/react';

import { hasPermission } from '../../Permissions/helpers';
import type { SerializedResource } from '../../DataModel/helperTypes';
import type { SpQuery, SpQueryField } from '../../DataModel/types';
import type { QueryField } from '../helpers';
import { useQueryExecution } from '../useQueryExecution';

jest.mock('../../Permissions/helpers', () => ({
  hasPermission: jest.fn(() => true),
}));

const query = { fields: [] } as unknown as SerializedResource<SpQuery>;
const fields = [] as const as readonly QueryField[];
const serializedFields = [
  { fieldName: 'Name' },
] as unknown as readonly SerializedResource<SpQueryField>[];

afterEach(() => jest.useRealTimers());

test('serializes the current fields and defers an authorized query run', () => {
  jest.useFakeTimers();
  const setQuery = jest.fn();
  const onRun = jest.fn();
  const getQueryFieldRecords = jest.fn(() => serializedFields);
  const { result } = renderHook(() =>
    useQueryExecution({
      query,
      fields,
      getQueryFieldRecords,
      setQuery,
      onRun,
    })
  );

  act(() => result.current.runQuery('count'));

  expect(hasPermission).toHaveBeenCalledWith('/querybuilder/query', 'execute');
  expect(getQueryFieldRecords).toHaveBeenCalledWith(fields);
  expect(setQuery).toHaveBeenCalledWith({
    ...query,
    fields: serializedFields,
    countOnly: true,
  });
  expect(onRun).not.toHaveBeenCalled();

  act(() => jest.runOnlyPendingTimers());

  expect(onRun).toHaveBeenCalledTimes(1);
});

test('schedules a regular query run after pending input changes', () => {
  jest.useFakeTimers();
  const setQuery = jest.fn();
  const onRun = jest.fn();
  const { result } = renderHook(() =>
    useQueryExecution({
      query,
      fields,
      getQueryFieldRecords: undefined,
      setQuery,
      onRun,
    })
  );

  act(() => result.current.scheduleQueryRun());

  expect(setQuery).toHaveBeenCalledWith({
    ...query,
    countOnly: false,
  });

  act(() => jest.runOnlyPendingTimers());

  expect(onRun).toHaveBeenCalledTimes(1);
});
