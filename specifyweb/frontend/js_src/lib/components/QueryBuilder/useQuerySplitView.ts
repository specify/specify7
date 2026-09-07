import React from 'react';

import type { RA } from '../../utils/types';
import { listen } from '../../utils/events';
import { queryIdField, type QueryResultRow } from './Results';
import { useSplitViewOrientation } from './SplitView';
import { userPreferences } from '../Preferences/userPreferences';

const SMALL_SCREEN_WIDTH = 768;

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
  readonly canSplit: boolean;
  readonly isHorizontal: boolean;
  readonly toggleSplit: () => void;
  readonly toggleOrientation: () => void;
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
  const [canSplit, setCanSplit] = React.useState(
    window.innerWidth >= SMALL_SCREEN_WIDTH
  );
  React.useEffect(() => {
    const handleResize = (): void =>
      setCanSplit(window.innerWidth >= SMALL_SCREEN_WIDTH);
    handleResize();
    return listen(window, 'resize', handleResize);
  }, []);
  const isSplit = rawIsSplit && canSplit;
  const { isHorizontal, toggleOrientation } = useSplitViewOrientation(
    splitViewOrientation === 'horizontal'
  );

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
  return {
    selectedRows,
    setSelectedRows,
    selectedIndex,
    setSelectedIndex,
    isSplit,
    canSplit,
    isHorizontal,
    toggleSplit,
    toggleOrientation,
  };
}
