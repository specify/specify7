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
import type { WbMapping } from './mapping';
import { parseWbMappings } from './mapping';
import { WbUploaded } from './Results';
import { WbActions } from '../WbActions/WbActions';
import { WbUtils, WbUtilsComponent } from './WbUtils';
import { WbValidation } from './WbValidation';
import { DataSetName } from './DataSetMeta';
import { WbSpreadsheet } from './WbSpreadsheet';
import { useBooleanState } from '../../hooks/useBooleanState';
import { WbToolkit } from '../WbToolkit/WbToolkit';
import { ReadOnlyContext } from '../Core/Contexts';
import { useResults } from '../WbActions/useResults';
import { getSelectedLast } from './hotHelpers';
import { getTableFromMappingPath } from '../WbPlanView/navigator';
import { hasTablePermission } from '../Permissions/helpers';
import type { Collection } from '../DataModel/specifyTable';
import { AnySchema } from '../DataModel/helperTypes';
import { Dialog } from '../Molecules/Dialog';
import { DisambiguationDialog } from './Disambiguation';
import { mappingPathToString } from '../WbPlanView/mappingHelpers';
import { MappingPath } from '../WbPlanView/Mapper';
import { strictGetTable } from '../DataModel/tables';

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
  spreadsheetContainerRef: React.RefObject<HTMLElement>;
  undoRedoIsHandled: boolean;
  spreadsheetChanged: () => void;
};

export function WbView({
  dataset,
  onDatasetDeleted: handleDatasetDeleted,
  triggerDatasetRefresh,
  spreadsheetContainerRef,
}: {
  readonly dataset: Dataset;
  readonly onDatasetDeleted: () => void;
  readonly triggerDatasetRefresh: () => void;
  readonly spreadsheetContainerRef: React.RefObject<HTMLElement>;
}): JSX.Element {
  const data = React.useMemo<RA<RA<string | null>>>(
    () =>
      dataset.rows.length === 0
        ? [Array.from(dataset.columns).fill(null)]
        : dataset.rows,
    [dataset]
  );

  const [hotTable, setHotTable] = React.useState<HotTable | null>(null);
  const hot = hotTable?.hotInstance ?? undefined;

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
      spreadsheetContainerRef,
      undoRedoIsHandled: false,
      spreadsheetChanged,
    };
    workbench.cells = new WbCellMeta(workbench);
    workbench.disambiguation = new Disambiguation(workbench);
    workbench.validation = new WbValidation(workbench);
    workbench.utils = new WbUtils(workbench);
    return workbench;
  }, [dataset, hot]);

  const checkDeletedFail = React.useCallback((statusCode: number): boolean => {
    if (statusCode === Http.NOT_FOUND) handleDatasetDeleted();
    return statusCode === Http.NOT_FOUND;
  }, []);

  const isMapped = Boolean(dataset.uploadplan);
  const canUpdate = hasPermission('/workbench/dataset', 'update');

  const [showToolkit, _openToolkit, _closeToolkit, toggleToolkit] =
    useBooleanState();

  const { showResults, closeResults, toggleResults } = useResults({
    hot,
    workbench,
    spreadsheetContainerRef,
  });

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

  const openDisambiguationDialog = React.useCallback(() => {
    if (mappings === undefined || hot === undefined) return;

    const [visualRow, visualCol] = getSelectedLast(hot);
    const physicalRow = hot.toPhysicalRow(visualRow);
    const physicalCol = hot.toPhysicalColumn(visualCol);

    const matches = workbench.validation.uploadResults.ambiguousMatches[
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
  }, [mappings, hot]);

  return (
    <ReadOnlyContext.Provider value={isUploaded || showResults || !canUpdate}>
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
          dataset={dataset}
          hasUnsavedChanges={hasUnsavedChanges}
          isUploaded={isUploaded}
          isResultsOpen={showResults}
          onDatasetRefresh={triggerDatasetRefresh}
          mappings={mappings}
          checkDeletedFail={checkDeletedFail}
          onSpreadsheetUpToDate={spreadsheetUpToDate}
          workbench={workbench}
          onToggleResults={toggleResults}
        />
      </div>
      {showToolkit && typeof hot === 'object' ? (
        <WbToolkit
          dataset={dataset}
          hot={hot}
          mappings={mappings}
          data={data}
          onDatasetDeleted={handleDatasetDeleted}
          hasUnsavedChanges={hasUnsavedChanges}
          triggerDatasetRefresh={triggerDatasetRefresh}
        />
      ) : undefined}
      <div className="flex flex-1 gap-4 overflow-hidden">
        <WbSpreadsheet
          dataset={dataset}
          setHotTable={setHotTable}
          hot={hot}
          isUploaded={isUploaded}
          data={data}
          workbench={workbench}
          mappings={mappings}
          checkDeletedFail={checkDeletedFail}
          spreadsheetChanged={spreadsheetChanged}
          onClickDisambiguate={openDisambiguationDialog}
        />
        {showResults ? (
          <aside aria-live="polite">
            <WbUploaded
              datasetId={dataset.id}
              datasetName={dataset.name}
              isUploaded={isUploaded}
              recordCounts={workbench.validation.uploadResults.recordCounts}
              onClose={closeResults}
            />
          </aside>
        ) : undefined}
      </div>
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
            workbench.disambiguation.setDisambiguation(
              disambiguationPhysicalRow!,
              disambiguationMatches!.mappingPath,
              selected.id
            );
            workbench.validation.startValidateRow(disambiguationPhysicalRow!);
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
                  !workbench.validation.uploadResults.ambiguousMatches[
                    physicalRow
                  ]?.find(
                    ({ key, mappingPath }) =>
                      key === disambiguationMatches!.key &&
                      typeof workbench.disambiguation.getDisambiguation(
                        physicalRow
                      )[mappingPathToString(mappingPath)] !== 'number'
                  )
                )
                  continue;
                workbench.disambiguation.setDisambiguation(
                  physicalRow,
                  disambiguationMatches!.mappingPath,
                  selected.id
                );
                workbench.validation.startValidateRow(physicalRow);
              }
            })
          }
        />
      )}
      <WbUtilsComponent
        isUploaded={isUploaded}
        cellCounts={cellCounts}
        utils={workbench.utils}
        cells={workbench.cells}
        debounceRate={Math.ceil(clamp(10, data.length / 20, 200))}
      />
    </ReadOnlyContext.Provider>
  );
}
