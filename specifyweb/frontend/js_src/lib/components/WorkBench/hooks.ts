import type Handsontable from 'handsontable';
import type { CellChange } from 'handsontable/common';
import type { Events } from 'handsontable/pluginHooks';
import type { Action } from 'handsontable/plugins/undoRedo';
import React from 'react';

import { backEndText } from '../../localization/backEnd';
import { whitespaceSensitive } from '../../localization/utils';
import { Http } from '../../utils/ajax/definitions';
import { ping } from '../../utils/ajax/ping';
import { setCache } from '../../utils/cache';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { overwriteReadOnly } from '../../utils/types';
import { sortFunction } from '../../utils/utils';
import { LoadingContext } from '../Core/Contexts';
import { schema } from '../DataModel/schema';
import type { WbMeta } from './CellMeta';
import { getHotPlugin } from './handsontable';
import type { Workbench } from './WbView';

export function useHotHooks({
  workbench,
  physicalColToMappingCol,
  spreadsheetChanged,
  checkDeletedFail,
  isReadOnly,
  isResultsOpen,
}: {
  readonly workbench: Workbench;
  readonly physicalColToMappingCol: (physicalCol: number) => number | undefined;
  readonly spreadsheetChanged: () => void;
  readonly checkDeletedFail: (statusCode: number) => boolean;
  readonly isReadOnly: boolean;
  readonly isResultsOpen: boolean;
}): Partial<Events> {
  let sortConfigIsSet = false;
  const loading = React.useContext(LoadingContext);

  const validateWorkbenchState = (_context: string): boolean =>
    Boolean(
      workbench?.hot &&
        workbench?.dataset &&
        Array.isArray(workbench.dataset.columns) &&
        workbench?.cells
    );

  const isMappedCol = React.useCallback(
    (physicalCol: number): boolean => {
      const mappingCol = physicalColToMappingCol(physicalCol);
      return mappingCol !== undefined && mappingCol !== -1;
    },
    [physicalColToMappingCol]
  );

  return {
    afterInit: function () {
      /* no-op (kept for parity) */
    },

    afterRenderer: (td, visualRow, _visualCol, property) => {
      if (!validateWorkbenchState('afterRenderer')) {
        td.classList.add('text-gray-500');
        return;
      }

      const colCount = workbench.dataset!.columns.length;
      const physicalRow = workbench.hot!.toPhysicalRow(visualRow);
      const vcol = workbench.hot!.propToCol(property as any);
      const physicalCol = workbench.hot!.toPhysicalColumn(vcol);

      if (colCount === 0 || physicalCol >= colCount) return;
      if (physicalRow < 0 || physicalCol < 0) return;

      const metaArray = workbench.cells.cellMeta?.[physicalRow]?.[physicalCol];
      const toUpdate: RA<keyof WbMeta> = [
        'isModified',
        'isNew',
        'isSearchResult',
        'isUpdated',
        'isMatchedAndChanged',
        'isDeleted',
      ];

      toUpdate.forEach((k) => {
        if (workbench.cells.getCellMetaFromArray(metaArray, k)) {
          workbench.cells.runMetaUpdateEffects(td, k, true, visualRow, vcol);
        }
      });

      if (workbench.mappings?.mappedHeaders?.[physicalCol] === undefined) {
        td.classList.add('text-gray-500');
      }
      if (workbench.mappings?.coordinateColumns?.[physicalCol] !== undefined) {
        td.classList.add('wb-coordinate-cell');
      }
    },

    beforeValidate: (value, _visualRow, property) => {
      if (Boolean(value) || !validateWorkbenchState('beforeValidate')) return value;

      const visualCol = workbench.hot!.propToCol(property as any);
      const physicalCol = workbench.hot!.toPhysicalColumn(visualCol);
      return workbench.mappings?.defaultValues?.[physicalCol] ?? value;
    },

    afterValidate: (isValid, value: string | null = '', visualRow, property) => {
      if (!validateWorkbenchState('afterValidate')) return;

      const visualCol = workbench.hot!.propToCol(property as any);
      const physicalRow = workbench.hot!.toPhysicalRow(visualRow);
      const physicalCol = workbench.hot!.toPhysicalColumn(visualCol);

      const issues = workbench.cells.getCellMeta(physicalRow, physicalCol, 'issues');
      const newIssues = f.unique([
        ...(isValid
          ? []
          : [
              whitespaceSensitive(
                backEndText.failedParsingPickList({
                  value: `"${value ?? 'null'}"`,
                })
              ),
            ]),
        ...issues.filter(
          (issue) =>
            !issue.endsWith(
              whitespaceSensitive(backEndText.failedParsingPickList({ value: '' }))
            )
        ),
      ]);

      if (JSON.stringify(issues) !== JSON.stringify(newIssues)) {
        workbench.cells.updateCellMeta(physicalRow, physicalCol, 'issues', newIssues);
      }
    },

    afterUndo: (data) => afterUndoRedo(workbench, 'undo', data),
    afterRedo: (data) => afterUndoRedo(workbench, 'redo', data),

    beforeCopy: (data, coords) => {
      if (!validateWorkbenchState('beforeCopy')) return;

      coords.forEach((coord) => {
        for (let row = coord.startRow; row <= coord.endRow; row++) {
          const rowIndex = row - coord.startRow;
          for (let col = coord.startCol; col <= coord.endCol; col++) {
            const colIndex = col - coord.startCol;
            const cellMeta = workbench.hot!.getCellMeta(row, col);
            if (cellMeta?.renderer && cellMeta?.formattedValue) {
              data[rowIndex][colIndex] = cellMeta.formattedValue;
            }
          }
        }
      });
    },

    beforePaste: () => !isReadOnly,

    beforeChange: (unfilteredChanges, source) => {
      if (source !== 'CopyPaste.paste') return true;
      if (!validateWorkbenchState('beforeChange')) return false;

      const colCount = workbench.dataset!.columns.length;

      const filteredChanges = unfilteredChanges
        .filter((change): change is CellChange => change !== null)
        .filter(([, property]) => {
          const vcol = workbench.hot!.propToCol(property as any);
          return vcol < colCount;
        });

      if (filteredChanges.length === unfilteredChanges.length) return true;

      workbench.hot!.setDataAtCell(
        filteredChanges.map(([visualRow, property, _oldValue, newValue]) => [
          visualRow,
          workbench.hot!.propToCol(property as any),
          newValue,
        ]),
        'CopyPaste.paste'
      );
      return false;
    },

    afterChange: (unfilteredChanges, source) => {
      const validSources = [
        'edit',
        'CopyPaste.paste',
        'CopyPaste.cut',
        'Autofill.fill',
        'UndoRedo.undo',
        'UndoRedo.redo',
      ];
      if (
        !validSources.includes(source) ||
        !validateWorkbenchState('afterChange') ||
        unfilteredChanges === null
      )
        return;

      const colCount = workbench.dataset!.columns.length;

      const changes = unfilteredChanges
        .map(([visualRow, property, oldValue, newValue]) => {
          const visualCol = workbench.hot!.propToCol(property as any);
          return {
            visualRow,
            visualCol,
            physicalRow: workbench.hot!.toPhysicalRow(visualRow),
            physicalCol: workbench.hot!.toPhysicalColumn(visualCol),
            oldValue,
            newValue,
          };
        })
        .filter(
          ({ oldValue, newValue, visualCol }) =>
            oldValue !== newValue &&
            (oldValue !== null || newValue !== '') &&
            visualCol < colCount
        );

      if (changes.length === 0) return;

      const changedRows = new Set(
        changes
          .filter(({ physicalCol }) => isMappedCol(physicalCol))
          .sort(sortFunction(({ visualRow }) => visualRow))
          .map(({ physicalRow }) => physicalRow)
      );

      if (!workbench.undoRedoIsHandled) {
        changedRows.forEach((physicalRow) =>
          workbench.disambiguation.clearDisambiguation(physicalRow)
        );
      }

      changes.forEach(
        ({ visualRow, visualCol, physicalRow, physicalCol, oldValue = '', newValue }) => {
          if (
            workbench.cells.getCellMeta(physicalRow, physicalCol, 'originalValue') === undefined
          ) {
            workbench.cells.setCellMeta(physicalRow, physicalCol, 'originalValue', oldValue);
          }

          workbench.cells.recalculateIsModifiedState(physicalRow, physicalCol, {
            visualRow,
            visualCol,
          });

          if (
            workbench.utils.searchPreferences.search.liveUpdate &&
            workbench.utils.searchQuery !== undefined
          ) {
            workbench.cells.updateCellMeta(
              physicalRow,
              physicalCol,
              'isSearchResult',
              workbench.utils.searchFunction(newValue),
              { visualRow, visualCol }
            );
          }
        }
      );

      spreadsheetChanged();
      workbench.cells.updateCellInfoStats();

      if (workbench.dataset.uploadplan) {
        changedRows.forEach((physicalRow) => workbench.validation.startValidateRow(physicalRow));
      }
    },

    beforeCreateRow: (visualRowStart, amount, source) => {
      const addedRows = Array.from({ length: amount }, (_, index) =>
        workbench.hot?.toPhysicalRow(visualRowStart + index) ?? visualRowStart + index
      ).sort((a, b) => a - b);

      if (workbench.cells.indexedCellMeta !== undefined) {
        workbench.cells.indexedCellMeta = undefined;
      }

      addedRows
        .filter((physicalRow) => physicalRow < workbench.cells.cellMeta.length)
        .forEach((physicalRow) => workbench.cells?.cellMeta.splice(physicalRow, 0, []));

      if (workbench.hot !== undefined && source !== 'auto') {
        spreadsheetChanged();
      }
      return true;
    },

    beforeRemoveRow: (visualRowStart, amount, _vars, source) => {
      if (!validateWorkbenchState('beforeRemoveRow')) return false;

      const removedRows = Array.from({ length: amount }, (_, index) =>
        workbench.hot!.toPhysicalRow(visualRowStart + index)
      )
        .filter((physicalRow) => physicalRow < workbench.cells.cellMeta.length)
        .sort((a, b) => a - b)
        .reverse();

      removedRows.forEach((physicalRow) => {
        workbench.cells.cellMeta.splice(physicalRow, 1);
        workbench.validation?.liveValidationStack?.splice(physicalRow, 1);
      });

      workbench.cells.indexedCellMeta = undefined;

      if (source !== 'auto') {
        spreadsheetChanged();
        workbench.cells.updateCellInfoStats();
      }
      return true;
    },

    beforeColumnSort: (currentSortConfig, newSortConfig) => {
      if (workbench.cells.indexedCellMeta !== undefined) {
        workbench.cells.indexedCellMeta = undefined;
      }
      if (
        workbench.mappings === undefined ||
        sortConfigIsSet ||
        !validateWorkbenchState('beforeColumnSort')
      ) {
        return true;
      }

      const findTreeColumns = (
        sortConfig: RA<Handsontable.plugins.ColumnSorting.Config>,
        deltaSearchConfig: RA<Handsontable.plugins.ColumnSorting.Config>
      ) =>
        sortConfig
          .map(({ column: visualCol, sortOrder }) => ({
            sortOrder,
            visualCol,
            physicalCol: workbench.hot!.toPhysicalColumn(visualCol),
          }))
          .map(({ physicalCol, ...rest }) => ({
            ...rest,
            rankGroup: workbench
              .mappings!.treeRanks?.map((rankGroup, groupIndex) => ({
                rankId: rankGroup.find((m) => m.physicalCol === physicalCol)?.rankId,
                groupIndex,
              }))
              .find(({ rankId }) => rankId !== undefined),
          }))
          .filter(({ rankGroup }) => rankGroup !== undefined)
          .find(({ sortOrder, visualCol }) => {
            const deltaColumnState = deltaSearchConfig.find(({ column }) => column === visualCol);
            return deltaColumnState === undefined || deltaColumnState.sortOrder !== sortOrder;
          });

      let changedTreeColumn = findTreeColumns(newSortConfig, currentSortConfig);
      let newSortOrderIsUnset = false;

      if (changedTreeColumn === undefined) {
        changedTreeColumn = findTreeColumns(currentSortConfig, newSortConfig);
        newSortOrderIsUnset = true;
      }
      if (changedTreeColumn === undefined) return true;

      const columnsToSort = workbench.mappings.treeRanks[changedTreeColumn.rankGroup!.groupIndex]
        .filter(({ rankId }) => rankId >= changedTreeColumn!.rankGroup!.rankId!)
        .map(({ physicalCol }) => workbench.hot!.toVisualColumn(physicalCol));

      const partialSortConfig = newSortConfig.filter(
        ({ column }) => !columnsToSort.includes(column)
      );

      const fullSortConfig = [
        ...partialSortConfig,
        ...(newSortOrderIsUnset
          ? []
          : columnsToSort.map((visualCol) => ({
              column: visualCol,
              sortOrder: changedTreeColumn!.sortOrder,
            }))),
      ];

      const columnSorting = getHotPlugin(workbench.hot!, 'multiColumnSorting');
      if (!columnSorting) return true;

      sortConfigIsSet = true;
      columnSorting.sort(fullSortConfig);
      sortConfigIsSet = false;
      return false;
    },

    afterColumnSort: async (_prev, sortConfig) => {
      if (!validateWorkbenchState('afterColumnSort')) return;

      const physicalSortConfig = sortConfig.map((config) => ({
        ...config,
        physicalCol: workbench.hot!.toPhysicalColumn(config.column),
      }));
      await setCache(
        'workBenchSortConfig',
        `${schema.domainLevelIds.collection}_${workbench.dataset.id}`,
        physicalSortConfig
      );
    },

    beforeColumnMove: (_columnIndexes, _finalIndex, dropIndex) => {
      return !isResultsOpen && dropIndex !== undefined && workbench.hot !== undefined;
    },

    afterColumnMove: (_columnIndexes, _finalIndex, dropIndex) => {
      if (dropIndex === undefined || !validateWorkbenchState('afterColumnMove')) return;

      workbench.cells.indexedCellMeta = undefined;

      const columnOrder = workbench.dataset.columns.map((_, visualCol) =>
        workbench.hot!.toPhysicalColumn(visualCol)
      );

      if (
        workbench.dataset.visualorder === null ||
        columnOrder.some((i, index) => i !== workbench.dataset.visualorder![index])
      ) {
        overwriteReadOnly(workbench.dataset, 'visualorder', columnOrder);
        loading(
          ping(`/api/workbench/dataset/${workbench.dataset.id}/`, {
            method: 'PUT',
            body: { visualorder: columnOrder },
            expectedErrors: [Http.NOT_FOUND],
          }).then(checkDeletedFail)
        );
      }
    },

    afterPaste: (data, coords) => {
      if (!validateWorkbenchState('afterPaste')) return;

      const lastCoords = coords.at(-1);
      if (
        typeof lastCoords === 'object' &&
        data.some((row) => row.length === (workbench.dataset?.columns?.length ?? 0))
      ) {
        workbench.hot!.scrollViewportTo(lastCoords.endRow, lastCoords.startCol);
      }
    },

    afterSelection: () => {
      if (!validateWorkbenchState('afterSelection')) return;

      const selection = workbench.hot!.getSelected() ?? [];
      const uniqueSelection = f
        .unique(selection.map((row) => JSON.stringify(row)))
        .map((row) => JSON.parse(row));

      if (uniqueSelection.length !== selection.length) {
        workbench.hot!.deselectCell();
        workbench.hot!.selectCells(uniqueSelection);
      }
    },
  };
}

function safeParseJSON(s: unknown): any {
  if (typeof s !== 'string') return {};
  try {
    return JSON.parse(s) ?? {};
  } catch {
    return {};
  }
}

function afterUndoRedo(
  workbench: Workbench,
  type: 'redo' | 'undo',
  data: Action
): void {
  if (
    workbench.undoRedoIsHandled ||
    data.actionType !== 'change' ||
    data.changes.length !== 1 ||
    workbench.hot === undefined
  ) {
    return;
  }

  const [visualRow, visualCol, newData, oldData] = data.changes[0];
  const physicalRow = workbench.hot.toPhysicalRow(visualRow);
  const physicalCol = workbench.hot.toPhysicalColumn(visualCol as number);

  const colCount = workbench.dataset?.columns?.length ?? -1;
  if (colCount < 0 || physicalCol !== colCount) return;

  const newValue = (safeParseJSON(newData) as any).disambiguation ?? {};
  const oldValue = (safeParseJSON(oldData) as any).disambiguation ?? {};

  if (
    type === 'undo' &&
    Object.keys(newValue ?? {}).length > 0 &&
    Object.keys(oldValue ?? {}).length === 0
  ) {
    setTimeout(() => {
      workbench.undoRedoIsHandled = true;
      workbench.hot?.undo();
      workbench.undoRedoIsHandled = false;
      workbench.disambiguination.afterChangeDisambiguation(physicalRow);
    }, 0);
  } else {
    workbench.disambiguination.afterChangeDisambiguation(physicalRow);
  }
}
