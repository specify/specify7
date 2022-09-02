Object.defineProperty(globalThis, 'performance', {
  value: {
    getEntries: () => ['This is a test environment'],
  },
});

export {};
