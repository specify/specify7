import type { RA } from '../../../utils/types';
import type { LogMessage } from '../interceptLogs';
import {
  addContext,
  deduplicateLogContext,
  getLogContext,
  pathKey,
  pushContext,
  setLogContext,
} from '../logContext';

afterEach(() => setLogContext({}));

test('Initial context is empty', () => expect(getLogContext()).toEqual({}));

test('Can set and get log context', () => {
  setLogContext({ foo: 'bar' });
  expect(getLogContext()).toEqual({ foo: 'bar' });
});

test('Can push to context path', () => {
  pushContext({ type: 'Root', node: 'foo' });
  pushContext({ type: 'Child', tagName: 'test' });
  expect(getLogContext()).toEqual({
    [pathKey]: [
      { type: 'Root', node: 'foo' },
      { type: 'Child', tagName: 'test' },
    ],
  });
});

test('Can modify last pushed entry', () => {
  pushContext({ type: 'Root', node: 'foo' });
  addContext({ info: 'test' });
  expect(getLogContext()).toEqual({
    [pathKey]: [{ type: 'Root', node: 'foo', extras: { info: 'test' } }],
  });
});

test('Can deduplicate context in log messages', () => {
  const contexts = [
    { foo: { a: 'bar' } },
    { baz: { b: 'qux' } },
    { entry: 'test2' },
  ];
  const date = '2023-01-22T18:54:48.625Z';
  const log: RA<LogMessage> = [
    {
      message: ['A'],
      type: 'warn',
      context: { ...contexts[0], ...contexts[1] },
      date,
    },
    {
      message: ['B'],
      type: 'error',
      context: { ...contexts[0], ...contexts[2], test: 'abc' },
      date,
    },
    {
      message: ['B'],
      type: 'log',
      context: { ...contexts[2], ...contexts[1], test: 'abc3' },
      date,
    },
  ];
  expect(deduplicateLogContext(log)).toEqual({
    consoleLog: [
      {
        context: {
          baz: 'sharedContext:1',
          foo: 'sharedContext:0',
        },
        date: '2023-01-22T18:54:48.625Z',
        message: ['A'],
        type: 'warn',
      },
      {
        context: {
          entry: 'test2',
          foo: 'sharedContext:0',
          test: 'abc',
        },
        date: '2023-01-22T18:54:48.625Z',
        message: ['B'],
        type: 'error',
      },
      {
        context: {
          baz: 'sharedContext:1',
          entry: 'test2',
          test: 'abc3',
        },
        date: '2023-01-22T18:54:48.625Z',
        message: ['B'],
        type: 'log',
      },
    ],
    sharedLogContext: [
      {
        a: 'bar',
      },
      {
        b: 'qux',
      },
    ],
  });
});
