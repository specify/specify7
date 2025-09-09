import type Handsontable from 'handsontable';
import React from 'react';

import { attachmentsText } from '../../localization/attachments';
import { commonText } from '../../localization/common';
import { wbText } from '../../localization/workbench';
import type { RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { raise } from '../Errors/Crash';
import { ErrorBoundary } from '../Errors/ErrorBoundary';
import { hasTablePermission } from '../Permissions/helpers';
import { userPreferences } from '../Preferences/userPreferences';
import type { Dataset } from '../WbPlanView/Wrapped';
import { resolveVariantFromDataset } from '../WbUtils/datasetVariants';
import { getAttachmentsColumn } from '../WorkBench/attachmentHelpers';
import { downloadDataSet } from '../WorkBench/helpers';
import type { WbMapping } from '../WorkBench/mapping';
import { WbChangeOwner } from './ChangeOwner';
import { WbConvertCoordinates } from './CoordinateConverter';
import { WbRawPlan } from './DevShowPlan';
import { WbGeoLocate } from './GeoLocate';
import { WbLeafletMap } from './WbLeafletMap';

export function WbToolkit({
  dataset,
  hot,
  mappings,
  isUploaded,
  isResultsOpen,
  data,
  onDatasetDeleted: handleDatasetDeleted,
  hasUnsavedChanges,
  triggerDatasetRefresh,
}: {
  readonly dataset: Dataset;
  readonly hot: Handsontable;
  readonly mappings: WbMapping | undefined;
  readonly data: RA<RA<string | null>>;
  readonly isUploaded: boolean;
  readonly isResultsOpen: boolean;
  readonly onDatasetDeleted: () => void;
  readonly hasUnsavedChanges: boolean;
  readonly triggerDatasetRefresh: () => void;
}): JSX.Element {
  const handleExport = (): void => {
    const delimiter = userPreferences.get(
      'workBench',
      'editor',
      'exportFileDelimiter'
    );

    const prepareExport = (
      dataset: Dataset
    ): { readonly columns: RA<string>; readonly rows: RA<RA<string>> } => {
      const defaultOrder = dataset.columns.map((_, i) => i); // Use the existing order as default

      const order =
        dataset.visualorder &&
        dataset.visualorder.length === dataset.columns.length
          ? dataset.visualorder
          : defaultOrder; // Try to apply visual order if present, otherwise just fallback to default

      let columns = order.map((colIndex) => dataset.columns[colIndex]);
      const rows = dataset.rows.map((row) =>
        order.map((colIndex) => row[colIndex] ?? '')
      );

      // Don't export attachments column
      const attachmentsColumnIndex = getAttachmentsColumn(dataset);
      if (attachmentsColumnIndex !== -1) {
        columns = columns.map((col, i) =>
          order[i] === attachmentsColumnIndex
            ? attachmentsText.attachments()
            : col
        );
      }

      return { columns, rows };
    };

    const { columns, rows } = prepareExport(dataset);

    downloadDataSet(dataset.name, rows, columns, delimiter).catch(raise);
  };

  const hasLocality =
    mappings === undefined ? false : mappings.localityColumns.length > 0;

  const variant = resolveVariantFromDataset(dataset);

  return (
    <div
      aria-label={commonText.tools()}
      className="flex flex-wrap gap-x-1 gap-y-2"
      role="toolbar"
    >
      {variant.canTransfer() && hasTablePermission('SpecifyUser', 'read') ? (
        <ErrorBoundary dismissible>
          <WbChangeOwner
            dataset={dataset}
            hasUnsavedChanges={hasUnsavedChanges}
          />
        </ErrorBoundary>
      ) : undefined}
      <ErrorBoundary dismissible>
        <WbRawPlan
          dataset={dataset}
          triggerDatasetRefresh={triggerDatasetRefresh}
          onDatasetDeleted={handleDatasetDeleted}
        />
      </ErrorBoundary>
      <Button.Small
        disabled={hasUnsavedChanges}
        title={hasUnsavedChanges ? wbText.unavailableWhileEditing() : undefined}
        onClick={handleExport}
      >
        {commonText.export()}
      </Button.Small>
      <span className="-ml-1 flex-1" />
      {variant.canUpdate() && (
        <>
          <ErrorBoundary dismissible>
            <WbConvertCoordinates
              data={data}
              dataset={dataset}
              hasLocality={hasLocality}
              hot={hot}
              isResultsOpen={isResultsOpen}
              isUploaded={isUploaded}
              mappings={mappings}
            />
          </ErrorBoundary>
          <ErrorBoundary dismissible>
            <WbGeoLocate
              dataset={dataset}
              hasLocality={hasLocality}
              hot={hot}
              isResultsOpen={isResultsOpen}
              isUploaded={isUploaded}
              mappings={mappings}
            />
          </ErrorBoundary>
        </>
      )}
      <ErrorBoundary dismissible>
        <WbLeafletMap
          dataset={dataset}
          hasLocality={hasLocality}
          hot={hot}
          mappings={mappings}
        />
      </ErrorBoundary>
    </div>
  );
}
