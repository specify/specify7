import type React from 'react';
import _ from 'underscore';

import { ajax } from './ajax';
import { transitionDuration } from './components/basic';
import type { RA, RR } from './types';

export const fetchRows = async (fetchUrl: string) =>
  ajax<
    RA<
      Readonly<
        [
          number,
          string,
          string,
          number,
          number,
          number,
          number | null,
          string | null,
          number
        ]
      >
    >
  >(fetchUrl, {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    headers: { Accept: 'application/json' },
  }).then(({ data: rows }) =>
    rows.map(
      (
        [
          nodeId,
          name,
          fullName,
          nodeNumber,
          highestNodeNumber,
          rankId,
          acceptedId,
          acceptedName,
          children,
        ],
        index,
        { length }
      ) => ({
        nodeId,
        name,
        fullName,
        nodeNumber,
        highestNodeNumber,
        rankId,
        acceptedId: acceptedId ?? undefined,
        acceptedName: acceptedName ?? undefined,
        children,
        isLastChild: index + 1 === length,
      })
    )
  );

export type Stats = RR<
  number,
  {
    readonly directCount: number;
    readonly childCount: number;
  }
>;

export const fetchStats = async (url: string): Promise<Stats> =>
  ajax<RA<Readonly<[number, number, number]>>>(
    url,
    {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      headers: { Accept: 'application/json' },
    },
    { strict: false }
  )
    .then(({ data }) =>
      Object.fromEntries(
        data.map(([childId, directCount, allCount]) => [
          childId,
          {
            directCount,
            childCount: allCount - directCount,
          },
        ])
      )
    )
    .catch(() => {
      return {};
    });

export type Row = Awaited<ReturnType<typeof fetchRows>>[number];

/**
 * Conditional Pipe. Like Ramda's lenses
 */
export const pipe = <T, V>(
  value: T,
  condition: boolean,
  mapper: (value: T) => V
): T | V => (condition ? mapper(value) : value);

export type Conformations = RA<Conformation>;

export interface Conformation extends Readonly<[number, ...Conformations]> {}

export function deserializeConformation(
  conformation: string | undefined
): Conformations | undefined {
  if (typeof conformation === 'undefined') return undefined;
  const serialized = conformation
    .replace(/([^~])~/g, '$1,~')
    .replaceAll('~', '[')
    .replaceAll('-', ']');
  try {
    return JSON.parse(serialized) as Conformations;
  } catch {
    console.error('bad tree conformation:', serialized);
    return undefined;
  }
}

/**
 * Replace reserved url characters to avoid percent escaping. Also, commas are
 * superfluous since they precede every open bracket that is not itself preceded
 * by an open bracket by nature of the construction.
 */
export const serializeConformation = (
  conformation: Conformations | undefined
): string =>
  JSON.stringify(conformation)
    .replaceAll('[', '~')
    .replaceAll(']', '-')
    .replaceAll(',', '');

const throttleRate = 250;
export const scrollIntoView = _.throttle(function scrollIntoView(
  element: HTMLElement,
  mode: ScrollLogicalPosition = 'center'
): void {
  try {
    element.scrollIntoView({
      behavior: transitionDuration === 0 ? 'auto' : 'smooth',
      block: mode,
      inline: mode,
    });
  } catch {
    element.scrollIntoView(mode === 'start');
  }
},
throttleRate);

export type KeyAction =
  | 'toggle'
  | 'next'
  | 'previous'
  | 'parent'
  | 'child'
  | 'focusPrevious'
  | 'focusNext';
const keyMapper = {
  ArrowUp: 'previous',
  ArrowDown: 'next',
  ArrowLeft: 'parent',
  ArrowRight: 'child',
  Enter: 'toggle',
  Tab: 'focus',
} as const;

export function mapKey(
  event: React.KeyboardEvent<HTMLButtonElement>
): KeyAction | undefined {
  const action = keyMapper[event.key as keyof typeof keyMapper];
  if (typeof action === 'undefined') return undefined;

  event.preventDefault();
  event.stopPropagation();

  if (action === 'focus') return event.shiftKey ? 'focusPrevious' : 'focusNext';

  return action;
}
