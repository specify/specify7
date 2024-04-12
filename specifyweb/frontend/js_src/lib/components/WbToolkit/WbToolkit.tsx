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
  readonly hot: Handsontable | undefined;
  readonly mappings: WbMapping;
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

  const hasLocality = mappings ? mappings.localityColumns.length > 0 : false;

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
          <WbChangeOwner
            hasUnsavedChanges={hasUnsavedChanges}
            dataset={dataset}
          />
        </>
      ) : undefined}
      <WbRawPlan
        dataset={dataset}
        onDatasetDeleted={handleDatasetDeleted}
        triggerDatasetRefresh={triggerDatasetRefresh}
      />
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
          <WbConvertCoordinates
            dataset={dataset}
            data={data}
            mappings={mappings}
            hot={hot!}
            hasLocality={hasLocality}
          />
          <WbGeoLocate
            hasLocality={hasLocality}
            hot={hot!}
            dataset={dataset}
            mappings={mappings}
          />
        </>
      )}
      <WbLeafletMap
        hasLocality={hasLocality}
        hot={hot!}
        dataset={dataset}
        mappings={mappings}
      />
    </div>
  );
}
