import { renderHook, waitFor } from '@testing-library/react';

import { Http } from '../../../utils/ajax/definitions';
import { throttledPromise } from '../../../utils/ajax/throttledPromise';
import {
  queryCountPromiseGenerator,
  querySpecToResource,
} from '../../Statistics/hooks';
import { useTableRecordCounts } from '../DataViewTables';

jest.mock('../../../utils/ajax/throttledPromise', () => ({
  throttledPromise: jest.fn(
    (_key: string, generator: () => Promise<number | undefined>) => generator()
  ),
}));

jest.mock('../../DataModel/serializers', () => ({
  serializeResource: (resource: unknown) => resource,
}));

jest.mock('../../Statistics/hooks', () => ({
  queryCountPromiseGenerator: jest.fn(),
  querySpecToResource: jest.fn((tableName: string) => ({ tableName })),
}));

test('fetches and returns a record count for each Data Views table', async () => {
  (queryCountPromiseGenerator as jest.Mock).mockImplementation(
    ({ tableName }: { readonly tableName: string }) =>
      async () => ({
        status: Http.OK,
        data: { count: tableName === 'Agent' ? 3 : 7 },
      })
  );
  const tables = [{ name: 'Agent' }, { name: 'Loan' }] as never;

  const { result } = renderHook(() => useTableRecordCounts(tables));

  await waitFor(() => expect(result.current).toEqual({ Agent: 3, Loan: 7 }));

  expect(querySpecToResource).toHaveBeenCalledTimes(2);
  expect(throttledPromise).toHaveBeenCalledTimes(2);
});

test('clears stale record counts when Data Views tables change', async () => {
  (queryCountPromiseGenerator as jest.Mock).mockImplementation(
    ({ tableName }: { readonly tableName: string }) =>
      async () => ({
        status: Http.OK,
        data: { count: tableName === 'Agent' ? 3 : 7 },
      })
  );
  const agentTable = { name: 'Agent' } as never;
  const loanTable = { name: 'Loan' } as never;

  const { result, rerender } = renderHook(
    ({ tables }) => useTableRecordCounts(tables),
    { initialProps: { tables: [agentTable] } }
  );

  await waitFor(() => expect(result.current).toEqual({ Agent: 3 }));
  rerender({ tables: [loanTable] });

  expect(result.current).toEqual({});

  await waitFor(() => expect(result.current).toEqual({ Loan: 7 }));
  rerender({ tables: [agentTable] });

  expect(result.current).toEqual({});
  await waitFor(() => expect(result.current).toEqual({ Agent: 3 }));
});
