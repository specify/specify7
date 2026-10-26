import { act, renderHook, waitFor } from '@testing-library/react';

import { requireContext } from '../../../tests/helpers';
import * as ajaxModule from '../../../utils/ajax';
import { Http } from '../../../utils/ajax/definitions';
import {
  defaultDataViewQuery,
  makeDataViewQuery,
} from '../../DataViews/queries';
import { serializeResource } from '../../DataModel/serializers';
import type { SelectedQuery } from '../selection';
import { allSelection, emptySelection, selectRecords } from '../selection';
import {
  fetchSelectedQuery,
  useSelectedQueryCount,
  useSelectedQueryResults,
} from '../useSelectedQuery';

requireContext();

function selectedQuery(): SelectedQuery {
  return {
    query: {
      ...serializeResource(
        makeDataViewQuery('Agent', defaultDataViewQuery('Agent'))
      ),
      collectionId: 2,
      recordSetId: 4,
    },
    selection: emptySelection(),
  };
}

function response(
  data:
    | { readonly count: number }
    | { readonly results: readonly (readonly number[])[] }
) {
  return {
    data,
    status: Http.OK,
    response: new Response('', { status: Http.OK }),
  };
}

afterEach(() => jest.restoreAllMocks());

test('empty and all selections use known counts without requesting IDs or counts', () => {
  const ajax = jest.spyOn(ajaxModule, 'ajax');
  const query = selectedQuery();
  const { result, rerender } = renderHook(
    (query: SelectedQuery) => useSelectedQueryCount(query, 1_000_000),
    { initialProps: query }
  );
  expect(result.current).toBe(0);
  rerender({ ...query, selection: allSelection() });
  expect(result.current).toBe(1_000_000);
  expect(ajax).not.toHaveBeenCalled();
});

test('counts matching rows for exceptions, including duplicate rows, rather than counting the full selection', async () => {
  const ajax = jest
    .spyOn(ajaxModule, 'ajax')
    .mockResolvedValue(response({ count: 3 }));
  const query = selectedQuery();
  const selected = {
    ...query,
    selection: selectRecords(allSelection(), [2], false),
  };
  const { result } = renderHook(() => useSelectedQueryCount(selected, 100));
  await waitFor(() => expect(result.current).toBe(97));
  expect(ajax).toHaveBeenCalledTimes(1);
  expect(ajax.mock.calls[0][1]?.body).toEqual(
    expect.objectContaining({
      countonly: true,
      collectionid: 2,
      recordsetid: 4,
      selection: { mode: 'include', ids: [2] },
    })
  );
});

test('fetches selected rows lazily with a bounded page and the executed query context', async () => {
  const ajax = jest
    .spyOn(ajaxModule, 'ajax')
    .mockResolvedValue(response({ results: [[2], [5]] }));
  const query = selectedQuery();
  const selected = { ...query, selection: allSelection() };
  const { result, rerender } = renderHook(
    (active: boolean) => useSelectedQueryResults(selected, active, 100),
    { initialProps: false }
  );
  expect(ajax).not.toHaveBeenCalled();
  rerender(true);
  await waitFor(() => expect(result.current.results[0]).toEqual([[2], [5]]));
  expect(ajax.mock.calls[0][1]?.body).toEqual(
    expect.objectContaining({
      countonly: false,
      limit: 40,
      offset: 0,
      collectionid: 2,
      recordsetid: 4,
      selection: { mode: 'exclude', ids: [] },
    })
  );
  await act(async () => {
    await fetchSelectedQuery(selected, false, 80);
  });
  expect(ajax.mock.calls[1][1]?.body).toEqual(
    expect.objectContaining({ offset: 80, limit: 40 })
  );
});

test('deselect all does not fetch an unrestricted query', async () => {
  const ajax = jest.spyOn(ajaxModule, 'ajax');
  const query = selectedQuery();
  const { result } = renderHook(() => useSelectedQueryResults(query, true, 0));
  await waitFor(() => expect(result.current.results[0]).toEqual([]));
  expect(ajax).not.toHaveBeenCalled();
});

test('ignores a stale page after the selection changes', async () => {
  let resolve!: (value: ReturnType<typeof response>) => void;
  const pending = new Promise<ReturnType<typeof response>>((done) => {
    resolve = done;
  });
  jest
    .spyOn(ajaxModule, 'ajax')
    .mockReturnValueOnce(pending)
    .mockResolvedValue(response({ results: [[7]] }));
  const query = selectedQuery();
  const first = {
    ...query,
    selection: selectRecords(emptySelection(), [2], true),
  };
  const second = {
    ...query,
    selection: selectRecords(emptySelection(), [7], true),
  };
  const { result, rerender } = renderHook(
    (selected: SelectedQuery) => useSelectedQueryResults(selected, true, 1),
    { initialProps: first }
  );
  rerender(second);
  await waitFor(() => expect(result.current.results[0]).toEqual([[7]]));
  await act(async () => resolve(response({ results: [[2]] })));
  expect(result.current.results[0]).toEqual([[7]]);
});
