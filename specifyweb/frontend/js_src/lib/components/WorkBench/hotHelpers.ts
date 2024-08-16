import type Handsontable from 'handsontable';

import type { RA, RR, WritableArray } from '../../utils/types';
import { WbMapping } from './mapping';
import { Dataset } from '../WbPlanView/Wrapped';

export function getSelectedRegions(hot: Handsontable): RA<{
  readonly startRow: number;
  readonly startCol: number;
  readonly endRow: number;
  readonly endCol: number;
}> {
  const selectedRegions = hot.getSelected() ?? [[0, 0, 0, 0]];

  return selectedRegions
    .map((values) => values.map((value) => Math.max(0, value)))
    .map(([startRow, startCol, endRow, endCol]) => ({
      startRow: Math.min(startRow, endRow),
      endRow: Math.max(startRow, endRow),
      startCol: Math.min(startCol, endCol),
      endCol: Math.max(startCol, endCol),
    }));
}

/**
 * Get all selected cells from a desired set of columns
 */
export const getSelectedCells = (
  hot: Handsontable,
  columnsToWorkWith: RA<number>
): RR<number, ReadonlySet<number>> => {
  const selectedRegions = getSelectedRegions(hot);
  return (
    selectedRegions
      .flatMap(({ startRow, endRow, startCol, endCol }) =>
        Array.from({ length: endRow - startRow + 1 }, (_, rowIndex) =>
          Array.from({ length: endCol - startCol + 1 }, (_, colIndex) => [
            startRow + rowIndex,
            startCol + colIndex,
          ])
        )
      )
      .flat()
      // eslint-disable-next-line functional/prefer-readonly-type
      .reduce<Record<number, Set<number>>>(
        (indexedCells, [visualRow, visualCol]) => {
          if (!columnsToWorkWith.includes(visualCol)) return indexedCells;
          indexedCells[visualRow] ??= new Set();
          indexedCells[visualRow].add(visualCol);
          return indexedCells;
        },
        {}
      )
  );
};

/**
 * Get data set headers in the visual order
 */
export const getVisualHeaders = (
  hot: Handsontable,
  columns: RA<string>
): RA<string> =>
  columns.map((_, index, columns) => columns[hot.toPhysicalColumn(index)]);

export function getSelectedLast(
  hot: Handsontable
): readonly [row: number, col: number] {
  let [currentRow, currentCol] = hot.getSelectedLast() ?? [0, 0];
  /*
   * "hot.getSelectedLast()" returns -1 when column's header or row's
   * number cell is selected
   */
  if (currentRow < 0) currentRow = 0;
  if (currentCol < 0) currentCol = 0;
  return [currentRow, currentCol];
}

export const setHotData = (
  hot: Handsontable,
  changes: RA<
    readonly [visualCol: number, visualRow: number, value: string | null]
  >
): void =>
  // eslint-disable-next-line functional/prefer-readonly-type
  hot.setDataAtCell(changes as WritableArray<[number, number, string | null]>);

export const getPhysicalColToMappingCol = (mappings: WbMapping | undefined, dataset: Dataset) => (physicalCol: number): number | undefined =>
  mappings?.lines.findIndex(
    ({ headerName }) => headerName === dataset.columns[physicalCol]
  );