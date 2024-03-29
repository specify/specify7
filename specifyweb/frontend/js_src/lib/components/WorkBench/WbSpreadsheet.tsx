/**
 * Component for the Handsontable React wrapper
 *
 * TODO:
 * - Upgrade to handsontable14 to fix copyPasteEnabled error
 * - Fix font size and color in the table
 * - Add hooks to HotTable
 */

import { HotTable } from '@handsontable/react';
import Handsontable from 'handsontable';
import React from 'react';
import type { Settings } from 'handsontable/plugins/contextMenu';

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
import { getSelectedRegions } from './hotHelpers';
import { WbValidationReact } from './WbValidation';
import { WbCellMetaReact } from './CellMeta';
import { DisambiguationReact } from './DisambiguationLogic';
import { wbText } from '../../localization/workbench';
import { strictGetTable } from '../DataModel/tables';
import { getIcon, unknownIcon } from '../InitialContext/icons';
import { commonText } from '../../localization/common';
import { iconClassName } from '../Atoms/Icons';
import { getSelectedLast } from './hotHelpers';
import { useBooleanState } from '../../hooks/useBooleanState';
import { getTableFromMappingPath } from '../WbPlanView/navigator';
import { hasTablePermission } from '../Permissions/helpers';
import type { Collection } from '../DataModel/specifyTable';
import { AnySchema } from '../DataModel/helperTypes';
import { Dialog } from '../Molecules/Dialog';
import { DisambiguationDialog } from './Disambiguation';
import { mappingPathToString } from '../WbPlanView/mappingHelpers';
import { MappingPath } from '../WbPlanView/Mapper';

export function WbSpreadsheet({
  dataset,
  hotRef,
  isUploaded,
  data,
  validation,
  cells,
  disambiguation,
  hooks,
}: {
  readonly dataset: Dataset;
  readonly hotRef: any;
  readonly isUploaded: boolean;
  readonly data: RA<RA<string | null>>;
  readonly validation: WbValidationReact;
  readonly cells: WbCellMetaReact;
  readonly disambiguation: DisambiguationReact;
  readonly hooks: any;
}): JSX.Element {
  const mappings = parseWbMappings(dataset);
  const physicalColToMappingCol = (physicalCol: number): number | undefined =>
    mappings?.lines.findIndex(
      ({ headerName }) => headerName === dataset.columns[physicalCol]
    );

  const [disambiguationMatches, setMatches] = React.useState<{
    readonly physicalCols: RA<number>;
    readonly mappingPath: MappingPath;
    readonly ids: RA<number>;
    readonly key: string;
  }>();
  const [disambiguationPhysicalRow, setPhysicalRow] = React.useState<number>();
  const [disambiguationResource, setResource] =
    React.useState<Collection<AnySchema>>();
  const [noDisambiguationDialog, openNoDisamb, closeNoDisamb] =
    useBooleanState();
  const [disambiguationDialog, openDisambiguation, closeDisambiguation] =
    useBooleanState();

  const openDisambiguationDialog = () => {
    if (mappings === undefined || !hotRef.current) return;

    const [visualRow, visualCol] = getSelectedLast(hotRef.current.hotInstance);
    const physicalRow = hotRef.current.hotInstance.toPhysicalRow(visualRow);
    const physicalCol = hotRef.current.hotInstance.toPhysicalColumn(visualCol);

    const matches = validation?.uploadResults.ambiguousMatches[
      physicalRow
    ].find(({ physicalCols }) => physicalCols.includes(physicalCol));
    if (matches === undefined) return;
    const tableName = getTableFromMappingPath(
      mappings.baseTable.name,
      matches.mappingPath
    );
    const table = strictGetTable(tableName);
    const resources = new table.LazyCollection({
      filters: { id__in: matches.ids.join(',') },
    }) as Collection<AnySchema>;

    (hasTablePermission(table.name, 'read')
      ? resources.fetch({ limit: 0 })
      : Promise.resolve(resources)
    ).then(({ models }) => {
      if (models.length === 0) {
        openNoDisamb();
        return;
      }

      // Re-enable this once live validation is available again:
      /*
       * Disable "Apply All" if validation is still in progress.
       * This is because we don't know all matches until validation is done
       */
      /*
       *Let applyAllAvailable = true;
       *const applyAllButton = content.find('#applyAllButton');
       *
       *const updateIt = () => {
       *  const newState = this.liveValidationStack.length === 0;
       *  if (newState !== applyAllAvailable) {
       *    applyAllAvailable = newState;
       *    applyAllButton.disabled = !newState;
       *    applyAllButton[newState ? 'removeAttribute' : 'setAttribute'](
       *      'title',
       *      wbText.applyAllUnavailable()
       *    );
       *  }
       *};
       *
       *const interval = globalThis.setInterval(updateIt, 100);
       * // onClose: globalThis.clearInterval(interval);
       */

      setMatches(matches);
      setResource(resources);
      setPhysicalRow(physicalRow);
      openDisambiguation();
    });
  };

  // Context menu item definitions (common for fillUp and fillDown)
  const fillCellsContextMenuItem = (
    mode: 'down' | 'up'
  ): Handsontable.plugins.ContextMenu.MenuItemConfig => {
    return {
      name: mode === 'up' ? wbText.fillUp() : wbText.fillDown(),
      disabled: () =>
        // typeof this.wbView.uploadedView === 'function' ||
        // typeof this.wbView.coordinateConverterView === 'function' ||
        !hasPermission('/workbench/dataset', 'update') ||
        ((hotRef.current.hotInstance as Handsontable)
          ?.getSelected()
          ?.every((selection) => selection[0] === selection[2]) ??
          false),
      callback: (_: any, selections: any) =>
        selections.forEach((selection: any) =>
          Array.from(
            new Array(selection.end.col + 1 - selection.start.col).keys()
          ).forEach((index) => {
            const startRow =
              mode === 'up' ? selection.start.row + 1 : selection.start.row;
            const endRow = selection.end.row;
            const col = selection.start.col + index;
            const value =
              mode === 'up'
                ? hotRef.current.hotInstance!.getDataAtCell(endRow, col)
                : hotRef.current.hotInstance!.getDataAtCell(startRow, col);
            hotRef.current.hotInstance?.setDataAtCell(
              Array.from({ length: endRow - startRow }, (_, index) => [
                startRow + index + 1,
                col,
                value,
              ])
            );
          })
        ),
    };
  };

  const contextMenuConfig = {
    items: ensure<
      IR<
        | Handsontable.plugins.ContextMenu.MenuItemConfig
        | Handsontable.plugins.ContextMenu.PredefinedMenuItemKey
      >
    >()(
      isUploaded
        ? ({
            // Display uploaded record
            upload_results: {
              disableSelection: true,
              isCommand: false,
              renderer: (_hot, wrapper) => {
                const { endRow: visualRow, endCol: visualCol } =
                  getSelectedRegions(_hot).at(-1) ?? {};
                const physicalRow = _hot.toPhysicalRow(visualRow ?? 0);
                const physicalCol = _hot.toPhysicalColumn(visualCol ?? 0);

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
                    pb-1 wb-uploaded-view-context-menu`
                );
                wrapper.innerHTML = createdRecords
                  .map(([tableName, recordId, label]) => {
                    const tableLabel =
                      label === '' ? strictGetTable(tableName).label : label;
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
              disabled: () =>
                // typeof this.uploadedView === 'function' ||
                // typeof this.coordinateConverterView === 'function' ||
                !hasPermission('/workbench/dataset', 'update'),
            },
            row_below: {
              disabled: () =>
                // typeof this.uploadedView === 'function' ||
                // typeof this.coordinateConverterView === 'function' ||
                !hasPermission('/workbench/dataset', 'update'),
            },
            remove_row: {
              disabled: () => {
                if (
                  // typeof this.uploadedView === 'function' ||
                  // typeof this.coordinateConverterView === 'function' ||
                  !hasPermission('/workbench/dataset', 'update')
                )
                  return true;
                // Or if called on the last row
                const selectedRegions = getSelectedRegions(
                  hotRef.current.hotInstance
                );
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
                // typeof this.uploadedView === 'function' ||
                // typeof this.coordinateConverterView === 'function' ||
                !disambiguation.isAmbiguousCell() ||
                !hasPermission('/workbench/dataset', 'update'),
              callback: () => openDisambiguationDialog(),
            },
            separator_1: '---------',
            fill_down: fillCellsContextMenuItem('down'),
            fill_up: fillCellsContextMenuItem('up'),
            separator_2: '---------',
            undo: {
              disabled: () =>
                // typeof this.uploadedView === 'function' ||
                hotRef.current.hotInstance.isUndoAvailable() !== true ||
                !hasPermission('/workbench/dataset', 'update'),
            },
            redo: {
              disabled: () =>
                // typeof this.uploadedView === 'function' ||
                hotRef.current.hotInstance.isRedoAvailable() !== true ||
                !hasPermission('/workbench/dataset', 'update'),
            },
          } as const)
    ),
  };

  return (
    <>
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
          // Temporarily disabled as copyPasteEnabled throws an error despite having ts-expect-error
          // Typing doesn't match for handsontable 12.1.0, fixed in 14
          // copyPasteEnabled: false,
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
        minSpareRows={userPreferences.get(
          'workBench',
          'editor',
          'minSpareRows'
        )}
        multiColumnSorting={true}
        outsideClickDeselects={false}
        placeholderCellClassName="htPlaceholder"
        ref={hotRef}
        rowHeaders={true}
        sortIndicator={true}
        stretchH="all"
        tabMoves={
          userPreferences.get('workBench', 'editor', 'tabMoveDirection') ===
          'col'
            ? { col: 1, row: 0 }
            : { col: 0, row: 1 }
        }
        readOnly={isUploaded || !hasPermission('/workbench/dataset', 'update')}
        contextMenu={contextMenuConfig as Settings}
        {...hooks}
      />
      {noDisambiguationDialog && (
        <Dialog
          buttons={commonText.close()}
          header={wbText.noDisambiguationResults()}
          onClose={closeNoDisamb}
        >
          {wbText.noDisambiguationResultsDescription()}
        </Dialog>
      )}
      {disambiguationDialog && (
        <DisambiguationDialog
          matches={disambiguationResource!.models}
          onClose={closeDisambiguation}
          onSelected={(selected) => {
            disambiguation.setDisambiguation(
              disambiguationPhysicalRow!,
              disambiguationMatches!.mappingPath,
              selected.id
            );
            validation?.startValidateRow(disambiguationPhysicalRow!);
            hotRef.current.hotInstance?.render();
          }}
          onSelectedAll={(selected): void =>
            // Loop backwards so the live validation will go from top to bottom
            hotRef.current.hotInstance?.batch(() => {
              for (
                let visualRow = data.length - 1;
                visualRow >= 0;
                visualRow--
              ) {
                const physicalRow =
                  hotRef.current.hotInstance!.toPhysicalRow(visualRow);
                if (
                  !validation?.uploadResults.ambiguousMatches[
                    physicalRow
                  ]?.find(
                    ({ key, mappingPath }) =>
                      key === disambiguationMatches!.key &&
                      typeof disambiguation.getDisambiguation(physicalRow)[
                        mappingPathToString(mappingPath)
                      ] !== 'number'
                  )
                )
                  continue;
                disambiguation.setDisambiguation(
                  physicalRow,
                  disambiguationMatches!.mappingPath,
                  selected.id
                );
                validation?.startValidateRow(physicalRow);
              }
            })
          }
        />
      )}
    </>
  );
}
