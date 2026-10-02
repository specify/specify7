import React from 'react';

import { useResponsiveSplitView } from '../../hooks/useResponsiveSplitView';
import type { RA } from '../../utils/types';
import { userPreferences } from '../Preferences/userPreferences';
import { queryIdField, type QueryResultRow } from './Results';
import { useSplitViewOrientation } from './SplitView';

export function useQuerySplitView(
  resultsRef: React.MutableRefObject<
    RA<QueryResultRow | undefined> | undefined
  >,
  queryRunCount: number
): {
  readonly selectedRows: ReadonlySet<number>;
  readonly setSelectedRows: React.Dispatch<
    React.SetStateAction<ReadonlySet<number>>
  >;
  readonly selectedIndex: number;
  readonly setSelectedIndex: React.Dispatch<React.SetStateAction<number>>;
  readonly isSplit: boolean;
  readonly canUseHorizontalSplit: boolean;
  readonly splitViewRef: React.RefCallback<HTMLDivElement>;
  readonly maximumPrimaryPaneWidth: number;
  readonly isHorizontal: boolean;
  readonly toggleSplit: () => void;
  readonly toggleOrientation: () => void;
  readonly onResults: (results: RA<QueryResultRow | undefined>) => void;
} {
  const [selectedRows, setSelectedRows] = React.useState<ReadonlySet<number>>(
    new Set()
  );
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [splitViewByDefault] = userPreferences.use(
    'queryBuilder',
    'general',
    'splitViewByDefault'
  );
  const [splitViewOrientation] = userPreferences.use(
    'queryBuilder',
    'general',
    'splitViewOrientation'
  );
  const [rawIsSplit, setIsSplit] = React.useState(splitViewByDefault);
  const isSplit = rawIsSplit;
  const { isHorizontal: preferredIsHorizontal, toggleOrientation } =
    useSplitViewOrientation(splitViewOrientation === 'horizontal');
  const {
    canUseHorizontalSplit,
    containerRef: splitViewRef,
    isHorizontal,
    maximumPrimaryPaneWidth,
  } = useResponsiveSplitView(preferredIsHorizontal);

  const selectFirstResult = React.useCallback((): boolean => {
    const firstId = resultsRef.current?.find(
      (result) => result !== undefined
    )?.[queryIdField];
    if (typeof firstId !== 'number') return false;
    setSelectedRows(new Set([firstId]));
    setSelectedIndex(0);
    return true;
  }, [resultsRef]);

  const [resultsVersion, setResultsVersion] = React.useState(0);
  const notifiedRunRef = React.useRef<number | undefined>(undefined);
  const queryRunCountRef = React.useRef(queryRunCount);
  queryRunCountRef.current = queryRunCount;
  const onResults = React.useCallback(
    (results: RA<QueryResultRow | undefined>): void => {
      const hasRow = results.some((result) => result !== undefined);
      const currentRun = queryRunCountRef.current;
      if (!hasRow || notifiedRunRef.current === currentRun) return;
      notifiedRunRef.current = currentRun;
      setResultsVersion((version) => version + 1);
    },
    []
  );

  // Clear the parent-owned selection on a new query run, but not on
  // orientation changes (isSplit/isHorizontal don't affect this effect)
  const previousQueryRunCountRef = React.useRef(queryRunCount);
  React.useEffect(() => {
    if (queryRunCount === previousQueryRunCountRef.current) return;
    previousQueryRunCountRef.current = queryRunCount;
    setSelectedRows(new Set());
    setSelectedIndex(0);
  }, [queryRunCount]);

  // Track transitions so clearing selection (e.g. on close) doesn't retrigger
  // a selection; only enabling split view or a fresh set of results should
  const previousIsSplitRef = React.useRef(false);
  const previousResultsVersionRef = React.useRef(resultsVersion);
  React.useEffect(() => {
    const splitJustEnabled = isSplit && !previousIsSplitRef.current;
    const newResultsArrived =
      resultsVersion !== previousResultsVersionRef.current;
    previousIsSplitRef.current = isSplit;
    previousResultsVersionRef.current = resultsVersion;
    if (
      isSplit &&
      selectedRows.size === 0 &&
      (splitJustEnabled || newResultsArrived)
    )
      selectFirstResult();
  }, [isSplit, resultsVersion, selectedRows.size, selectFirstResult]);

  const toggleSplit = (): void => {
    const nextIsSplit = !isSplit;
    setIsSplit(nextIsSplit);
    if (nextIsSplit && selectedRows.size === 0) selectFirstResult();
  };
  return {
    selectedRows,
    setSelectedRows,
    selectedIndex,
    setSelectedIndex,
    isSplit,
    canUseHorizontalSplit,
    splitViewRef,
    maximumPrimaryPaneWidth,
    isHorizontal,
    toggleSplit,
    toggleOrientation,
    onResults,
  };
}
