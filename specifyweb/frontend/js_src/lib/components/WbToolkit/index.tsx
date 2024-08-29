import type Handsontable from 'handsontable';
import React from 'react';

import { commonText } from '../../localization/common';
import { wbText } from '../../localization/workbench';
import type { RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { raise } from '../Errors/Crash';
import { ErrorBoundary } from '../Errors/ErrorBoundary';
import { hasTablePermission } from '../Permissions/helpers';
import { userPreferences } from '../Preferences/userPreferences';
import type { Dataset } from '../WbPlanView/Wrapped';
import { downloadDataSet } from '../WorkBench/helpers';
import type { WbMapping } from '../WorkBench/mapping';
import { WbChangeOwner } from './ChangeOwner';
import { WbConvertCoordinates } from './CoordinateConverter';
import { WbRawPlan } from './DevShowPlan';
import { WbGeoLocate } from './GeoLocate';
import { WbLeafletMap } from './WbLeafletMap';
import { resolveVariantFromDataset } from '../WbUtils/datasetVariants';

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

    downloadDataSet(
      dataset.name,
      dataset.rows,
      dataset.columns,
      delimiter
    ).catch(raise);
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
      {variant.canTransfer() &&
      hasTablePermission('SpecifyUser', 'read') ? (
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
