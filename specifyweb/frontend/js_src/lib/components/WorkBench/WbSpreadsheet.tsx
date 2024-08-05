/**
 * Component for the Handsontable React wrapper
 */

import { HotTable } from '@handsontable/react';
import type Handsontable from 'handsontable';
import type { DetailedSettings } from 'handsontable/plugins/contextMenu';
import { registerAllModules } from 'handsontable/registry';
import React from 'react';

import { commonText } from '../../localization/common';
import { LANGUAGE } from '../../localization/utils/config';
import { wbText } from '../../localization/workbench';
import type { RA } from '../../utils/types';
import { writable } from '../../utils/types';
import { iconClassName, legacyNonJsxIcons } from '../Atoms/Icons';
import { ReadOnlyContext } from '../Core/Contexts';
import { strictGetTable } from '../DataModel/tables';
import { getIcon, unknownIcon } from '../InitialContext/icons';
import type { Dataset } from '../WbPlanView/Wrapped';
import { configureHandsontable } from './handsontable';
import { useHotHooks } from './hooks';
import { getSelectedRegions, setHotData } from './hotHelpers';
import { useHotProps } from './hotProps';
import type { WbMapping } from './mapping';
import { fetchWbPickLists } from './pickLists';
import type { Workbench } from './WbView';

registerAllModules();

function WbSpreadsheetComponent({
  dataset,
  setHotTable,
  hot,
  isUploaded,
  data,
  workbench,
  mappings,
  isResultsOpen,
  checkDeletedFail,
  spreadsheetChanged,
  onClickDisambiguate: handleClickDisambiguate,
}: {
  readonly dataset: Dataset;
  readonly setHotTable: React.RefCallback<HotTable>;
  readonly hot: Handsontable | undefined;
  readonly isUploaded: boolean;
  readonly data: RA<RA<string | null>>;
  readonly workbench: Workbench;
  readonly mappings: WbMapping | undefined;
  readonly isResultsOpen: boolean;
  readonly checkDeletedFail: (statusCode: number) => boolean;
  readonly spreadsheetChanged: () => void;
  readonly onClickDisambiguate: () => void;
}): JSX.Element {
  const isReadOnly = React.useContext(ReadOnlyContext);
  const physicalColToMappingCol = (physicalCol: number): number | undefined =>
    mappings?.lines.findIndex(
      ({ headerName }) => headerName === dataset.columns[physicalCol]
    );

  const { validation, cells, disambiguation } = workbench;

  const contextMenuConfig: DetailedSettings | undefined =
    hot === undefined
      ? undefined
      : {
          items: isUploaded
            ? ({
                // Display uploaded record
                upload_results: {
                  disableSelection: true,
                  isCommand: false,
                  renderer: (hot, wrapper) => {
                    const { endRow: visualRow, endCol: visualCol } =
                      getSelectedRegions(hot).at(-1) ?? {};
                    const physicalRow = hot.toPhysicalRow(visualRow ?? 0);
                    const physicalCol = hot.toPhysicalColumn(visualCol ?? 0);

                    const createdRecords =
                      validation.uploadResults.newRecords[physicalRow]?.[
                        physicalCol
                      ];

                    if (
                      visualRow === undefined ||
                      visualCol === undefined ||
                      createdRecords === undefined ||
                      !cells.getCellMeta(physicalRow, physicalCol, 'isNew')
                    ) {
                      wrapper.textContent = wbText.noUploadResultsAvailable();
                      wrapper.parentElement?.classList.add('htDisabled');
                      const span = document.createElement('span');
                      span.style.display = 'none';
                      return span;
                    }

                    wrapper.setAttribute(
                      'class',
                      `${wrapper.getAttribute('class')} flex flex-col !m-0
                    pb-1`
                    );
                    wrapper.innerHTML = createdRecords
                      .map(([tableName, recordId, label]) => {
                        const tableLabel =
                          label === ''
                            ? strictGetTable(tableName).label
                            : label;
                        // REFACTOR: use new table icons
                        const tableIcon = getIcon(tableName) ?? unknownIcon;

                        return `<a
                        class="link"
                        href="/specify/view/${tableName}/${recordId}/"
                        target="_blank"
                      >
                        <img class="${iconClassName}" src="${tableIcon}" alt="">
                        ${tableLabel}
                        <span
                          title="${commonText.opensInNewTab()}"
                          aria-label="${commonText.opensInNewTab()}"
                        >${legacyNonJsxIcons.link}</span>
                      </a>`;
                      })
                      .join('');

                    const div = document.createElement('div');
                    div.style.display = 'none';
                    return div;
                  },
                },
              } as const)
            : ({
                row_above: {
                  disabled: () => isReadOnly,
                },
                row_below: {
                  disabled: () => isReadOnly,
                },
                remove_row: {
                  disabled: () => {
                    if (isReadOnly) return true;
                    // Or if called on the last row
                    const selectedRegions = getSelectedRegions(hot);
                    return (
                      selectedRegions.length === 1 &&
                      selectedRegions[0].startRow === data.length - 1 &&
                      selectedRegions[0].startRow === selectedRegions[0].endRow
                    );
                  },
                },
                disambiguate: {
                  name: wbText.disambiguate(),
                  disabled: (): boolean =>
                    !disambiguation.isAmbiguousCell() || isReadOnly,
                  callback: handleClickDisambiguate,
                },
                ['separator_1' as 'undo']: '---------',
                fill_down: fillCellsContextMenuItem(hot, 'down', isReadOnly),
                fill_up: fillCellsContextMenuItem(hot, 'up', isReadOnly),
                ['separator_2' as 'redo']: '---------',
                undo: {
                  disabled: () => !hot.isUndoAvailable() || isReadOnly,
                },
                redo: {
                  disabled: () => !hot.isRedoAvailable() || isReadOnly,
                },
              } as const),
        };

  React.useEffect(() => {
    if (hot === undefined) return;
    hot.batch(() => {
      (mappings === undefined
        ? Promise.resolve({})
        : fetchWbPickLists(dataset.columns, mappings.tableNames, mappings.lines)
      ).then((pickLists) => {
        configureHandsontable(hot, mappings, dataset, pickLists);
        // Check for reordered columns
        if (dataset.visualorder?.some((column, index) => column !== index))
          hot.updateSettings({
            manualColumnMove: writable(dataset.visualorder),
          });
        // Highlight validation cells
        if (dataset.rowresults) {
          validation.getValidationResults();
          if (validation.validationMode === 'static' && !isUploaded)
            workbench.utils.toggleCellTypes('invalidCells', 'remove');
          workbench.cells.indexedCellMeta = undefined;
        }
      });
    });
  }, [hot, dataset.rowresults]);

  const {
    autoWrapCol,
    autoWrapRow,
    columns,
    enterMoves,
    colHeaders,
    enterBeginsEditing,
    hiddenRows,
    hiddenColumns,
    minSpareRows,
    tabMoves,
    comments,
  } = useHotProps({ dataset, mappings, physicalColToMappingCol });

  const hooks = useHotHooks({
    workbench,
    physicalColToMappingCol,
    spreadsheetChanged,
    checkDeletedFail,
    isReadOnly,
    isResultsOpen,
  });

  return (
    <section className="flex-1 overflow-hidden overscroll-none">
      <HotTable
        autoWrapCol={autoWrapCol}
        autoWrapRow={autoWrapRow}
        colHeaders={colHeaders}
        columns={columns}
        commentedCellClassName="htCommentCell"
        comments={comments}
        contextMenu={contextMenuConfig}
        // eslint-disable-next-line functional/prefer-readonly-type
        data={data as (string | null)[][]}
        enterBeginsEditing={enterBeginsEditing}
        enterMoves={enterMoves}
        hiddenColumns={hiddenColumns}
        hiddenRows={hiddenRows}
        invalidCellClassName="-"
        language={LANGUAGE}
        licenseKey="non-commercial-and-evaluation"
        manualColumnMove
        manualColumnResize
        minSpareRows={minSpareRows}
        multiColumnSorting
        outsideClickDeselects={false}
        placeholderCellClassName="htPlaceholder"
        readOnly={isReadOnly}
        ref={setHotTable}
        rowHeaders
        stretchH="all"
        tabMoves={tabMoves}
        {...hooks}
      />
    </section>
  );
}

export const WbSpreadsheet = React.memo(WbSpreadsheetComponent);

// Context menu item definitions (common for fillUp and fillDown)
const fillCellsContextMenuItem = (
  hot: Handsontable,
  mode: 'down' | 'up',
  isReadOnly: boolean
): Handsontable.plugins.ContextMenu.MenuItemConfig => ({
  name: mode === 'up' ? wbText.fillUp() : wbText.fillDown(),
  disabled: () =>
    isReadOnly ||
    (hot.getSelected()?.every((selection) => selection[0] === selection[2]) ??
      false),
  callback: (_, selections) =>
    selections.forEach((selection) =>
      Array.from({
        length: selection.end.col + 1 - selection.start.col,
      }).forEach((_, index) => {
        const startRow =
          mode === 'up' ? selection.start.row + 1 : selection.start.row;
        const endRow = selection.end.row;
        const col = selection.start.col + index;
        const value =
          mode === 'up'
            ? hot.getDataAtCell(endRow, col)
            : hot.getDataAtCell(startRow, col);
        setHotData(
          hot,
          Array.from({ length: endRow - startRow }, (_, index) => [
            startRow + index + 1,
            col,
            value,
          ])
        );
      })
    ),
});
