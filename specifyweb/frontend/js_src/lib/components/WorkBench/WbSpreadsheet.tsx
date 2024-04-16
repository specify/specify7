/**
 * Component for the Handsontable React wrapper
 *
 * TODO:
 * - Upgrade to handsontable14 to fix copyPasteEnabled error
 * - Fix font size and color in the table
 */

import { HotTable } from '@handsontable/react';
import Handsontable from 'handsontable';
import React from 'react';
import type { DetailedSettings } from 'handsontable/plugins/contextMenu';

import { LANGUAGE } from '../../localization/utils/config';
import { type RA } from '../../utils/types';
import { legacyNonJsxIcons } from '../Atoms/Icons';
import type { Dataset } from '../WbPlanView/Wrapped';
import { WbMapping } from './mapping';
import { getSelectedRegions } from './hotHelpers';
import { configureHandsontable } from './handsontable';
import { fetchWbPickLists } from './pickLists';
import { getHotHooks } from './hooks';
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
import { registerAllModules } from 'handsontable/registry';
import { Workbench } from './WbView';
import { ReadOnlyContext } from '../Core/Contexts';
import { getHotProps } from './hotProps';

registerAllModules();

// Context menu item definitions (common for fillUp and fillDown)
const fillCellsContextMenuItem = (
  hot: Handsontable,
  mode: 'down' | 'up',
  isReadOnly: boolean
): Handsontable.plugins.ContextMenu.MenuItemConfig => {
  return {
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
          hot.setDataAtCell(
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

function WbSpreadsheetComponent({
  dataset,
  setHotTable,
  hot,
  isUploaded,
  data,
  workbench,
  mappings,
  checkDeletedFail,
  spreadsheetChanged,
}: {
  readonly dataset: Dataset;
  readonly setHotTable: React.RefCallback<HotTable>;
  readonly hot: Handsontable | undefined;
  readonly isUploaded: boolean;
  readonly data: RA<RA<string | null>>;
  readonly workbench: Workbench;
  readonly mappings: WbMapping | undefined;
  readonly checkDeletedFail: (_: number) => boolean;
  readonly spreadsheetChanged: () => void;
}): JSX.Element {
  const isReadOnly = React.useContext(ReadOnlyContext);
  const physicalColToMappingCol = (physicalCol: number): number | undefined =>
    mappings?.lines.findIndex(
      ({ headerName }) => headerName === dataset.columns[physicalCol]
    );

  const { validation, cells, disambiguation } = workbench;
  const [disambiguationMatches, setDisambiguationMatches] = React.useState<{
    readonly physicalCols: RA<number>;
    readonly mappingPath: MappingPath;
    readonly ids: RA<number>;
    readonly key: string;
  }>();
  const [disambiguationPhysicalRow, setPhysicalRow] = React.useState<number>();
  const [disambiguationResource, setResource] =
    React.useState<Collection<AnySchema>>();
  const [
    noDisambiguationDialog,
    openNoDisambiguationDialog,
    closeNoDisambiguationDialog,
  ] = useBooleanState();
  const [disambiguationDialog, openDisambiguation, closeDisambiguation] =
    useBooleanState();

  const openDisambiguationDialog = () => {
    if (mappings === undefined || hot === undefined) return;

    const [visualRow, visualCol] = getSelectedLast(hot);
    const physicalRow = hot.toPhysicalRow(visualRow);
    const physicalCol = hot.toPhysicalColumn(visualCol);

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
        openNoDisambiguationDialog();
        return;
      }
      setDisambiguationMatches(matches);
      setResource(resources);
      setPhysicalRow(physicalRow);
      openDisambiguation();
    });
  };

  // @ts-expect-error Typing error for separators as DetailedSettings only allows one separator
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
                    const selectedRegions = getSelectedRegions(hot!);
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
                  callback: () => openDisambiguationDialog(),
                },
                separator_1: '---------',
                fill_down: fillCellsContextMenuItem(hot, 'down', isReadOnly),
                fill_up: fillCellsContextMenuItem(hot, 'up', isReadOnly),
                separator_2: '---------',
                undo: {
                  disabled: () => hot.isUndoAvailable() !== true || isReadOnly,
                },
                redo: {
                  disabled: () => hot.isRedoAvailable() !== true || isReadOnly,
                },
              } as const),
        };

  React.useEffect(() => {
    if (hot === undefined) return;
    (mappings === undefined
      ? Promise.resolve({})
      : fetchWbPickLists(dataset.columns, mappings.tableNames, mappings.lines)
    ).then((pickLists) =>
      configureHandsontable(hot, mappings, dataset, pickLists)
    );
  }, [hot]);

  // Highlight validation cells
  React.useEffect(() => {
    if (dataset.rowresults !== null && hot !== undefined) {
      validation.getValidationResults();
      if (validation.validationMode === 'static' && !isUploaded)
        workbench.utils.toggleCellTypes('invalidCells', 'remove');
      workbench.cells.flushIndexedCellData = true;
    }
  }, [dataset.rowresults, hot]);

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
  } = getHotProps({ dataset, mappings, physicalColToMappingCol });

  const hooks = getHotHooks(
    workbench,
    physicalColToMappingCol,
    spreadsheetChanged,
    checkDeletedFail,
    isReadOnly
  );

  return (
    <section className="flex-1 overflow-hidden overscroll-none">
      <HotTable
        autoWrapCol={autoWrapCol}
        autoWrapRow={autoWrapRow}
        colHeaders={colHeaders}
        columns={columns}
        commentedCellClassName="htCommentCell"
        comments={comments}
        data={data as (string | null)[][]}
        enterBeginsEditing={enterBeginsEditing}
        enterMoves={enterMoves}
        hiddenColumns={hiddenColumns}
        hiddenRows={hiddenRows}
        invalidCellClassName="-"
        language={LANGUAGE}
        licenseKey="non-commercial-and-evaluation"
        manualColumnMove={true}
        manualColumnResize={true}
        minSpareRows={minSpareRows}
        multiColumnSorting={true}
        outsideClickDeselects={false}
        placeholderCellClassName="htPlaceholder"
        ref={setHotTable}
        rowHeaders={true}
        // @ts-expect-error typing error, possibly fixed in v14
        sortIndicator={true}
        stretchH="all"
        tabMoves={tabMoves}
        readOnly={isReadOnly}
        contextMenu={contextMenuConfig}
        {...hooks}
      />
      {noDisambiguationDialog && (
        <Dialog
          buttons={commonText.close()}
          header={wbText.noDisambiguationResults()}
          onClose={closeNoDisambiguationDialog}
        >
          {wbText.noDisambiguationResultsDescription()}
        </Dialog>
      )}
      {disambiguationDialog && (
        <DisambiguationDialog
          matches={disambiguationResource!.models}
          liveValidationStack={workbench.validation.liveValidationStack}
          onClose={closeDisambiguation}
          onSelected={(selected) => {
            disambiguation.setDisambiguation(
              disambiguationPhysicalRow!,
              disambiguationMatches!.mappingPath,
              selected.id
            );
            validation?.startValidateRow(disambiguationPhysicalRow!);
            hot?.render();
          }}
          onSelectedAll={(selected): void =>
            // Loop backwards so the live validation will go from top to bottom
            hot?.batch(() => {
              for (
                let visualRow = data.length - 1;
                visualRow >= 0;
                visualRow--
              ) {
                const physicalRow = hot?.toPhysicalRow(visualRow);
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
    </section>
  );
}

export const WbSpreadsheet = React.memo(WbSpreadsheetComponent);
