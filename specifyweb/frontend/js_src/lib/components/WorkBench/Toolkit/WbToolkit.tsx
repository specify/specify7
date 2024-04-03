import React from 'react';
import { HotTable } from '@handsontable/react';

import { hasPermission, hasTablePermission } from '../../Permissions/helpers';
import { WbChangeOwner } from './ChangeOwner';
import { WbConvertCoordinates } from './CoordinateConverter';
import { commonText } from '../../../localization/common';
import { wbText } from '../../../localization/workbench';
import type { RA } from '../../../utils/types';
import { Button } from '../../Atoms/Button';
import { raise } from '../../Errors/Crash';
import { userPreferences } from '../../Preferences/userPreferences';
import type { Dataset } from '../../WbPlanView/Wrapped';
import { downloadDataSet } from '../helpers';
import type { WbMapping } from '../mapping';
import { WbDevPlan } from './DevShowPlan';
import { WbGeoLocate } from './GeoLocate';
import { WbLeafletMap } from './WbLeafletMap';

export function WbToolkit({
  dataset,
  hotRef,
  mappings,
  data,
  handleDatasetDelete,
  hasUnSavedChanges,
  triggerRefresh,
}: {
  readonly dataset: Dataset;
  readonly hotRef: React.RefObject<HotTable>;
  readonly mappings: WbMapping;
  readonly data: RA<RA<string | null>>;
  readonly handleDatasetDelete: () => void;
  readonly hasUnSavedChanges: boolean;
  readonly triggerRefresh: () => void;
}): JSX.Element {
  const hot = React.useMemo(
    () => hotRef.current?.hotInstance,
    [hotRef.current]
  );
  const handleExport = React.useCallback((): void => {
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
  }, [dataset]);

  const hasLocality = mappings ? mappings.localityColumns.length > 0 : false;
  return (
    <div
      aria-label={commonText.tools()}
      className="wb-toolkit flex flex-wrap gap-x-1 gap-y-2"
      role="toolbar"
    >
      {hasPermission('/workbench/dataset', 'transfer') &&
      hasTablePermission('SpecifyUser', 'read') ? (
        <>
          <WbChangeOwner
            hasUnSavedChanges={hasUnSavedChanges}
            dataset={dataset}
          />
          <WbDevPlan
            dataset={dataset}
            handleDatasetDelete={handleDatasetDelete}
            triggerRefresh={triggerRefresh}
          />
        </>
      ) : undefined}
      <Button.Small
        className="wb-export-data-set"
        onClick={handleExport}
        disabled={hasUnSavedChanges}
        title={hasUnSavedChanges ? wbText.unavailableWhileEditing() : ''}
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
        hot={hot}
        dataset={dataset}
        mappings={mappings}
      />
    </div>
  );
}
