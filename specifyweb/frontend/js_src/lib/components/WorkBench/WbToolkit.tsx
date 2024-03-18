import React from 'react';

import { hasPermission, hasTablePermission } from '../Permissions/helpers';
import { ChangeOwner } from './DataSetMeta';
import { localityText } from '../../localization/locality';
import { getSelectedLocalities, WbGeoLocate } from './GeoLocate';
import { getLocalitiesDataFromSpreadsheet } from '../Leaflet/wbLocalityDataExtractor';
import { getSelectedLast, getVisualHeaders } from './hotHelpers';
import { LeafletMap } from '../Leaflet/Map';
import { CoordinateConverter } from './CoordinateConverter';
import { commonText } from '../../localization/common';
import { wbText } from '../../localization/workbench';
import type { RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { raise } from '../Errors/Crash';
import { userPreferences } from '../Preferences/userPreferences';
import type { Dataset } from '../WbPlanView/Wrapped';
import { downloadDataSet } from './helpers';
import type { WbMapping } from './mapping';
import type { HandlersObject } from './WbView';
import type { UploadPlan } from '../WbPlanView/uploadPlanParser';
import { DevShowPlan } from './DevShowPlan';
import { overwriteReadOnly } from '../../utils/types';

export function WbToolkit({
  dataset,
  hotRef,
  toolkitOptions,
  mappings,
  data,
  handleDatasetDelete,
}: {
  readonly dataset: Dataset;
  readonly hotRef: any;
  readonly toolkitOptions: HandlersObject;
  readonly mappings: WbMapping;
  readonly data: RA<RA<string | null>>;
  handleDatasetDelete: () => void;
}): JSX.Element {
  const hot = hotRef.current.hotInstance;

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

  const localityPoints = React.useMemo(() => {
    const selection = getSelectedLocalities(
      hot,
      dataset.columns,
      mappings.localityColumns,
      false
    );

    if (!selection) return undefined;

    return getLocalitiesDataFromSpreadsheet(
      mappings.localityColumns,
      selection.visualRows.map((visualRow) => hot!.getDataAtRow(visualRow)),
      getVisualHeaders(hot, dataset.columns),
      selection.visualRows
    );
  }, [mappings.localityColumns]);

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
          <Button.Small
            aria-haspopup="dialog"
            aria-pressed={toolkitOptions.changeOwner.show}
            className="wb-change-data-set-owner"
            onClick={toolkitOptions.changeOwner.open}
          >
            {wbText.changeOwner()}
          </Button.Small>
          <Button.Small
            aria-haspopup="dialog"
            aria-pressed={toolkitOptions.devPlan.show}
            className="wb-show-plan"
            onClick={toolkitOptions.devPlan.open}
          >
            {wbText.uploadPlan()}
          </Button.Small>
        </>
      ) : undefined}
      <Button.Small className="wb-export-data-set" onClick={handleExport}>
        {commonText.export()}
      </Button.Small>
      <span className="-ml-1 flex-1" />
      {hasPermission('/workbench/dataset', 'update') && (
        <>
          <Button.Small
            aria-haspopup="dialog"
            aria-pressed={toolkitOptions.coordinatesConversion.show}
            className="wb-convert-coordinates"
            title={wbText.unavailableWithoutLocality()}
            onClick={toolkitOptions.coordinatesConversion.open}
            disabled={!hasLocality}
          >
            {wbText.convertCoordinates()}
          </Button.Small>
          <Button.Small
            aria-haspopup="dialog"
            aria-pressed={toolkitOptions.geoLocate.show}
            className="wb-geolocate"
            title={wbText.unavailableWithoutLocality()}
            onClick={toolkitOptions.geoLocate.open}
            disabled={!hasLocality}
          >
            {localityText.geoLocate()}
          </Button.Small>
        </>
      )}
      <Button.Small
        aria-haspopup="dialog"
        aria-pressed={toolkitOptions.leafletMap.show}
        className="wb-leafletmap"
        title={wbText.unavailableWithoutLocality()}
        onClick={toolkitOptions.leafletMap.open}
        disabled={!hasLocality}
      >
        {localityText.geoMap()}
      </Button.Small>
      {toolkitOptions.changeOwner.show && (
        <ChangeOwner
          dataset={dataset}
          onClose={toolkitOptions.changeOwner.close}
        />
      )}
      {toolkitOptions.devPlan.show && (
        <DevShowPlan
          dataSetId={dataset.id}
          dataSetName={dataset.name}
          uploadPlan={dataset.uploadplan ?? ({} as UploadPlan)}
          onChanged={(plan) => {
            overwriteReadOnly(dataset, 'uploadplan', plan);
            // TODO: figure out this trigger
            // trigger('refresh');
          }}
          onClose={toolkitOptions.devPlan.close}
          onDeleted={handleDatasetDelete}
        />
      )}
      {toolkitOptions.coordinatesConversion.show && (
        <CoordinateConverter
          columns={dataset.columns}
          coordinateColumns={mappings.coordinateColumns}
          data={data}
          hot={hot}
          onClose={toolkitOptions.coordinatesConversion.close}
        />
      )}
      {toolkitOptions.geoLocate.show && mappings && (
        <WbGeoLocate
          columns={dataset.columns}
          hot={hot}
          localityColumns={mappings.localityColumns}
          onClose={toolkitOptions.geoLocate.close}
        />
      )}
      {toolkitOptions.leafletMap.show && (
        <LeafletMap
          localityPoints={localityPoints}
          onClose={toolkitOptions.leafletMap.close}
          onMarkerClick={(localityPoint: any): void => {
            if (localityPoints === undefined) return;
            const rowNumber = localityPoints[localityPoint].rowNumber.value;
            if (typeof rowNumber !== 'number')
              throw new Error('rowNumber must be a number');
            const [_currentRow, currentCol] = getSelectedLast(hot!);
            hot?.scrollViewportTo(rowNumber, currentCol);
            // Select entire row
            hot?.selectRows(rowNumber);
          }}
        />
      )}
    </div>
  );
}
