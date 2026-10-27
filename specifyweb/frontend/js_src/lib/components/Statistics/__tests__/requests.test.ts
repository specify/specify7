import { act, renderHook } from '@testing-library/react';

import { ajax } from '../../../utils/ajax';
import { Http } from '../../../utils/ajax/definitions';
import {
  cancelStatisticsRequests,
  statisticsAjax,
  statisticsAreLoading,
  useStatisticsLoading,
} from '../requests';

jest.mock('../../../utils/ajax', () => ({ ajax: jest.fn() }));

const ajaxMock = jest.mocked(ajax);
const options = { headers: { Accept: 'application/json' as const } };
const result = (status: number, retryAfter?: string) => ({
  status,
  data: { count: 12 },
  response: Object.assign(new Response(undefined, { status }), {
    headers: {
      get: (name: string) =>
        name === 'X-Specify-Retry-After' ? (retryAfter ?? null) : null,
    },
  }),
});

beforeEach(() => {
  ajaxMock.mockReset();
  jest.useFakeTimers();
});

afterEach(() => {
  cancelStatisticsRequests();
  jest.useRealTimers();
});

test('marks statistics requests and tracks loading through completion', async () => {
  const { result: loading } = renderHook(useStatisticsLoading);
  let resolveRequest!: (value: ReturnType<typeof result>) => void;
  ajaxMock.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        resolveRequest = resolve;
      })
  );
  let request!: ReturnType<typeof statisticsAjax>;
  act(() => {
    request = statisticsAjax('/stats/collection/preparations/', options);
  });
  expect(loading.current).toBe(true);
  expect(ajaxMock).toHaveBeenCalledWith(
    '/stats/collection/preparations/',
    expect.objectContaining({
      headers: expect.objectContaining({ 'X-Specify-Statistics': 'true' }),
      expectedErrors: [Http.CONFLICT],
    })
  );
  await act(async () => {
    resolveRequest(result(Http.OK));
    await request;
  });
  expect(loading.current).toBe(false);
});

test('retries busy responses using the Specify retry header while remaining loading', async () => {
  ajaxMock
    .mockResolvedValueOnce(result(Http.CONFLICT, '3'))
    .mockResolvedValueOnce(result(Http.OK));
  const request = statisticsAjax('/stored_query/ephemeral/', options);
  await jest.advanceTimersByTimeAsync(2999);
  expect(ajaxMock).toHaveBeenCalledTimes(1);
  expect(statisticsAreLoading()).toBe(true);
  await jest.advanceTimersByTimeAsync(1);
  expect((await request)?.data).toEqual({ count: 12 });
  expect(ajaxMock).toHaveBeenCalledTimes(2);
  expect(statisticsAreLoading()).toBe(false);
});

test('navigation cancels retries instead of starting more database work', async () => {
  ajaxMock.mockResolvedValueOnce(result(Http.CONFLICT, '2'));
  const request = statisticsAjax('/stored_query/ephemeral/', options);
  await jest.advanceTimersByTimeAsync(0);
  cancelStatisticsRequests();
  await jest.advanceTimersByTimeAsync(2000);
  expect(await request).toBeUndefined();
  expect(ajaxMock).toHaveBeenCalledTimes(1);
  expect(statisticsAreLoading()).toBe(false);
});

test('loading stays true until every concurrent request finishes', async () => {
  let finish!: (value: ReturnType<typeof result>) => void;
  ajaxMock
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        })
    )
    .mockResolvedValueOnce(result(Http.OK));
  const first = statisticsAjax('/stats/one/', options);
  await statisticsAjax('/stats/two/', options);
  expect(statisticsAreLoading()).toBe(true);
  finish(result(Http.OK));
  await first;
  expect(statisticsAreLoading()).toBe(false);
});

test('request failures propagate and clear loading', async () => {
  ajaxMock.mockRejectedValueOnce(new Error('request failed'));
  await expect(
    statisticsAjax('/stats/collection/preparations/', options)
  ).rejects.toThrow('request failed');
  expect(statisticsAreLoading()).toBe(false);
});

test('permission errors are not retried', async () => {
  ajaxMock.mockResolvedValueOnce(result(Http.FORBIDDEN));
  const response = await statisticsAjax('/stored_query/ephemeral/', {
    ...options,
    expectedErrors: [Http.FORBIDDEN],
  });
  expect(response?.status).toBe(Http.FORBIDDEN);
  expect(ajaxMock).toHaveBeenCalledTimes(1);
});
