import { ajax } from '../index';

const response = (text: string): Response =>
  Object.assign(new Response(undefined, { status: 200 }), {
    text: async () => text,
  });

test('a fresh GET waits for an in-flight GET instead of reusing it', async () => {
  const originalEnvironment = process.env.NODE_ENV;
  const originalFetch = globalThis.fetch;
  let resolveFirst!: (response: Response) => void;
  const fetchMock = jest
    .fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>()
    .mockReturnValueOnce(new Promise((resolve) => (resolveFirst = resolve)))
    .mockResolvedValueOnce(response('fresh'));

  try {
    process.env.NODE_ENV = 'production';
    globalThis.fetch = fetchMock;
    const first = ajax('/test-pending-refresh', { headers: {} });
    const normal = ajax('/test-pending-refresh', { headers: {} });
    const refresh = ajax('/test-pending-refresh', {
      headers: {},
      waitForPendingGet: true,
    });
    const anotherRefresh = ajax('/test-pending-refresh', {
      headers: {},
      waitForPendingGet: true,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    resolveFirst(response('old'));
    expect((await first).data).toBe('old');
    expect((await normal).data).toBe('old');
    expect((await refresh).data).toBe('fresh');
    expect((await anotherRefresh).data).toBe('fresh');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][1]).not.toHaveProperty('waitForPendingGet');
  } finally {
    process.env.NODE_ENV = originalEnvironment;
    if (originalFetch === undefined)
      Reflect.deleteProperty(globalThis, 'fetch');
    else globalThis.fetch = originalFetch;
  }
});

test('a fresh GET proceeds when the in-flight GET fails', async () => {
  const originalEnvironment = process.env.NODE_ENV;
  const originalFetch = globalThis.fetch;
  let resolveFirst!: (response: Response) => void;
  const fetchMock = jest
    .fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>()
    .mockReturnValueOnce(new Promise((resolve) => (resolveFirst = resolve)))
    .mockResolvedValueOnce(response('{"value":"fresh"}'));
  const consoleError = jest
    .spyOn(console, 'error')
    .mockImplementation(() => {});

  try {
    process.env.NODE_ENV = 'production';
    globalThis.fetch = fetchMock;
    const options = {
      headers: { Accept: 'application/json' as const },
      errorMode: 'silent' as const,
    };
    const first = ajax('/test-failed-pending-refresh', options);
    const failure = expect(first).rejects.toBeDefined();
    const refresh = ajax<{ readonly value: string }>(
      '/test-failed-pending-refresh',
      { ...options, waitForPendingGet: true }
    );

    resolveFirst(response('invalid json'));
    await failure;
    expect((await refresh).data).toEqual({ value: 'fresh' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  } finally {
    process.env.NODE_ENV = originalEnvironment;
    if (originalFetch === undefined)
      Reflect.deleteProperty(globalThis, 'fetch');
    else globalThis.fetch = originalFetch;
    consoleError.mockRestore();
  }
});
