import type { State } from 'typesafe-reducer';

import type { IR, R, RA } from '../../utils/types';
import { setDevelopmentGlobal } from '../../utils/types';
import { replaceItem } from '../../utils/utils';
import type { LogMessage } from './interceptLogs';

let context: R<unknown> = {};
let contextTimeout: ReturnType<typeof setTimeout> | undefined = undefined;
export const getLogContext = (): IR<unknown> => context;
setDevelopmentGlobal('_getLogContext', getLogContext);

export function setLogContext(newContext: IR<unknown>): void {
  context = newContext;

  /*
   * Reset context on next cycle. This way, you don't have to clear it manually.
   * Things like form parsing are done in a single cycle, so this works
   * perfectly.
   */
  if (contextTimeout === undefined)
    contextTimeout = setTimeout(() => {
      context = {};
      contextTimeout = undefined;
    }, 0);
}

type BasePathPart = { readonly extras?: IR<unknown> };
export type LogPathPart = BasePathPart &
  (
    | State<'Attribute', { readonly attribute: string }>
    | State<'Child', { readonly tagName: string }>
    | State<'Children', { readonly tagName: string }>
    | State<'Content'>
    | State<'Index', { readonly index: number }>
    | State<'Root', { readonly node: unknown }>
  );

/**
 * Add context to errors and validation messages
 */
export const pushContext = (part: LogPathPart): void =>
  modifyContext((path) => [...path, part]);

function modifyContext(
  callback: (path: RA<BasePathPart>) => RA<BasePathPart>
): void {
  const rawPath = getLogContext()[pathKey] ?? [];
  const path: RA<BasePathPart> = Array.isArray(rawPath)
    ? rawPath
    : rawPath === undefined
      ? []
      : [rawPath];
  const newPath = callback(path);
  setLogContext({
    ...getLogContext(),
    [pathKey]: newPath.length === 0 ? undefined : newPath,
  });
}

export const addContext = (data: IR<unknown>): void =>
  modifyContext((path) =>
    replaceItem(path, -1, {
      ...path.at(-1),
      extras: {
        ...path.at(-1)?.extras,
        ...data,
      },
    })
  );

export const pathKey = 'path';
export const sharedContextKey = 'sharedContext:';

/**
 * When parsing XML, each log statement has the entire XML document in it's
 * context. When serializing context, this would inflate the file size by a lot.
 * Instead, this function finds the common context between messages, and prints
 * it only once.
 *
 * Without this, JSON.stringify threw an out of memory error at one point!
 */
export function deduplicateLogContext(log: RA<LogMessage>): {
  readonly consoleLog: RA<LogMessage>;
  readonly sharedLogContext: RA<unknown>;
} {
  const map = new Map<unknown, number>();

  function cache(value: unknown): void {
    const count = map.get(value) ?? 0;
    map.set(value, count + 1);
  }

  log.forEach(({ context }) =>
    Object.values(context).forEach((value) => {
      if (typeof value !== 'object' || value === null) return;
      if (Array.isArray(value))
        value.forEach((item) =>
          typeof item === 'object' ? cache(value) : undefined
        );
      else cache(value);
    })
  );

  const sharedLogContext = Array.from(map.entries())
    .filter(([_value, useCount]) => useCount > 1)
    .map(([value]) => value);

  function replace(value: unknown, isTop = true): unknown {
    const index = sharedLogContext.indexOf(value);
    if (index === -1) return value;
    return Array.isArray(value) && isTop
      ? value.map((item) => replace(item, false))
      : `${sharedContextKey}${index}`;
  }

  const newLog = log.map(({ context, ...rest }) => ({
    ...rest,
    context: Object.fromEntries(
      Object.entries(context).map(([key, value]) => [key, replace(value)])
    ),
  }));

  return { consoleLog: newLog, sharedLogContext };
}
