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
