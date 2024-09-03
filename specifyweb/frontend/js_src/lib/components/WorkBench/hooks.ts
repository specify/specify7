import type Handsontable from 'handsontable';
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
  let sortConfigIsSet: boolean = false;
  const loading = React.useContext(LoadingContext);

  return {
    /*
     * After cell is rendered, we need to reApply metaData classes
     * NOTE:
     * .issues are handled automatically by the comments plugin.
     * This is why, afterRenderer only has to handle the isModified and isNew
     * cases
     *
     */
    afterRenderer: (td, visualRow, visualCol, property, _value) => {
      if (workbench.hot === undefined) {
        td.classList.add('text-gray-500');
        return;
      }
      const physicalRow = workbench.hot.toPhysicalRow(visualRow);
      const physicalCol =
        typeof property === 'number'
          ? property
          : workbench.hot.toPhysicalColumn(visualCol);
      if (physicalCol >= workbench.dataset.columns.length) return;
      const metaArray = workbench.cells.cellMeta?.[physicalRow]?.[physicalCol];
      const cellMetaToUpdate: RA<keyof WbMeta> = [
        'isModified',
        'isNew',
        'isSearchResult',
        'isUpdated',
        'isMatchedAndChanged',
        'isDeleted',
      ];
      cellMetaToUpdate.forEach((metaType) => {
        if (workbench.cells.getCellMetaFromArray(metaArray, metaType)) {
          workbench.cells.runMetaUpdateEffects(
            td,
            metaType,
            true,
            visualRow,
            visualCol
          );
        }
      });
      if (workbench.mappings?.mappedHeaders?.[physicalCol] === undefined)
        td.classList.add('text-gray-500');
      if (workbench.mappings?.coordinateColumns?.[physicalCol] !== undefined)
        td.classList.add('wb-coordinate-cell');
    },

    // Make HOT use defaultValues for validation if cell is empty
    beforeValidate: (value, _visualRow, property) => {
      if (Boolean(value) || workbench.hot === undefined) return value;

      const visualCol = workbench.hot.propToCol(property);
      const physicalCol = workbench.hot.toPhysicalColumn(visualCol);

      return workbench.mappings?.defaultValues[physicalCol] ?? value;
    },

    afterValidate: (
      isValid,
      value: string | null = '',
      visualRow,
      property
    ) => {
      if (workbench.hot === undefined) return;
      const visualCol = workbench.hot.propToCol(property);

      const physicalRow = workbench.hot.toPhysicalRow(visualRow);
      const physicalCol = workbench.hot.toPhysicalColumn(visualCol);
      const issues = workbench.cells.getCellMeta(
        physicalRow,
        physicalCol,
        'issues'
      );
      /*
       * Don't duplicate failedParsingPickList message if both front-end and
       * back-end identified the same issue.
       *
       * This is the only type of validation that is done on the front-end
       */
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
              whitespaceSensitive(
                backEndText.failedParsingPickList({ value: '' })
              )
            )
        ),
      ]);
      if (JSON.stringify(issues) !== JSON.stringify(newIssues))
        workbench.cells.updateCellMeta(
          physicalRow,
          physicalCol,
          'issues',
          newIssues
        );
    },

    afterUndo: (data) => afterUndoRedo(workbench, 'undo', data),

    afterRedo: (data) => afterUndoRedo(workbench, 'redo', data),

    beforePaste: () => !isReadOnly,

    /*
     * If copying values from a 1x3 area and pasting into the last cell, HOT
     * would create 2 invisible columns)
     *
     * This intercepts Paste to prevent creation of these columns
     *
     * This logic wasn't be put into beforePaste because it receives
     * arguments that are inconvenient to work with
     *
     */
    beforeChange: (unfilteredChanges, source) => {
      if (source !== 'CopyPaste.paste') return true;

      const filteredChanges = unfilteredChanges.filter(
        ([, property]) =>
          (property as number) < workbench.dataset.columns.length
      );
      if (
        filteredChanges.length === unfilteredChanges.length ||
        workbench.hot === undefined
      )
        return true;
      workbench.hot.setDataAtCell(
        filteredChanges.map(([visualRow, property, _oldValue, newValue]) => [
          visualRow,
          workbench.hot!.propToCol(property as number),
          newValue,
        ]),
        'CopyPaste.paste'
      );
      return false;
    },

    afterChange: (unfilteredChanges, source) => {
      if (
        ![
          'edit',
          'CopyPaste.paste',
          'CopyPaste.cut',
          'Autofill.fill',
          'UndoRedo.undo',
          'UndoRedo.redo',
        ].includes(source) ||
        workbench.hot === undefined ||
        unfilteredChanges === null
      )
        return;
      const changes = unfilteredChanges
        .map(([visualRow, property, oldValue, newValue]) => ({
          visualRow,
          visualCol: workbench.hot!.propToCol(property),
          physicalRow: workbench.hot!.toPhysicalRow(visualRow),
          physicalCol:
            typeof property === 'number'
              ? property
              : workbench.hot!.toPhysicalColumn(
                  workbench.hot!.propToCol(property as number | string)
                ),
          oldValue,
          newValue,
        }))
        .filter(
          ({ oldValue, newValue, visualCol }) =>
            /*
             * Ignore cases where value didn't change
             * (happens when double click a cell and then click on another cell)
             *
             */
            oldValue !== newValue &&
            // Or where value changed from null to empty
            (oldValue !== null || newValue !== '') &&
            // Or the column does not exist (that can happen on paste)
            visualCol < workbench.dataset.columns.length
        );

      if (changes.length === 0) return;

      const changedRows = new Set(
        changes
          // Ignore changes to unmapped columns
          .filter(
            ({ physicalCol }) => physicalColToMappingCol(physicalCol) !== -1
          )
          .sort(sortFunction(({ visualRow }) => visualRow))
          .map(({ physicalRow }) => physicalRow)
      );

      /*
       * Don't clear disambiguation when afterChange is triggered by
       * hot.undo() from inside of afterUndoRedo()
       * FEATURE: consider not clearing disambiguation at all
       */
      if (!workbench.undoRedoIsHandled)
        changedRows.forEach((physicalRow) =>
          workbench.disambiguation.clearDisambiguation(physicalRow)
        );

      changes.forEach(
        ({
          visualRow,
          visualCol,
          physicalRow,
          physicalCol,
          oldValue = '',
          newValue,
        }) => {
          if (
            workbench.cells.getCellMeta(
              physicalRow,
              physicalCol,
              'originalValue'
            ) === undefined
          )
            workbench.cells.setCellMeta(
              physicalRow,
              physicalCol,
              'originalValue',
              oldValue
            );
          workbench.cells.recalculateIsModifiedState(physicalRow, physicalCol, {
            visualRow,
            visualCol,
          });
          if (
            workbench.utils.searchPreferences.search.liveUpdate &&
            workbench.utils.searchQuery !== undefined
          )
            workbench.cells.updateCellMeta(
              physicalRow,
              physicalCol,
              'isSearchResult',
              workbench.utils.searchFunction(newValue),
              { visualRow, visualCol }
            );
        }
      );

      spreadsheetChanged();
      workbench.cells.updateCellInfoStats();

      if (workbench.dataset.uploadplan)
        changedRows.forEach((physicalRow) =>
          workbench.validation.startValidateRow(physicalRow)
        );
    },

    /*
     * This may be called before full initialization of the workbench because
     * of the minSpareRows setting in HOT. Thus, be sure to check if
     * wbView.hotIsReady is true
     *
     * Also, I don't think this is ever called with amount > 1.
     * Even if multiple new rows where created at once (e.x on paste), HOT calls
     * this hook one row at a time
     *
     * Also, this function needs to be called before afterValidate, thus I used
     * beforeCreateRow, instead of afterCreateRow
     *
     */
    beforeCreateRow: (visualRowStart, amount, source) => {
      const addedRows = Array.from(
        { length: amount },
        (_, index) =>
          /*
           * If HOT is not yet fully initialized, we can assume that physical row
           * order and visual row order is the same
           */
          workbench.hot?.toPhysicalRow(visualRowStart + index) ??
          visualRowStart + index
        // REFACTOR: use sortFunction here
      ).sort();

      workbench.cells.indexedCellMeta = undefined;
      addedRows
        .filter((physicalRow) => physicalRow < workbench.cells.cellMeta.length)
        .forEach((physicalRow) =>
          workbench.cells?.cellMeta.splice(physicalRow, 0, [])
        );
      if (workbench.hot !== undefined && source !== 'auto')
        spreadsheetChanged();

      return true;
    },

    beforeRemoveRow: (visualRowStart, amount, _, source) => {
      if (workbench.hot === undefined) return;
      // Get indexes of removed rows in reverse order
      const removedRows = Array.from({ length: amount }, (_, index) =>
        workbench.hot!.toPhysicalRow(visualRowStart + index)
      )
        .filter((physicalRow) => physicalRow < workbench.cells.cellMeta.length)
        // REFACTOR: use sortFunction here
        .sort()
        .reverse();

      removedRows.forEach((physicalRow) => {
        workbench.cells.cellMeta.splice(physicalRow, 1);
        workbench.validation.liveValidationStack.splice(physicalRow, 1);
      });

      workbench.cells.indexedCellMeta = undefined;

      if (source !== 'auto') {
        spreadsheetChanged();
        workbench.cells.updateCellInfoStats();
      }

      return true;
    },

    /*
     * If a tree column is about to be sorted, overwrite the sort config by
     * finding all lower level ranks of that tree (within the same -to-many)
     * and sorting them in the same direction
     */
    beforeColumnSort: (currentSortConfig, newSortConfig) => {
      workbench.cells.indexedCellMeta = undefined;

      if (
        workbench.mappings === undefined ||
        sortConfigIsSet ||
        workbench.hot === undefined
      )
        return true;

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
                rankId: rankGroup.find(
                  (mapping) => mapping.physicalCol === physicalCol
                )?.rankId,
                groupIndex,
              }))
              .find(({ rankId }) => rankId !== undefined),
          }))
          // Filter out columns that aren't tree ranks
          .filter(({ rankGroup }) => rankGroup !== undefined)
          /*
           * Filter out columns that didn't change
           * In the end, there should only be 0 or 1 columns
           *
           */
          .find(({ sortOrder, visualCol }) => {
            const deltaColumnState = deltaSearchConfig.find(
              ({ column }) => column === visualCol
            );
            return (
              deltaColumnState === undefined ||
              deltaColumnState.sortOrder !== sortOrder
            );
          });

      let changedTreeColumn = findTreeColumns(newSortConfig, currentSortConfig);
      let newSortOrderIsUnset = false;

      if (changedTreeColumn === undefined) {
        changedTreeColumn = findTreeColumns(currentSortConfig, newSortConfig);
        newSortOrderIsUnset = true;
      }

      if (changedTreeColumn === undefined) return true;

      /*
       * Filter out columns with higher rank than the changed column
       * (lower rankId corresponds to a higher tree rank)
       *
       */
      const columnsToSort = workbench.mappings.treeRanks[
        changedTreeColumn.rankGroup!.groupIndex
      ]
        .filter(({ rankId }) => rankId >= changedTreeColumn!.rankGroup!.rankId!)
        .map(({ physicalCol }) => workbench.hot!.toVisualColumn(physicalCol));

      // Filter out columns that are about to be sorted
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

      sortConfigIsSet = true;
      getHotPlugin(workbench.hot, 'multiColumnSorting').sort(fullSortConfig);
      sortConfigIsSet = false;

      return false;
    },

    // Cache sort config to preserve column sort order across sessions
    afterColumnSort: async (_previousSortConfig, sortConfig) => {
      if (workbench.hot === undefined) return;
      const physicalSortConfig = sortConfig.map((rest) => ({
        ...rest,
        physicalCol: workbench.hot!.toPhysicalColumn(rest.column),
      }));
      setCache(
        'workBenchSortConfig',
        `${schema.domainLevelIds.collection}_${workbench.dataset.id}`,
        physicalSortConfig
      );
    },

    beforeColumnMove: (_columnIndexes, _finalIndex, dropIndex) =>
      !isResultsOpen &&
      (dropIndex !== undefined || workbench.hot !== undefined),

    // Save new visualOrder on the back end
    afterColumnMove: (_columnIndexes, _finalIndex, dropIndex) => {
      // An ugly fix for jQuery's dialogs conflicting with HOT
      if (dropIndex === undefined || workbench.hot == undefined) return;
      workbench.cells.indexedCellMeta = undefined;

      const columnOrder = workbench.dataset.columns.map((_, visualCol) =>
        workbench.hot!.toPhysicalColumn(visualCol)
      );

      if (
        workbench.dataset.visualorder === null ||
        columnOrder.some(
          (i, index) => i !== workbench.dataset.visualorder![index]
        )
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

    // Do not scroll the viewport to the last column after inserting a row
    afterPaste: (data, coords) => {
      const lastCoords = coords.at(-1);
      if (
        typeof lastCoords === 'object' &&
        data.some((row) => row.length === workbench.dataset.columns.length) &&
        workbench.hot !== undefined
      )
        workbench.hot.scrollViewportTo(lastCoords.endRow, lastCoords.startCol);
    },

    /*
     * Disallow user from selecting several times the same cell
     */
    afterSelection: () => {
      if (workbench.hot === undefined) return;
      const selection = workbench.hot?.getSelected() ?? [];
      const newSelection = f
        .unique(selection.map((row) => JSON.stringify(row)))
        .map((row) => JSON.parse(row));
      if (newSelection.length !== selection.length) {
        workbench.hot?.deselectCell();
        workbench.hot?.selectCells(newSelection);
      }
    },
  };
}

/**
 * Any change to a row clears disambiguation results
 * Clearing disambiguation creates a separate point in the undo/redo stack
 * This runs undo twice when undoing a change that caused disambiguation
 * clear and similarly redoes the change twice
 *
 */
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
  )
    return;

  const [visualRow, visualCol, newData, oldData] = data.changes[0];
  const physicalRow = workbench.hot.toPhysicalRow(visualRow);
  const physicalCol = workbench.hot.toPhysicalColumn(visualCol as number);
  if (physicalCol !== workbench.dataset.columns.length) return;

  const newValue = JSON.parse(newData || '{}').disambiguation;
  const oldValue = JSON.parse(oldData || '{}').disambiguation;

  /*
   * Disambiguation results are cleared when any cell in a row changes.
   * That change creates a separate point in the undo stack.
   * Thus, if HOT tries to undo disambiguation clearing, we need to
   * also need to undo the change that caused disambiguation clearing
   */
  if (
    type === 'undo' &&
    Object.keys(newValue ?? {}).length > 0 &&
    Object.keys(oldValue ?? {}).length === 0
  )
    // HOT doesn't seem to like calling undo from inside of afterUndo
    globalThis.setTimeout(() => {
      workbench.undoRedoIsHandled = true;
      workbench.hot?.undo();
      workbench.undoRedoIsHandled = false;
      workbench.disambiguation.afterChangeDisambiguation(physicalRow);
    }, 0);
  else workbench.disambiguation.afterChangeDisambiguation(physicalRow);
}
