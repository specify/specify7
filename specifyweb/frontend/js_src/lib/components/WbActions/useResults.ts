import type Handsontable from 'handsontable';
import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { f } from '../../utils/functools';
import type { WbCellCounts } from '../WorkBench/CellMeta';
import { getHotPlugin, identifyDefaultValues } from '../WorkBench/handsontable';
import type { Workbench } from '../WorkBench/WbView';

export function useResults({
  hot,
  workbench,
  triggerDatasetRefresh,
  cellCounts,
}: {
  readonly hot: Handsontable | undefined;
  readonly workbench: Workbench;
  readonly triggerDatasetRefresh: () => void;
  readonly cellCounts: WbCellCounts;
}): {
  readonly showResults: boolean;
  readonly closeResults: () => void;
  readonly toggleResults: () => void;
} {
  const [showResults, _, closeResults, toggleResults] = useBooleanState();

  const initialHiddenRows = React.useMemo(
    () =>
      hot === undefined ? [] : getHotPlugin(hot, 'hiddenRows').getHiddenRows(),
    [hot, workbench.dataset.columns]
  );
  const initialHiddenCols = React.useMemo(
    () =>
      hot === undefined
        ? []
        : getHotPlugin(hot, 'hiddenColumns').getHiddenColumns(),
    [hot, workbench.dataset.columns]
  );

  // Update hidden rows/columns when results panel opens or cell counts change
  React.useEffect(() => {
    if (hot === undefined || !showResults) return;

    const rowsToInclude = new Set<number>();
    const colsToInclude = new Set<number>();
    Object.entries(workbench.cells.cellMeta).forEach(([physicalRow, rowMeta]) =>
      rowMeta.forEach((metaArray, physicalCol) => {
        if (workbench.cells.isResultCell(metaArray)) {
          rowsToInclude.add(f.fastParseInt(physicalRow));
          colsToInclude.add(physicalCol);
        }
      })
    );
    const physicalRowsToHide = workbench.data
      .map((_, physicalRow) => physicalRow)
      .filter(
        (physicalRow) =>
          !rowsToInclude.has(physicalRow) &&
          !initialHiddenRows.includes(physicalRow)
      );
    const physicalColsToHide = workbench.dataset.columns
      .map((_, physicalCol) => physicalCol)
      .filter(
        (physicalCol) =>
          !colsToInclude.has(physicalCol) &&
          !initialHiddenCols.includes(physicalCol)
      );

    hot.batch(() => {
      identifyDefaultValues(hot, workbench.mappings);
      const hiddenRowsPlugin = getHotPlugin(hot, 'hiddenRows');
      const hiddenColsPlugin = getHotPlugin(hot, 'hiddenColumns');
      hiddenRowsPlugin.showRows(
        hiddenRowsPlugin
          .getHiddenRows()
          .filter((visualRow) => !initialHiddenRows.includes(visualRow))
      );
      hiddenColsPlugin.showColumns(
        hiddenColsPlugin
          .getHiddenColumns()
          .filter((visualCol) => !initialHiddenCols.includes(visualCol))
      );
      hiddenRowsPlugin.hideRows(physicalRowsToHide.map(hot.toVisualRow));
      hiddenColsPlugin.hideColumns(physicalColsToHide.map(hot.toVisualColumn));
      workbench.utils.toggleCellTypes('newCells', 'remove');
    });
  }, [showResults, cellCounts]);

  // Clean up hidden rows/columns when results panel closes
  React.useEffect(() => {
    if (hot === undefined || showResults) return;

    const rowsToShow = getHotPlugin(hot, 'hiddenRows')
      .getHiddenRows()
      .filter((visualRow) => !initialHiddenRows.includes(visualRow));
    const colsToShow = getHotPlugin(hot, 'hiddenColumns')
      .getHiddenColumns()
      .filter((visualCol) => !initialHiddenCols.includes(visualCol));

    hot.batch(() => {
      getHotPlugin(hot, 'hiddenRows').showRows(rowsToShow);
      getHotPlugin(hot, 'hiddenColumns').showColumns(colsToShow);
    });
    triggerDatasetRefresh();
  }, [showResults]);

  return { showResults, closeResults, toggleResults };
}
