import type React from 'react';
import type { RA } from '../../../utils/types';
import type { Workbench } from '../../WorkBench/WbView';
import { WbUtils } from '../Utils';

type Cell = {
  readonly value: string;
  readonly readOnly?: boolean;
  readonly isSearchResult?: boolean;
};

const cell = (value: string, extra: Omit<Cell, 'value'> = {}): Cell => ({
  value,
  isSearchResult: true,
  ...extra,
});

function buildWorkbench(
  grid: RA<RA<Cell>>,
  selected: readonly [number, number] = [0, 0]
) {
  const setDataAtCell = jest.fn();
  const at = (row: number, col: number): Cell | undefined => grid[row]?.[col];

  const workbench = {
    hot: {
      toVisualRow: (row: number) => row,
      toVisualColumn: (col: number) => col,
      toPhysicalRow: (row: number) => row,
      toPhysicalColumn: (col: number) => col,
      getDataAtCell: (row: number, col: number) => at(row, col)?.value ?? '',
      getCellMeta: (row: number, col: number) => ({
        readOnly: at(row, col)?.readOnly === true,
      }),
      getSelectedLast: () => selected,
      setDataAtCell,
    },
    cells: {
      cellMeta: Object.fromEntries(
        grid.map((row, rowIndex) => [
          rowIndex,
          Object.fromEntries(row.map((cell, colIndex) => [colIndex, cell])),
        ])
      ),
      getCellMetaFromArray: (meta: Cell, key: string) =>
        key === 'isSearchResult' ? meta.isSearchResult === true : undefined,
      cellIsType: (meta: Cell | undefined, type: string) =>
        type === 'searchResults' && meta?.isSearchResult === true,
      // Navigating away is out of scope here, so there is nothing to walk
      getCellMetaObject: () => [],
    },
  };

  return { setDataAtCell, workbench: workbench as unknown as Workbench };
}

const enterKey = { key: 'Enter' } as React.KeyboardEvent<HTMLInputElement>;
const replacement = { value: 'new' } as HTMLInputElement;

const buildUtils = (
  workbench: Workbench,
  replaceMode: 'replaceAll' | 'replaceNext'
): WbUtils => {
  const utils = new WbUtils(workbench, { current: null });
  utils.searchQuery = 'old';
  utils.searchPreferences = {
    ...utils.searchPreferences,
    replace: { replaceMode },
  };
  return utils;
};