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

import type { HotTable } from '@handsontable/react';
import type Handsontable from 'handsontable';
import React from 'react';

import { useUnloadProtect } from '../../hooks/navigation';
import { useBooleanState } from '../../hooks/useBooleanState';
import { useErrorContext } from '../../hooks/useErrorContext';
import { commonText } from '../../localization/common';
import { wbPlanText } from '../../localization/wbPlan';
import { wbText } from '../../localization/workbench';
import { Http } from '../../utils/ajax/definitions';
import type { GetSet, RA } from '../../utils/types';
import { clamp } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { Link } from '../Atoms/Link';
import { ReadOnlyContext } from '../Core/Contexts';
import { hasPermission } from '../Permissions/helpers';
import { WbActions } from '../WbActions';
import { useResults } from '../WbActions/useResults';
import type { Dataset } from '../WbPlanView/Wrapped';
import { WbToolkit } from '../WbToolkit';
import { WbUtilsComponent } from '../WbUtils';
import { WbUtils } from '../WbUtils/Utils';
import type { WbCellCounts } from './CellMeta';
import { WbCellMeta } from './CellMeta';
import { DataSetName } from './DataSetMeta';
import { Disambiguation } from './DisambiguationLogic';
import type { WbMapping } from './mapping';
import { parseWbMappings } from './mapping';
import { WbUploaded } from './Results';
import { useDisambiguationDialog } from './useDisambiguationDialog';
import { WbSpreadsheet } from './WbSpreadsheet';
import { WbValidation } from './WbValidation';

export type WbStatus = 'unupload' | 'upload' | 'validate';

export type Workbench = {
  /* eslint-disable functional/prefer-readonly-type */
  cells: WbCellMeta;
  disambiguation: Disambiguation;
  validation: WbValidation;
  utils: WbUtils;
  undoRedoIsHandled: boolean;
  /* eslint-enable functional/prefer-readonly-type */
  readonly dataset: Dataset;
  readonly data: RA<RA<string | null>>;
  readonly hot: Handsontable | undefined;
  readonly throttleRate: number;
  readonly mappings: WbMapping | undefined;
  readonly cellCounts: GetSet<WbCellCounts>;
  readonly spreadsheetChanged: () => void;
};

export function WbView({
  dataset,
  onDatasetDeleted: handleDatasetDeleted,
  triggerDatasetRefresh,
}: {
  readonly dataset: Dataset;
  readonly onDatasetDeleted: () => void;
  readonly triggerDatasetRefresh: () => void;
}): JSX.Element {
  const data = React.useMemo<RA<RA<string | null>>>(
    () =>
      dataset.rows.length === 0
        ? [Array.from(dataset.columns).fill(null)]
        : dataset.rows,
    [dataset]
  );

  const spreadsheetContainerRef = React.useRef<HTMLElement>(null);
  const [hotTable, setHotTable] = React.useState<HotTable | null>(null);
  const hot = hotTable?.hotInstance ?? undefined;

  const isUploaded =
    dataset.uploadresult !== null && dataset.uploadresult.success;
  const isAlreadyReadOnly = React.useContext(ReadOnlyContext);

  const mappings = React.useMemo(
    (): WbMapping | undefined => parseWbMappings(dataset),
    [dataset]
  );
  useErrorContext('mappings', mappings);

  // Throttle cell count update depending on the DS size (between 10ms and 2s)
  const throttleRate = Math.ceil(clamp(10, data.length / 10, 2000));

  const [hasUnsavedChanges, spreadsheetChanged, spreadsheetUpToDate] =
    useBooleanState();
  useUnloadProtect(hasUnsavedChanges, wbText.wbUnloadProtect());

  const [cellCounts, setCellCounts] = React.useState<WbCellCounts>({
    newCells: 0,
    invalidCells: 0,
    searchResults: 0,
    modifiedCells: 0,
    updatedCells: 0,
    deletedCells: 0,
    matchedAndChangedCells: 0
  });

  const workbench = React.useMemo<Workbench>(() => {
    const workbench: Workbench = {
      data,
      dataset,
      hot,
      mappings,
      throttleRate,
      cells: undefined!,
      disambiguation: undefined!,
      validation: undefined!,
      utils: undefined!,
      cellCounts: [cellCounts, setCellCounts],
      undoRedoIsHandled: false,
      spreadsheetChanged,
    };
    workbench.cells = new WbCellMeta(workbench);
    workbench.disambiguation = new Disambiguation(workbench);
    workbench.validation = new WbValidation(workbench);
    workbench.utils = new WbUtils(workbench, spreadsheetContainerRef);
    return workbench;
  }, [dataset, hot]);

  useErrorContext('cells', workbench.cells);
  useErrorContext('disambiguation', workbench.disambiguation);
  useErrorContext('validation', workbench.validation);
  useErrorContext('utils', workbench.utils);

  const checkDeletedFail = React.useCallback((statusCode: number): boolean => {
    if (statusCode === Http.NOT_FOUND) handleDatasetDeleted();
    return statusCode === Http.NOT_FOUND;
  }, []);

  const isMapped = mappings !== undefined;
  const canUpdate = hasPermission('/workbench/dataset', 'update');

  const [showToolkit, _openToolkit, _closeToolkit, toggleToolkit] =
    useBooleanState();

  const { showResults, closeResults, toggleResults } = useResults({
    hot,
    workbench,
    triggerDatasetRefresh,
  });

  const { openDisambiguationDialog, disambiguationDialogs } =
    useDisambiguationDialog({
      hot,
      mappings,
      data,
      validation: workbench.validation,
      disambiguation: workbench.disambiguation,
    });

  const searchRef = React.useRef<HTMLInputElement | null>(null);

  return (
    <ReadOnlyContext.Provider
      value={isAlreadyReadOnly || isUploaded || showResults || !canUpdate}
    >
      <section
        className={`wbs-form ${className.containerFull}`}
        ref={spreadsheetContainerRef}
      >
        <div
          className="flex items-center justify-between gap-x-1 gap-y-2 whitespace-nowrap"
          role="toolbar"
        >
          <DataSetName dataset={dataset} hot={hot} />
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
          <WbActions
            cellCounts={cellCounts}
            checkDeletedFail={checkDeletedFail}
            dataset={dataset}
            hasUnsavedChanges={hasUnsavedChanges}
            isResultsOpen={showResults}
            isUploaded={isUploaded}
            mappings={mappings}
            searchRef={searchRef}
            workbench={workbench}
            onDatasetRefresh={triggerDatasetRefresh}
            onSpreadsheetUpToDate={spreadsheetUpToDate}
            onToggleResults={toggleResults}
          />
        </div>
        {showToolkit && typeof hot === 'object' ? (
          <WbToolkit
            data={data}
            dataset={dataset}
            hasUnsavedChanges={hasUnsavedChanges}
            hot={hot}
            isResultsOpen={showResults}
            isUploaded={isUploaded}
            mappings={mappings}
            triggerDatasetRefresh={triggerDatasetRefresh}
            onDatasetDeleted={handleDatasetDeleted}
          />
        ) : undefined}
        <div className="flex flex-1 gap-4 overflow-hidden">
          <WbSpreadsheet
            checkDeletedFail={checkDeletedFail}
            data={data}
            dataset={dataset}
            hot={hot}
            isResultsOpen={showResults}
            isUploaded={isUploaded}
            mappings={mappings}
            setHotTable={setHotTable}
            spreadsheetChanged={spreadsheetChanged}
            workbench={workbench}
            onClickDisambiguate={openDisambiguationDialog}
          />
          {showResults && (
            <aside aria-live="polite">
              <WbUploaded
                datasetId={dataset.id}
                datasetName={dataset.name}
                isUploaded={isUploaded}
                recordCounts={workbench.validation.uploadResults.recordCounts}
                onClose={closeResults}
              />
            </aside>
          )}
        </div>
        {disambiguationDialogs}
        <WbUtilsComponent
          cellCounts={cellCounts}
          cells={workbench.cells}
          debounceRate={throttleRate}
          isUploaded={isUploaded}
          searchRef={searchRef}
          utils={workbench.utils}
        />
      </section>
    </ReadOnlyContext.Provider>
  );
}
