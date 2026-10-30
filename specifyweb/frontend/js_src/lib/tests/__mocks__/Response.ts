Object.defineProperty(globalThis, 'Response', {
  /**
   * Can't use an arrow function or method shorthand here because Response
   * should be invokable with "new" (as in "new Response()")
   */
  // eslint-disable-next-line object-shorthand
  value: function (
    _body: string | undefined,
    {
      status,
      headers = {},
    }: {
      readonly status: number;
      readonly statusText: string | undefined;
      readonly headers?: Readonly<Record<string, string>>;
    }
  ) {
    const normalizedHeaders = new Map(
      Object.entries(headers).map(([name, value]) => [
        name.toLowerCase(),
        value,
      ])
    );
    return Object.defineProperty(
      {
        status,
        statusText: '',
        ok: status >= 200 && status <= 299,
      },
      // Like a real Response, headers is not an own enumerable property
      'headers',
      {
        value: {
          get: (name: string) =>
            normalizedHeaders.get(name.toLowerCase()) ?? null,
        },
      }
    );
  },
});

export {};
