import React from 'react';
import Handsontable from 'handsontable';

import { hasPermission, hasTablePermission } from '../Permissions/helpers';
import { WbChangeOwner } from './ChangeOwner';
import { WbConvertCoordinates } from './CoordinateConverter';
import { commonText } from '../../localization/common';
import { wbText } from '../../localization/workbench';
import type { RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { raise } from '../Errors/Crash';
import { userPreferences } from '../Preferences/userPreferences';
import type { Dataset } from '../WbPlanView/Wrapped';
import { downloadDataSet } from '../WorkBench/helpers';
import type { WbMapping } from '../WorkBench/mapping';
import { WbRawPlan } from './DevShowPlan';
import { WbGeoLocate } from './GeoLocate';
import { WbLeafletMap } from './WbLeafletMap';
import { ErrorBoundary } from '../Errors/ErrorBoundary';

export function WbToolkit({
  dataset,
  hot,
  mappings,
  data,
  onDatasetDeleted: handleDatasetDeleted,
  hasUnsavedChanges,
  triggerDatasetRefresh,
}: {
  readonly dataset: Dataset;
  readonly hot: Handsontable;
  readonly mappings: WbMapping | undefined;
  readonly data: RA<RA<string | null>>;
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

  const hasLocality = mappings !== undefined ? mappings.localityColumns.length > 0 : false;

  // TODO: Render certain elements only after hot has loaded
  return (
    <div
      aria-label={commonText.tools()}
      className="flex flex-wrap gap-x-1 gap-y-2"
      role="toolbar"
    >
      {hasPermission('/workbench/dataset', 'transfer') &&
      hasTablePermission('SpecifyUser', 'read') ? (
        <>
          <ErrorBoundary dismissible>
            <WbChangeOwner
              hasUnsavedChanges={hasUnsavedChanges}
              dataset={dataset}
            />
          </ErrorBoundary>
        </>
      ) : undefined}
      <ErrorBoundary dismissible>
        <WbRawPlan
          dataset={dataset}
          onDatasetDeleted={handleDatasetDeleted}
          triggerDatasetRefresh={triggerDatasetRefresh}
        />
      </ErrorBoundary>
      <Button.Small
        onClick={handleExport}
        disabled={hasUnsavedChanges}
        title={hasUnsavedChanges ? wbText.unavailableWhileEditing() : ''}
      >
        {commonText.export()}
      </Button.Small>
      <span className="-ml-1 flex-1" />
      {hasPermission('/workbench/dataset', 'update') && (
        <>
          <ErrorBoundary dismissible>
            <WbConvertCoordinates
              dataset={dataset}
              data={data}
              mappings={mappings}
              hot={hot}
              hasLocality={hasLocality}
            />
          </ErrorBoundary>
          <ErrorBoundary dismissible>
            <WbGeoLocate
              hasLocality={hasLocality}
              hot={hot}
              dataset={dataset}
              mappings={mappings}
            />
          </ErrorBoundary>
        </>
      )}
      <ErrorBoundary dismissible>
        <WbLeafletMap
          hasLocality={hasLocality}
          hot={hot}
          dataset={dataset}
          mappings={mappings}
        />
      </ErrorBoundary>
    </div>
  );
}
