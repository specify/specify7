/**
 * Entrypoint for the WorkBench
 * Handles most user interactions
 * Initializes the spreadsheet (using Handsontable library)
 *
 * @remarks
 * hot refers to Handsontable
 *
 * @module
 *
 */

import '../../../css/workbench.css';

import React from 'react';
import Handsontable from 'handsontable';
import { HotTable } from '@handsontable/react';

import { commonText } from '../../localization/common';
import { wbPlanText } from '../../localization/wbPlan';
import { Http } from '../../utils/ajax/definitions';
import type { GetSet, RA } from '../../utils/types';
import { clamp } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { Link } from '../Atoms/Link';
import { hasPermission } from '../Permissions/helpers';
import type { Dataset } from '../WbPlanView/Wrapped';
import { WbCellCounts, WbCellMeta } from './CellMeta';
import { Disambiguation } from './DisambiguationLogic';
import { getHotPlugin } from './handsontable';
import type { WbMapping } from './mapping';
import { parseWbMappings } from './mapping';
import { WbUploaded } from './Results';
import { WbActionsComponent } from '../WbActions/WbActions';
import { WbUtils, WbUtilsComponent } from './WbUtils';
import { WbValidation } from './WbValidation';
import { DataSetName } from './DataSetMeta';
import { WbSpreadsheet } from './WbSpreadsheet';
import { useBooleanState } from '../../hooks/useBooleanState';
import { WbToolkit } from '../WbToolkit/WbToolkit';

export type WbStatus = 'unupload' | 'upload' | 'validate';

export type Workbench = {
  dataset: Dataset;
  cells: WbCellMeta;
  disambiguation: Disambiguation;
  validation: WbValidation;
  data: RA<RA<string | null>>;
  hot: Handsontable | undefined;
  throttleRate: number;
  mappings: WbMapping;
  utils: WbUtils;
  cellCounts: GetSet<WbCellCounts>;
};

export function WbViewReact({
  dataset,
  handleDatasetDelete,
  triggerDatasetRefresh,
  spreadsheetContainer,
}: {
  readonly dataset: Dataset;
  readonly handleDatasetDelete: () => void;
  readonly triggerDatasetRefresh: () => void;
  readonly spreadsheetContainer: any;
}): JSX.Element {
  const data = React.useMemo<RA<RA<string | null>>>(
    () =>
      dataset.rows.length === 0
        ? [Array.from(dataset.columns).fill(null)]
        : dataset.rows,
    [dataset]
  );

  const [hotTable, setHotTable] = React.useState<HotTable>();
  const hot = React.useMemo(
    () => (hotTable?.hotInstance ? hotTable?.hotInstance : undefined),
    [hotTable]
  );

  const isUploaded = React.useMemo<boolean>(
    () => dataset.uploadresult !== null && dataset.uploadresult.success,
    [dataset]
  );

  const mappings = React.useMemo(
    (): WbMapping | undefined => parseWbMappings(dataset),
    [dataset]
  );

  const throttleRate = Math.ceil(clamp(10, data.length / 10, 2000));

  const [hasUnsavedChanges, spreadsheetChanged, spreadsheetUpToDate] =
    useBooleanState();

  const [cellCounts, setCellCounts] = React.useState<WbCellCounts>({
    newCells: 0,
    invalidCells: 0,
    searchResults: 0,
    modifiedCells: 0,
  });

  const workbench = React.useMemo<Workbench>(() => {
    const workbench: Workbench = {
      data,
      dataset,
      hot: hot,
      mappings: mappings!,
      throttleRate,
      cells: undefined!,
      disambiguation: undefined!,
      validation: undefined!,
      utils: undefined!,
      cellCounts: [cellCounts, setCellCounts],
    };
    workbench.cells = new WbCellMeta(workbench);
    workbench.disambiguation = new Disambiguation(workbench);
    workbench.validation = new WbValidation(workbench);
    workbench.utils = new WbUtils(workbench);
    return workbench;
  }, [dataset, hot]);

  const checkDeletedFail = React.useCallback((statusCode: number): boolean => {
    if (statusCode === Http.NOT_FOUND) handleDatasetDelete();
    return statusCode === Http.NOT_FOUND;
  }, []);

  const isMapped = Boolean(dataset.uploadplan);
  const canUpdate = hasPermission('/workbench/dataset', 'update');

  const [showToolkit, _openToolkit, _closeToolkit, toggleToolkit] =
    useBooleanState();

  // TODO: move all states and logic for Results into a hook
  const [showResults, _, closeResults, toggleResults] = useBooleanState();

  const initialHiddenRows = React.useMemo(
    () =>
      hot === undefined ? [] : getHotPlugin(hot, 'hiddenRows').getHiddenRows(),
    [hot]
  );
  const initialHiddenCols = React.useMemo(
    () =>
      hot === undefined
        ? []
        : getHotPlugin(hot, 'hiddenColumns').getHiddenColumns(),
    [hot]
  );

  // Makes the hot changes required for upload view results
  React.useEffect(() => {
    if (!workbench.hot) return;

    const rowsToInclude = new Set();
    const colsToInclude = new Set();
    Object.entries(workbench.cells.cellMeta).forEach(([physicalRow, rowMeta]) =>
      rowMeta.forEach((metaArray, physicalCol) => {
        if (!workbench.cells.getCellMetaFromArray(metaArray, 'isNew')) return;
        rowsToInclude.add((physicalRow as unknown as number) | 0);
        colsToInclude.add(physicalCol);
      })
    );
    const rowsToHide = workbench.data
      .map((_, physicalRow) => physicalRow)
      .filter(
        (physicalRow) =>
          !rowsToInclude.has(physicalRow) &&
          !initialHiddenRows.includes(physicalRow)
      )
      .map(workbench.hot.toVisualRow);
    const colsToHide = workbench.dataset.columns
      .map((_, physicalCol) => physicalCol)
      .filter(
        (physicalCol) =>
          !colsToInclude.has(physicalCol) &&
          !initialHiddenCols.includes(physicalCol)
      )
      .map(workbench.hot.toVisualColumn);

    if (showResults) {
      workbench.hot?.updateSettings({ readOnly: true });
      getHotPlugin(workbench.hot, 'hiddenRows').hideRows(rowsToHide);
      getHotPlugin(workbench.hot, 'hiddenColumns').hideColumns(colsToHide);

      workbench.utils.toggleCellTypes(
        'newCells',
        'remove',
        spreadsheetContainer.current
      );
    } else {
      getHotPlugin(workbench.hot, 'hiddenRows').showRows(
        rowsToHide.filter((visualRow) => !initialHiddenRows.includes(visualRow))
      );
      getHotPlugin(workbench.hot, 'hiddenColumns').showColumns(
        colsToHide.filter((visualCol) => !initialHiddenCols.includes(visualCol))
      );
    }

    workbench.hot.render();
  }, [showResults]);

  return (
    <>
      <div
        className="flex items-center justify-between gap-x-1 gap-y-2 whitespace-nowrap"
        role="toolbar"
      >
        <div className="contents">
          <DataSetName
            dataset={dataset}
            getRowCount={() =>
              hot === undefined
                ? dataset.rows.length
                : hot.countRows() - hot.countEmptyRows(true)
            }
          />
        </div>
        <Button.Small
          aria-haspopup="grid"
          aria-pressed={showToolkit}
          onClick={toggleToolkit}
        >
          {commonText.tools()}
        </Button.Small>
        <span className="-ml-1 flex-1" />
        {canUpdate || isMapped ? (
          <Link.Small href={`/specify/workbench/plan/${dataset.id}/`}>
            {wbPlanText.dataMapper()}
          </Link.Small>
        ) : undefined}
        <WbActionsComponent
          dataset={dataset}
          hasUnsavedChanges={hasUnsavedChanges}
          isUploaded={isUploaded}
          onDatasetRefresh={triggerDatasetRefresh}
          mappings={mappings!}
          checkDeletedFail={checkDeletedFail}
          onSpreadsheetUpToDate={spreadsheetUpToDate}
          workbench={workbench}
          onToggleResults={toggleResults}
        />
      </div>
      {showToolkit ? (
        <WbToolkit
          dataset={dataset}
          hot={hot}
          mappings={mappings!}
          data={data}
          handleDatasetDelete={handleDatasetDelete}
          hasUnsavedChanges={hasUnsavedChanges}
          triggerDatasetRefresh={triggerDatasetRefresh}
        />
      ) : undefined}
      <div className="flex flex-1 gap-4 overflow-hidden">
        <section className="flex-1 overflow-hidden overscroll-none">
          <WbSpreadsheet
            dataset={dataset}
            setHotTable={setHotTable as React.Ref<HotTable>}
            hot={hot}
            isUploaded={isUploaded}
            data={data}
            workbench={workbench}
            mappings={mappings!}
            checkDeletedFail={checkDeletedFail}
            spreadsheetChanged={spreadsheetChanged}
          />
        </section>
        {showResults ? (
          <aside aria-live="polite">
            <WbUploaded
              dataSetId={dataset.id}
              dataSetName={dataset.name}
              isUploaded={isUploaded}
              recordCounts={workbench.validation.uploadResults.recordCounts}
              onClose={closeResults}
            />
          </aside>
        ) : undefined}
      </div>
      <WbUtilsComponent
        isUploaded={isUploaded}
        cellCounts={cellCounts}
        utils={workbench.utils}
        spreadsheetContainer={spreadsheetContainer}
      />
    </>
  );
}
