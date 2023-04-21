Object.defineProperty(globalThis, 'ResizeObserver', {
  /**
   * Can't use an arrow function or method shorthand here because Response
   * should be invokable with "new" (as in "new ResizeObserver()")
   */
  // eslint-disable-next-line object-shorthand
  value: function () {
    return {
      observe: (): void => {},
      disconnect: (): void => {},
    };
  },
});

export {};
