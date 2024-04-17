import type Handsontable from 'handsontable';
import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { getHotPlugin } from '../WorkBench/handsontable';
import type { Workbench } from '../WorkBench/WbView';

export function useResults({
  hot,
  workbench,
}: {
  readonly hot: Handsontable | undefined;
  readonly workbench: Workbench;
}) {
  const [showResults, _, closeResults, toggleResults] = useBooleanState();

  const initialHiddenRows = React.useMemo(
    () =>
      hot === undefined ? [] : getHotPlugin(hot, 'hiddenRows').getHiddenRows(),
    [hot]
  );
  const initialHiddenCols = React.useMemo(
    () =>
      hot === undefined
        ? []
        : getHotPlugin(hot, 'hiddenColumns').getHiddenColumns(),
    [hot]
  );

  // Makes the hot changes required for upload view results
  React.useEffect(() => {
    if (hot === undefined) return;

    const rowsToInclude = new Set();
    const colsToInclude = new Set();
    Object.entries(workbench.cells.cellMeta).forEach(([physicalRow, rowMeta]) =>
      rowMeta.forEach((metaArray, physicalCol) => {
        if (!workbench.cells.getCellMetaFromArray(metaArray, 'isNew')) return;
        rowsToInclude.add((physicalRow as unknown as number) | 0);
        colsToInclude.add(physicalCol);
      })
    );
    const rowsToHide = workbench.data
      .map((_, physicalRow) => physicalRow)
      .filter(
        (physicalRow) =>
          !rowsToInclude.has(physicalRow) &&
          !initialHiddenRows.includes(physicalRow)
      )
      .map(hot.toVisualRow);
    const colsToHide = workbench.dataset.columns
      .map((_, physicalCol) => physicalCol)
      .filter(
        (physicalCol) =>
          !colsToInclude.has(physicalCol) &&
          !initialHiddenCols.includes(physicalCol)
      )
      .map(hot.toVisualColumn);

    if (showResults) {
      getHotPlugin(hot, 'hiddenRows').hideRows(rowsToHide);
      getHotPlugin(hot, 'hiddenColumns').hideColumns(colsToHide);

      workbench.utils.toggleCellTypes('newCells', 'remove');
    } else {
      getHotPlugin(hot, 'hiddenRows').showRows(
        rowsToHide.filter((visualRow) => !initialHiddenRows.includes(visualRow))
      );
      getHotPlugin(hot, 'hiddenColumns').showColumns(
        colsToHide.filter((visualCol) => !initialHiddenCols.includes(visualCol))
      );
    }

    hot.render();
  }, [showResults]);

  return { showResults, closeResults, toggleResults };
}
