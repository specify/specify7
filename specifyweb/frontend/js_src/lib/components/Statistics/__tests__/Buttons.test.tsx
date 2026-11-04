import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { statsText } from '../../../localization/stats';
import { ajax } from '../../../utils/ajax';
import { Http } from '../../../utils/ajax/definitions';
import {
  cleanThrottledPromises,
  throttledPromise,
} from '../../../utils/ajax/throttledPromise';
import { StatsRefreshButton } from '../Buttons';
import { statisticsAjax } from '../requests';

jest.mock('../../../utils/ajax', () => ({ ajax: jest.fn() }));

afterEach(() => cleanThrottledPromises());

test('Refresh is disabled and ignores clicks until requests finish', async () => {
  let finish!: (value: {
    readonly status: number;
    readonly data: { readonly count: number };
    readonly response: Response;
  }) => void;
  jest.mocked(ajax).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      })
  );
  const refreshPage = jest.fn();
  render(<StatsRefreshButton onClick={refreshPage} />);
  const refresh = screen.getByRole('button', { name: statsText.refresh() });
  expect(refresh).toBeEnabled();
  let request!: ReturnType<typeof statisticsAjax>;
  act(() => {
    request = statisticsAjax('/stored_query/ephemeral/', {
      method: 'POST',
      headers: { Accept: 'application/json' },
    });
  });
  expect(refresh).toBeDisabled();
  fireEvent.click(refresh);
  expect(refreshPage).not.toHaveBeenCalled();
  await act(async () => {
    finish({
      status: Http.OK,
      data: { count: 12 },
      response: new Response(undefined, { status: Http.OK }),
    });
    await request;
  });
  expect(refresh).toBeEnabled();
  fireEvent.click(refresh);
  expect(refreshPage).toHaveBeenCalledTimes(1);
});

test('Refresh is disabled for queued requests before their network request starts', async () => {
  let finish!: (value: number) => void;
  const running = throttledPromise(
    'backendStats',
    () =>
      new Promise<number>((resolve) => {
        finish = resolve;
      }),
    'running'
  );
  const calculate = jest.fn(async () => 2);
  const queued = throttledPromise('backendStats', calculate, 'queued');
  render(<StatsRefreshButton onClick={jest.fn()} />);
  const refresh = screen.getByRole('button', { name: statsText.refresh() });
  expect(calculate).not.toHaveBeenCalled();
  expect(refresh).toBeDisabled();
  await act(async () => {
    finish(1);
    await Promise.all([running, queued]);
  });
  expect(calculate).toHaveBeenCalledTimes(1);
  expect(refresh).toBeEnabled();
});
