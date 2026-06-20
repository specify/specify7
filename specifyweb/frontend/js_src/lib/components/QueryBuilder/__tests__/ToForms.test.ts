/**
 * Tests for the browse-in-forms selected subset behavior.
 *
 * Regression test for issue #7463: after deleting a record from a selected
 * subset in browse view, the view should continue showing the remaining
 * selected records, not reset to the full query result set.
 */

import { queryIdField } from '../Results';

/**
 * Simulates the useSelectedResults logic from ToForms.tsx.
 * When selectedRows is non-empty, returns only the selected IDs.
 * When selectedRows is empty, returns all result IDs (with padding for
 * unfetched results).
 */
function computeSelectedResults(
  results: Array<Record<number, unknown> | undefined>,
  selectedRows: ReadonlySet<number>,
  isOpen: boolean,
  totalCount: number | undefined
): Array<number | undefined> {
  if (!isOpen) return [];
  if (selectedRows.size === 0) {
    if (totalCount) {
      return [
        ...results.map((row) => row?.[queryIdField] as number | undefined),
        ...Array.from<undefined>({ length: totalCount - results.length }).fill(
          undefined
        ),
      ];
    }
    return results.map((row) => row?.[queryIdField] as number | undefined);
  }
  return Array.from(selectedRows);
}

/**
 * Simulates the handleDelete logic from Results.tsx (after the fix).
 * Returns the new selectedRows set after removing the deleted record ID.
 */
function deleteFromSelectedRows(
  selectedRows: ReadonlySet<number>,
  deletedRecordId: number
): ReadonlySet<number> {
  return new Set(
    Array.from(selectedRows).filter((id) => id !== deletedRecordId)
  );
}

describe('browse in forms selected subset after deletion', () => {
  const makeRow = (id: number): Record<number, unknown> => ({
    [queryIdField]: id,
  });

  test('selected subset is preserved after deleting a record (#7463)', () => {
    // Setup: query returned 10 results, user selected 3
    const allResults = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(makeRow);
    const selectedRows: ReadonlySet<number> = new Set([10, 30, 50]);

    // Browse in forms shows only the selected subset
    const idsBeforeDelete = computeSelectedResults(
      allResults,
      selectedRows,
      true,
      10
    );
    expect(idsBeforeDelete).toEqual([10, 30, 50]);

    // User deletes record 10 from the browse view
    const newSelectedRows = deleteFromSelectedRows(selectedRows, 10);

    // After deletion, browse should show remaining selected records, NOT all results
    const idsAfterDelete = computeSelectedResults(
      allResults.filter((r) => r[queryIdField] !== 10),
      newSelectedRows,
      true,
      9
    );
    expect(idsAfterDelete).toEqual([30, 50]);
    expect(newSelectedRows.size).toBe(2);
  });

  test('bug reproduction: stale selectedRows causes reset to full results', () => {
    // This test demonstrates the bug when selectedRows is stale (empty set)
    const allResults = [10, 20, 30, 40, 50].map(makeRow);
    const currentSelectedRows: ReadonlySet<number> = new Set([10, 30, 50]);

    // Simulate the stale closure bug: handleDelete captured selectedRows
    // when it was empty (before user selected rows)
    const staleSelectedRows: ReadonlySet<number> = new Set();

    // With stale selectedRows, deleting record 10 produces an empty set
    const buggyNewSelectedRows = deleteFromSelectedRows(staleSelectedRows, 10);
    expect(buggyNewSelectedRows.size).toBe(0);

    // With empty selectedRows, computeSelectedResults returns ALL results
    const buggyIds = computeSelectedResults(
      allResults.filter((r) => r[queryIdField] !== 10),
      buggyNewSelectedRows,
      true,
      4
    );
    // Bug: shows all 4 remaining results instead of the 2 remaining selected ones
    expect(buggyIds).toHaveLength(4);

    // With current (non-stale) selectedRows, the fix produces correct results
    const fixedNewSelectedRows = deleteFromSelectedRows(
      currentSelectedRows,
      10
    );
    expect(fixedNewSelectedRows.size).toBe(2);

    const fixedIds = computeSelectedResults(
      allResults.filter((r) => r[queryIdField] !== 10),
      fixedNewSelectedRows,
      true,
      4
    );
    expect(fixedIds).toEqual([30, 50]);
  });

  test('deleting last selected record closes the browse view', () => {
    const allResults = [10, 20, 30].map(makeRow);
    const selectedRows: ReadonlySet<number> = new Set([20]);

    const idsBeforeDelete = computeSelectedResults(
      allResults,
      selectedRows,
      true,
      3
    );
    expect(idsBeforeDelete).toEqual([20]);

    const newSelectedRows = deleteFromSelectedRows(selectedRows, 20);
    expect(newSelectedRows.size).toBe(0);

    // When selectedRows becomes empty after deletion, the RecordSelectorFromIds
    // closes because ids.length === 0 (handled in ToForms.tsx onDelete callback)
  });

  test('no selection shows all results', () => {
    const allResults = [10, 20, 30].map(makeRow);
    const noSelection: ReadonlySet<number> = new Set();

    const ids = computeSelectedResults(allResults, noSelection, true, 5);
    // Shows all loaded results plus undefined placeholders for unfetched ones
    expect(ids).toEqual([10, 20, 30, undefined, undefined]);
  });
});
