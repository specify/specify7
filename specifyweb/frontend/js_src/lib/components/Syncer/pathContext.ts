import type { State } from 'typesafe-reducer';

import type { IR, RA } from '../../utils/types';
import { replaceItem } from '../../utils/utils';
import { getLogContext, setLogContext } from '../Errors/interceptLogs';

type BasePathPart = { readonly extras: IR<unknown> };
type PathPart = BasePathPart &
  (
    | State<'Attribute', { readonly attribute: string }>
    | State<'Child', { readonly tagName: string }>
    | State<'Children', { readonly tagName: string }>
    | State<'Index', { readonly index: number }>
  );

/**
 * Add context to errors and validation messages
 */
export const pushContext = (part: PathPart): void =>
  modifyContext((path) => [...path, part]);

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

const key = 'path';

function modifyContext(
  callback: (path: RA<BasePathPart>) => RA<BasePathPart>
): void {
  const logContext = getLogContext()[key] ?? [];
  const path: RA<BasePathPart> = Array.isArray(logContext)
    ? logContext
    : logContext === undefined
    ? []
    : [logContext];
  const newPath = callback(path);
  setLogContext({ [key]: newPath.length === 0 ? undefined : newPath });
}
