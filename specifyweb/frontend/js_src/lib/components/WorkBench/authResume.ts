import type { RA } from '../../utils/types';

export const batchEditResumeKind = 'batch-edit';

export type BatchEditResumeChange = {
  readonly col: number;
  readonly row: number;
  readonly value: string | null;
};

export type BatchEditResumePayload = {
  readonly changes: RA<BatchEditResumeChange>;
};

export function collectBatchEditChanges(
  originalRows: RA<RA<string | null>>,
  currentRows: RA<RA<string | null>>
): RA<BatchEditResumeChange> {
  const changes: readonly BatchEditResumeChange[] = [];
  for (const [rowIndex, currentRow] of currentRows.entries()) {
    const originalRow = originalRows[rowIndex];
    if (originalRow === undefined) continue;

    for (const [colIndex, value] of currentRow.entries()) {
      if (originalRow[colIndex] !== value)
        changes.push({
          row: rowIndex,
          col: colIndex,
          value,
        });
    }
  }
  return changes;
}

export function applyBatchEditChanges(
  rows: RA<RA<string | null>>,
  changes: RA<BatchEditResumeChange>
): RA<RA<string | null>> {
  const restoredRows = rows.map((row) => Array.from(row));
  changes.forEach(({ row, col, value }) => {
    if (restoredRows[row] !== undefined) restoredRows[row][col] = value;
  });
  return restoredRows;
}
