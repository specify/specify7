import React from 'react';

import { useResponsiveSplitView } from '../../hooks/useResponsiveSplitView';
import type { RA } from '../../utils/types';
import { userPreferences } from '../Preferences/userPreferences';
import type { QueryResultRow } from './Results';
import { useSplitViewOrientation } from './SplitView';

export function useQuerySplitView(queryRunCount: number): {
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

  // Clear the parent-owned selection on a new query run, but not on
  // orientation changes (isSplit/isHorizontal don't affect this effect)
  const previousQueryRunCountRef = React.useRef(queryRunCount);
  React.useEffect(() => {
    if (queryRunCount === previousQueryRunCountRef.current) return;
    previousQueryRunCountRef.current = queryRunCount;
    setSelectedRows(new Set());
    setSelectedIndex(0);
  }, [queryRunCount]);

  const toggleSplit = (): void => {
    setIsSplit((split) => !split);
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
    onResults: (): void => undefined,
  };
}
