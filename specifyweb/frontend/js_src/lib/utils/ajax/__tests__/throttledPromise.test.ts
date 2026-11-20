import {
  cleanThrottledPromises,
  networkRequestsSpec,
  throttledPromise,
} from '../throttledPromise';

afterEach(() => {
  cleanThrottledPromises();
  expect(networkRequestsSpec.backendStats.currentRequests).toHaveLength(0);
  expect(networkRequestsSpec.queryStats.currentRequests).toHaveLength(0);
});

test('refresh does not discard active requests or bypass concurrency limits', async () => {
  let finish!: (value: number) => void;
  const first = throttledPromise(
    'backendStats',
    async () =>
      new Promise<number>((resolve) => {
        finish = resolve;
      }),
    'first'
  );
  cleanThrottledPromises(false);
  const next = jest.fn(async () => 2);
  const second = throttledPromise('backendStats', next, 'second');
  expect(next).not.toHaveBeenCalled();
  finish(1);
  await expect(first).resolves.toBe(1);
  await expect(second).resolves.toBe(2);
});

test('cleanup cancels queued requests but retains active request accounting', async () => {
  let finish!: (value: number) => void;
  const first = throttledPromise(
    'backendStats',
    async () =>
      new Promise<number>((resolve) => {
        finish = resolve;
      }),
    'first'
  );
  const next = jest.fn(async () => 2);
  const second = throttledPromise('backendStats', next, 'second');
  cleanThrottledPromises();
  expect(networkRequestsSpec.backendStats.currentRequests).toHaveLength(1);
  finish(1);
  await first;
  await expect(second).resolves.toBeUndefined();
  expect(next).not.toHaveBeenCalled();
});

test('rejected requests propagate errors and release their slot', async () => {
  const first = throttledPromise(
    'backendStats',
    async () => {
      throw new Error('failed');
    },
    'first'
  );
  const second = throttledPromise('backendStats', async () => 2, 'second');
  await expect(first).rejects.toThrow('failed');
  await expect(second).resolves.toBe(2);
});

test('identical requests are deduplicated within a request group', async () => {
  const calculate = jest.fn(async () => 12);
  await expect(
    Promise.all([
      throttledPromise('queryStats', calculate, 'same'),
      throttledPromise('queryStats', calculate, 'same'),
    ])
  ).resolves.toEqual([12, 12]);
  expect(calculate).toHaveBeenCalledTimes(1);
});

test('matching specifications in different groups do not share results', async () => {
  await expect(
    Promise.all([
      throttledPromise('backendStats', async () => 'backend', 'same'),
      throttledPromise('queryStats', async () => 'query', 'same'),
    ])
  ).resolves.toEqual(['backend', 'query']);
});
