/**
 * Component for the Handsontable React wrapper
 *
 * TODO:
 * - Add context menu settings
 * - Upgrade to handsontable14 to fix copyPasteEnabled error
 * - Fix font size and color in the table
 */

import { HotTable } from '@handsontable/react';
import React from 'react';

import { LANGUAGE } from '../../localization/utils/config';
import { wbPlanText } from '../../localization/wbPlan';
import { f } from '../../utils/functools';
import { ensure, type IR, type RA } from '../../utils/types';
import { legacyNonJsxIcons } from '../Atoms/Icons';
import { getTable } from '../DataModel/tables';
import { hasPermission } from '../Permissions/helpers';
import { userPreferences } from '../Preferences/userPreferences';
import type { Dataset } from '../WbPlanView/Wrapped';
import { parseWbMappings } from './mapping';

export function WbSpreadsheet({
  dataset,
  hotRef,
  isUploaded,
  data
}: {
  readonly dataset: Dataset;
  readonly hotRef: any;
  readonly isUploaded: boolean;
  readonly data: RA<RA<string | null>>;
}): JSX.Element {
  
  const mappings = parseWbMappings(dataset);

  const physicalColToMappingCol = (physicalCol: number): number | undefined =>
    mappings?.lines.findIndex(
      ({ headerName }) => headerName === dataset.columns[physicalCol]
    );

  // const contextMenuConfig = {
  //   items: ensure<
  //     IR<
  //       | Handsontable.plugins.ContextMenu.MenuItemConfig
  //       | Handsontable.plugins.ContextMenu.PredefinedMenuItemKey
  //     >
  //   >()(
  //     isUploaded
  //       ? ({
  //           // Display uploaded record
  //           upload_results: {
  //             disableSelection: true,
  //             isCommand: false,
  //             renderer: (_hot, wrapper) => {
  //               const { endRow: visualRow, endCol: visualCol } =
  //                 getSelectedRegions(hotRef.current).at(-1) ?? {};
  //               const physicalRow = hotRef?.current.toPhysicalRow(visualRow ?? 0);
  //               const physicalCol = hotRef?.current.toPhysicalColumn(visualCol ?? 0);

  //               const createdRecords =
  //                 this.validation.uploadResults.newRecords[physicalRow]?.[
  //                   physicalCol
  //                 ];

  //               if (
  //                 visualRow === undefined ||
  //                 visualCol === undefined ||
  //                 createdRecords === undefined ||
  //                 !this.cells.getCellMeta(physicalRow, physicalCol, 'isNew')
  //               ) {
  //                 wrapper.textContent = wbText.noUploadResultsAvailable();
  //                 wrapper.parentElement?.classList.add('htDisabled');
  //                 const span = document.createElement('span');
  //                 span.style.display = 'none';
  //                 return span;
  //               }

  //               wrapper.setAttribute(
  //                 'class',
  //                 `${wrapper.getAttribute('class')} flex flex-col !m-0
  //                   pb-1 wb-uploaded-view-context-menu`
  //               );
  //               wrapper.innerHTML = createdRecords
  //                 .map(([tableName, recordId, label]) => {
  //                   const tableLabel =
  //                     label === ''
  //                       ? strictGetTable(tableName).label
  //                       : label;
  //                   // REFACTOR: use new table icons
  //                   const tableIcon = getIcon(tableName) ?? unknownIcon;

  //                   return `<a
  //                       class="link"
  //                       href="/specify/view/${tableName}/${recordId}/"
  //                       target="_blank"
  //                     >
  //                       <img class="${iconClassName}" src="${tableIcon}" alt="">
  //                       ${tableLabel}
  //                       <span
  //                         title="${commonText.opensInNewTab()}"
  //                         aria-label="${commonText.opensInNewTab()}"
  //                       >${legacyNonJsxIcons.link}</span>
  //                     </a>`;
  //                 })
  //                 .join('');

  //               const div = document.createElement('div');
  //               div.style.display = 'none';
  //               return div;
  //             },
  //           },
  //         } as const)
  //       : ({
  //           row_above: {
  //             disabled: () =>
  //               typeof this.uploadedView === 'function' ||
  //               typeof this.coordinateConverterView === 'function' ||
  //               !hasPermission('/workbench/dataset', 'update'),
  //           },
  //           row_below: {
  //             disabled: () =>
  //               typeof this.uploadedView === 'function' ||
  //               typeof this.coordinateConverterView === 'function' ||
  //               !hasPermission('/workbench/dataset', 'update'),
  //           },
  //           remove_row: {
  //             disabled: () => {
  //               if (
  //                 typeof this.uploadedView === 'function' ||
  //                 typeof this.coordinateConverterView === 'function' ||
  //                 !hasPermission('/workbench/dataset', 'update')
  //               )
  //                 return true;
  //               // Or if called on the last row
  //               const selectedRegions = getSelectedRegions(hot);
  //               return (
  //                 selectedRegions.length === 1 &&
  //                 selectedRegions[0].startRow === this.data.length - 1 &&
  //                 selectedRegions[0].startRow === selectedRegions[0].endRow
  //               );
  //             },
  //           },
  //           disambiguate: {
  //             name: wbText.disambiguate(),
  //             disabled: (): boolean =>
  //               typeof this.uploadedView === 'function' ||
  //               typeof this.coordinateConverterView === 'function' ||
  //               !this.disambiguation.isAmbiguousCell() ||
  //               !hasPermission('/workbench/dataset', 'update'),
  //             callback: () =>
  //               this.disambiguation.openDisambiguationDialog(),
  //           },
  //           separator_1: '---------',
  //           fill_down: this.wbUtils.fillCellsContextMenuItem('down'),
  //           fill_up: this.wbUtils.fillCellsContextMenuItem('up'),
  //           separator_2: '---------',
  //           undo: {
  //             disabled: () =>
  //               typeof this.uploadedView === 'function' ||
  //               this.hot?.isUndoAvailable() !== true ||
  //               !hasPermission('/workbench/dataset', 'update'),
  //           },
  //           redo: {
  //             disabled: () =>
  //               typeof this.uploadedView === 'function' ||
  //               this.hot?.isRedoAvailable() !== true ||
  //               !hasPermission('/workbench/dataset', 'update'),
  //           },
  //         } as const)
  //   ),
  // }

  return (
    <HotTable
      autoWrapCol={userPreferences.get('workBench', 'editor', 'autoWrapCol')}
      autoWrapRow={userPreferences.get('workBench', 'editor', 'autoWrapRow')}
      colHeaders={(physicalCol: number) => {
        const tableIcon = mappings?.mappedHeaders?.[physicalCol];
        const isMapped = tableIcon !== undefined;
        const mappingCol = physicalColToMappingCol(physicalCol);
        const tableName =
          (typeof mappingCol === 'number'
            ? mappings?.tableNames[mappingCol]
            : undefined) ??
          tableIcon?.split('/').slice(-1)?.[0]?.split('.')?.[0];
        const tableLabel = isMapped
          ? f.maybe(tableName, getTable)?.label ?? tableName ?? ''
          : '';
        // REFACTOR: use new table icons
        return `<div class="flex gap-1 items-center pl-4">
                  ${
                    isMapped
                      ? `<img
                    class="w-table-icon h-table-icon"
                    alt="${tableLabel}"
                    src="${tableIcon}"
                  >`
                      : `<span
                    class="text-red-600"
                    aria-label="${wbPlanText.unmappedColumn()}"
                    title="${wbPlanText.unmappedColumn()}"
                  >${legacyNonJsxIcons.ban}</span>`
                  }
                  <span class="wb-header-name columnSorting">
                    ${dataset.columns[physicalCol]}
                  </span>
                </div>`;
      }}
      columns={Array.from(
        // Last column is invisible and contains disambiguation metadata
        { length: dataset.columns.length + 1 },
        (_, physicalCol) => ({
          // Get data from nth column for nth column
          data: physicalCol,
        })
      )}
      commentedCellClassName="htCommentCell"
      comments={{
        displayDelay: 100,
      }}
      data={data as (string | null)[][]}
      enterBeginsEditing={userPreferences.get(
        'workBench',
        'editor',
        'enterBeginsEditing'
      )}
      enterMoves={
        userPreferences.get('workBench', 'editor', 'enterMoveDirection') ===
        'col'
          ? { col: 1, row: 0 }
          : { col: 0, row: 1 }
      }
      hiddenColumns={{
        // Hide the disambiguation column
        columns: [dataset.columns.length],
        indicators: false,
        // @ts-expect-error Typing doesn't match for handsontable 12.1.0, fixed in 14
        copyPasteEnabled: false,
      }}
      hiddenRows={{
        rows: [],
        indicators: false,
        // Temporarily disabled as copyPasteEnabled throws an error despite having ts-expect-error
        // Typing doesn't match for handsontable 12.1.0, fixed in 14
        // copyPasteEnabled: false,
      }}
      invalidCellClassName="-"
      language={LANGUAGE}
      licenseKey="non-commercial-and-evaluation"
      manualColumnMove={true}
      manualColumnResize={true}
      minSpareRows={userPreferences.get('workBench', 'editor', 'minSpareRows')}
      multiColumnSorting={true}
      outsideClickDeselects={false}
      placeholderCellClassName="htPlaceholder"
      ref={hotRef}
      rowHeaders={true}
      sortIndicator={true}
      stretchH="all"
      tabMoves={
        userPreferences.get('workBench', 'editor', 'tabMoveDirection') === 'col'
          ? { col: 1, row: 0 }
          : { col: 0, row: 1 }
      }
      readOnly={isUploaded || !hasPermission('/workbench/dataset', 'update')}
      // ContextMenu={contextMenuConfig as Settings}
    />
  );
}
