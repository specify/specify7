import React from 'react';

import type { RA } from '../../utils/types';
import { queryIdField, type QueryResultRow } from './Results';

export function useQuerySplitView(
  resultsRef: React.MutableRefObject<RA<QueryResultRow | undefined> | undefined>
): {
  readonly selectedRows: ReadonlySet<number>;
  readonly setSelectedRows: React.Dispatch<
    React.SetStateAction<ReadonlySet<number>>
  >;
  readonly selectedIndex: number;
  readonly setSelectedIndex: React.Dispatch<React.SetStateAction<number>>;
  readonly isSplit: boolean;
  readonly isHorizontal: boolean;
  readonly splitterKey: number;
  readonly toggleSplit: () => void;
  readonly toggleOrientation: () => void;
} {
  const [selectedRows, setSelectedRows] = React.useState<ReadonlySet<number>>(
    new Set()
  );
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [isSplit, setIsSplit] = React.useState(false);
  const [isHorizontal, setIsHorizontal] = React.useState(true);
  const [splitterKey, setSplitterKey] = React.useState(0);

  const toggleSplit = (): void => {
    const nextIsSplit = !isSplit;
    setIsSplit(nextIsSplit);
    if (nextIsSplit && selectedRows.size === 0) {
      const firstId = resultsRef.current?.find(
        (result) => result !== undefined
      )?.[queryIdField];
      if (typeof firstId === 'number') {
        setSelectedRows(new Set([firstId]));
        setSelectedIndex(0);
      }
    }
  };
  const toggleOrientation = (): void => {
    setIsHorizontal(!isHorizontal);
    setSplitterKey((key) => key + 1);
  };

  return {
    selectedRows,
    setSelectedRows,
    selectedIndex,
    setSelectedIndex,
    isSplit,
    isHorizontal,
    splitterKey,
    toggleSplit,
    toggleOrientation,
  };
}
