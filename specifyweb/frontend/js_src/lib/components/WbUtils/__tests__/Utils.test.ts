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
      getCellMetaObject: () => [],
    },
  };

  return { setDataAtCell, workbench: workbench as unknown as Workbench };
}

const enterKey = { key: 'Enter' } as React.KeyboardEvent<HTMLInputElement>;
const replacement = { value: 'new' } as HTMLInputElement;

const buildUtilities = (
  workbench: Workbench,
  replaceMode: 'replaceAll' | 'replaceNext'
): WbUtils => {
  const utilities = new WbUtils(workbench, { current: null });
  utilities.searchQuery = 'old';
  utilities.searchPreferences = {
    ...utilities.searchPreferences,
    replace: { replaceMode },
  };
  return utilities;
};

describe('replaceCells, replace all', () => {
  test('replaces every editable cell that matched the search', () => {
    const { workbench, setDataAtCell } = buildWorkbench([
      [cell('old'), cell('old')],
    ]);
    buildUtilities(workbench, 'replaceAll').replaceCells(enterKey, replacement);
    expect(setDataAtCell).toHaveBeenCalledWith([
      [0, 0, 'new'],
      [0, 1, 'new'],
    ]);
  });

  test('leaves read only cells alone', () => {
    const { workbench, setDataAtCell } = buildWorkbench([
      [cell('old'), cell('old', { readOnly: true })],
    ]);
    buildUtilities(workbench, 'replaceAll').replaceCells(enterKey, replacement);
    expect(setDataAtCell).toHaveBeenCalledWith([[0, 0, 'new']]);
  });

  test('replaces nothing when every match is read only', () => {
    const { workbench, setDataAtCell } = buildWorkbench([
      [cell('old', { readOnly: true }), cell('old', { readOnly: true })],
    ]);
    buildUtilities(workbench, 'replaceAll').replaceCells(enterKey, replacement);
    expect(setDataAtCell).toHaveBeenCalledWith([]);
  });

  test('skips cells that did not match the search', () => {
    const { workbench, setDataAtCell } = buildWorkbench([
      [cell('old'), cell('other', { isSearchResult: false })],
    ]);
    buildUtilities(workbench, 'replaceAll').replaceCells(enterKey, replacement);
    expect(setDataAtCell).toHaveBeenCalledWith([[0, 0, 'new']]);
  });

  test('skips empty cells so defaults are not overwritten', () => {
    const { workbench, setDataAtCell } = buildWorkbench([
      [cell('old'), cell('')],
    ]);
    buildUtilities(workbench, 'replaceAll').replaceCells(enterKey, replacement);
    expect(setDataAtCell).toHaveBeenCalledWith([[0, 0, 'new']]);
  });

  test('ignores keys other than Enter', () => {
    const { workbench, setDataAtCell } = buildWorkbench([[cell('old')]]);
    buildUtilities(workbench, 'replaceAll').replaceCells(
      { key: 'a' } as React.KeyboardEvent<HTMLInputElement>,
      replacement
    );
    expect(setDataAtCell).not.toHaveBeenCalled();
  });
});

describe('replaceCells, replace next', () => {
  test('replaces the selected cell when it is editable', () => {
    const { workbench, setDataAtCell } = buildWorkbench([[cell('old')]]);
    buildUtilities(workbench, 'replaceNext').replaceCells(
      enterKey,
      replacement
    );
    expect(setDataAtCell).toHaveBeenCalledWith(0, 0, 'new');
  });

  test('refuses to replace the selected cell when it is read only', () => {
    const { workbench, setDataAtCell } = buildWorkbench([
      [cell('old', { readOnly: true })],
    ]);
    buildUtilities(workbench, 'replaceNext').replaceCells(
      enterKey,
      replacement
    );
    expect(setDataAtCell).not.toHaveBeenCalled();
  });
});
