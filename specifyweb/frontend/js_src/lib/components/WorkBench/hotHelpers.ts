import type Handsontable from 'handsontable';

import type { RA } from '../../utils/types';

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
 * Get data set headers in the visual order
 */
export const getVisualHeaders = (
  hot: Handsontable,
  columns: RA<string>
): RA<string> =>
  columns.map((_, index, columns) => columns[hot.toPhysicalColumn(index)]);
