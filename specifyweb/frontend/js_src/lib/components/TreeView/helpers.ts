import type React from 'react';
import _ from 'underscore';

import { commonText } from '../../localization/common';
import { treeText } from '../../localization/tree';
import { ajax } from '../../utils/ajax';
import type { RA, RR } from '../../utils/types';
import { filterArray } from '../../utils/types';
import type { AnyTree } from '../DataModel/helperTypes';
import { schema } from '../DataModel/schema';
import { softFail } from '../Errors/Crash';
import { strictGetTreeDefinitionItems } from '../InitialContext/treeRanks';
import { getTransitionDuration } from '../Preferences/Hooks';

export const fetchRows = async (fetchUrl: string) =>
  ajax<
    RA<
      readonly [
        number,
        string,
        string,
        number,
        number,
        number,
        number | null,
        string | null,
        string,
        number
      ]
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
          acceptedId = undefined,
          acceptedName = undefined,
          author = undefined,
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
        acceptedId,
        acceptedName,
        author,
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

/**
 * Fetch tree node usage stats
 */
export const fetchStats = async (url: string): Promise<Stats> =>
  ajax<RA<readonly [number, number, number]>>(
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
    .catch(() => ({}));

export type Row = Awaited<ReturnType<typeof fetchRows>>[number];

export type Conformations = RA<Conformation>;

/* eslint-disable @typescript-eslint/consistent-type-definitions */

// eslint-disable-next-line functional/prefer-readonly-type
export interface Conformation extends Readonly<[number, ...Conformations]> {}

/* eslint-enable @typescript-eslint/consistent-type-definitions */

export function deserializeConformation(
  conformation: string
): Conformations | undefined {
  if (conformation === '') return undefined;
  const serialized = conformation
    .replaceAll(/([^~])~/g, '$1,~')
    .replaceAll('~', '[')
    .replaceAll('-', ']');
  try {
    return JSON.parse(serialized) as Conformations;
  } catch {
    softFail(new Error('bad tree conformation:'), serialized);
    return undefined;
  }
}

/**
 * Replace reserved url characters to avoid percent escaping. Also, commas are
 * superfluous since they precede every open bracket that is not itself preceded
 * by an open bracket by nature of the construction.
 */
export function serializeConformation(
  conformation: Conformations | undefined
): string | undefined {
  const value = JSON.stringify(conformation)
    .replaceAll('[', '~')
    .replaceAll(']', '-')
    .replaceAll(',', '');
  return value === '~~' ? undefined : value;
}

const throttleRate = 250;
export const scrollIntoView = _.throttle(function scrollIntoView(
  element: HTMLElement,
  mode: ScrollLogicalPosition = 'center'
): void {
  try {
    element.scrollIntoView({
      behavior: getTransitionDuration() === 0 ? 'auto' : 'smooth',
      block: mode,
      inline: mode,
    });
  } catch {
    element.scrollIntoView(mode === 'start');
  }
},
throttleRate);

export type KeyAction =
  | 'child'
  | 'focusNext'
  | 'focusPrevious'
  | 'next'
  | 'parent'
  | 'previous'
  | 'toggle';
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
  if (action === undefined) return undefined;

  event.preventDefault();
  event.stopPropagation();

  if (action === 'focus') return event.shiftKey ? 'focusPrevious' : 'focusNext';

  return action;
}

export const formatTreeStats = (
  nodeStats: Stats[number],
  isLeaf: boolean
): {
  readonly title: string;
  readonly text: string;
} => ({
  title: filterArray([
    commonText.colonLine({
      label: treeText.directCollectionObjectCount({
        collectionObjectTable: schema.models.CollectionObject.label,
      }),
      value: nodeStats.directCount.toString(),
    }),
    isLeaf
      ? undefined
      : commonText.colonLine({
          label: treeText.indirectCollectionObjectCount({
            collectionObjectTable: schema.models.CollectionObject.label,
          }),
          value: nodeStats.childCount.toString(),
        }),
  ]).join('\n'),
  text: isLeaf
    ? treeText.leafNodeStats({ directCount: nodeStats.directCount })
    : treeText.nodeStats({
        directCount: nodeStats.directCount,
        childCount: nodeStats.childCount,
      }),
});

/**
 * Check if there are any enforced ranks between current tree node parent
 * and the proposed tree node parent.
 * Fixes https://github.com/specify/specify7/issues/915
 */
export function checkMoveViolatesEnforced(
  tableName: AnyTree['tableName'],
  newParenRankId: number,
  currentRankId: number
): boolean {
  const treeRanks = strictGetTreeDefinitionItems(tableName, true);
  const currentRankIndex = treeRanks.findIndex(
    ({ rankId }) => rankId === currentRankId
  );
  const currentParentRankIndex = currentRankIndex - 1;
  const newParentRankIndex = treeRanks.findIndex(
    ({ rankId }) => rankId === newParenRankId
  );
  /*
   * Check for enforced ranks between children of newParentRankIndex and
   * currentParentRankIndex
   */
  return treeRanks
    .slice(newParentRankIndex + 1, currentParentRankIndex)
    .some(({ isEnforced }) => isEnforced);
}
