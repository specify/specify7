import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';

import { requireContext } from '../../../tests/helpers';
import * as ajaxModule from '../../../utils/ajax';
import { Http } from '../../../utils/ajax/definitions';
import { tables } from '../../DataModel/tables';
import {
  defaultDataViewQuery,
  makeDataViewQuery,
} from '../../DataViews/queries';
import { parseQueryFields } from '../helpers';
import { useQueryResultsWrapper } from '../ResultsWrapper';
import { emptySelection } from '../selection';

requireContext();

function makeProps() {
  const definition = defaultDataViewQuery('Agent');
  return {
    table: tables.Agent,
    queryRunCount: 1,
    queryResource: makeDataViewQuery('Agent', definition),
    fields: parseQueryFields(definition.fields),
    recordSetId: undefined,
    forceCollection: undefined,
    selectedRows: [new Set<number>(), jest.fn()] as const,
  };
}

function response(id: number) {
  return {
    data: { count: id, results: [[id]] },
    status: Http.OK,
    response: new Response('', { status: Http.OK }),
  };
}

function deferredResponse() {
  let resolve!: (value: ReturnType<typeof response>) => void;
  const promise = new Promise<ReturnType<typeof response>>((callback) => {
    resolve = callback;
  });
  return { promise, resolve };
}

afterEach(() => {
  jest.restoreAllMocks();
});

test('loads Data View results during Strict Mode effect replay', async () => {
  jest.spyOn(ajaxModule, 'ajax').mockResolvedValue(response(3));
  const props = makeProps();
  const { result } = renderHook(() => useQueryResultsWrapper(props), {
    wrapper: ({ children }) => <React.StrictMode>{children}</React.StrictMode>,
  });

  await waitFor(() => expect(result.current?.initialData).toEqual([[3]]));
  expect(result.current?.totalCount).toBe(3);
  expect(result.current?.isLoading).toBe(false);
});

test('does not cancel an in-flight query when fields change without a new run', async () => {
  const pending = deferredResponse();
  const ajax = jest.spyOn(ajaxModule, 'ajax').mockReturnValue(pending.promise);
  const props = makeProps();
  const { result, rerender } = renderHook(useQueryResultsWrapper, {
    initialProps: props,
  });

  rerender({ ...props, fields: [...props.fields] });
  await act(async () => pending.resolve(response(3)));

  expect(result.current?.initialData).toEqual([[3]]);
  expect(result.current?.totalCount).toBe(3);
  expect(result.current?.isLoading).toBe(false);
  expect(ajax).toHaveBeenCalledTimes(2);
});

test('keeps the executed query snapshot until rerun and resets explicit selection on rerun', async () => {
  jest.spyOn(ajaxModule, 'ajax').mockResolvedValue(response(3));
  const setSelection = jest.fn();
  const props = {
    ...makeProps(),
    forceCollection: 2,
    recordSetId: 4,
    selection: [emptySelection(), setSelection] as const,
  };
  const { result, rerender } = renderHook(useQueryResultsWrapper, {
    initialProps: props,
  });
  await waitFor(() => expect(result.current?.isLoading).toBe(false));
  const executed = result.current?.executedQuery;
  expect(executed).toEqual(
    expect.objectContaining({ collectionId: 2, recordSetId: 4 })
  );
  expect(setSelection).toHaveBeenCalledTimes(1);
  rerender({ ...props, forceCollection: 9, fields: [...props.fields] });
  expect(result.current?.executedQuery).toBe(executed);
  expect(setSelection).toHaveBeenCalledTimes(1);
  rerender({ ...props, queryRunCount: 2, forceCollection: 9 });
  await waitFor(() =>
    expect(result.current?.executedQuery?.collectionId).toBe(9)
  );
  expect(setSelection).toHaveBeenCalledTimes(2);
});

test('ignores stale results and counts after a new query run', async () => {
  const previous = deferredResponse();
  const current = deferredResponse();
  jest
    .spyOn(ajaxModule, 'ajax')
    .mockReturnValueOnce(previous.promise)
    .mockReturnValueOnce(previous.promise)
    .mockReturnValue(current.promise);
  const props = makeProps();
  const { result, rerender } = renderHook(useQueryResultsWrapper, {
    initialProps: props,
  });

  rerender({ ...props, queryRunCount: 2 });
  await act(async () => current.resolve(response(7)));
  expect(result.current?.initialData).toEqual([[7]]);
  expect(result.current?.totalCount).toBe(7);

  await act(async () => previous.resolve(response(3)));
  expect(result.current?.initialData).toEqual([[7]]);
  expect(result.current?.totalCount).toBe(7);
  expect(result.current?.isLoading).toBe(false);
});

test('ignores the cancelled request after Strict Mode starts a replacement', async () => {
  const previous = deferredResponse();
  const current = deferredResponse();
  jest
    .spyOn(ajaxModule, 'ajax')
    .mockReturnValueOnce(previous.promise)
    .mockReturnValueOnce(previous.promise)
    .mockReturnValue(current.promise);
  const props = makeProps();
  const { result } = renderHook(() => useQueryResultsWrapper(props), {
    wrapper: ({ children }) => <React.StrictMode>{children}</React.StrictMode>,
  });

  await act(async () => previous.resolve(response(3)));
  expect(result.current).toBeUndefined();

  await act(async () => current.resolve(response(7)));
  expect(result.current?.initialData).toEqual([[7]]);
  expect(result.current?.totalCount).toBe(7);
  expect(result.current?.isLoading).toBe(false);
});

test('preserves count-only runs in Strict Mode', async () => {
  const ajax = jest.spyOn(ajaxModule, 'ajax').mockResolvedValue(response(3));
  const props = { ...makeProps(), countOnly: true };
  const { result } = renderHook(() => useQueryResultsWrapper(props), {
    wrapper: ({ children }) => <React.StrictMode>{children}</React.StrictMode>,
  });

  await waitFor(() => expect(result.current?.totalCount).toBe(3));
  expect(result.current?.initialData).toBeUndefined();
  expect(result.current?.fetchResults).toBeUndefined();
  expect(result.current?.isLoading).toBe(false);
  expect(ajax).toHaveBeenCalledTimes(2);
});
