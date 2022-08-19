Object.defineProperty(globalThis, 'Response', {
  /**
   * Can't use an arrow function here because Response should be invokable
   * with "new" (as in "new Response()")
   */
  value: function (
    _body: string | undefined,
    {
      status,
    }: { readonly status: number; readonly statusText: string | undefined }
  ) {
    return {
      status,
      statusText: '',
      ok: status >= 200 && status <= 299,
    };
  },
});

export {};
