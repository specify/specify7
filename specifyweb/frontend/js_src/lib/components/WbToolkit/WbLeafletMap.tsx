import type Handsontable from 'handsontable';
import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { localityText } from '../../localization/locality';
import { wbText } from '../../localization/workbench';
import { Button } from '../Atoms/Button';
import { LeafletMap } from '../Leaflet/Map';
import { getLocalitiesDataFromSpreadsheet } from '../Leaflet/wbLocalityDataExtractor';
import type { Dataset } from '../WbPlanView/Wrapped';
import { getSelectedLast, getVisualHeaders } from '../WorkBench/hotHelpers';
import type { WbMapping } from '../WorkBench/mapping';
import { getSelectedLocalities } from './GeoLocate';

export function WbLeafletMap({
  hasLocality,
  hot,
  dataset,
  mappings,
}: {
  readonly hasLocality: boolean;
  readonly hot: Handsontable;
  readonly dataset: Dataset;
  readonly mappings: WbMapping | undefined;
}): JSX.Element {
  const [showLeafletMap, openLeafletMap, closeLeafletMap] = useBooleanState();
  const localityPoints = React.useMemo(() => {
    if (mappings === undefined) return undefined;
    const selection = getSelectedLocalities(
      hot,
      dataset.columns,
      mappings.localityColumns,
      false
    );

    if (selection === undefined) return undefined;

    return getLocalitiesDataFromSpreadsheet(
      mappings.localityColumns,
      selection.visualRows.map((visualRow) => hot.getDataAtRow(visualRow)),
      getVisualHeaders(hot, dataset.columns),
      selection.visualRows
    );
  }, [mappings?.localityColumns]);

  return (
    <>
      <Button.Small
        aria-haspopup="dialog"
        aria-pressed={showLeafletMap}
        disabled={!hasLocality}
        title={wbText.unavailableWithoutLocality()}
        onClick={openLeafletMap}
      >
        {localityText.geoMap()}
      </Button.Small>
      {showLeafletMap && (
        <LeafletMap
          localityPoints={localityPoints}
          onClose={closeLeafletMap}
          onMarkerClick={(localityPoint: any): void => {
            if (localityPoints === undefined) return;
            const rowNumber = localityPoints[localityPoint].rowNumber.value;
            if (typeof rowNumber !== 'number')
              throw new Error('rowNumber must be a number');
            const [_currentRow, currentCol] = getSelectedLast(hot);
            hot.scrollViewportTo(rowNumber, currentCol);
            // Select entire row
            hot.selectRows(rowNumber);
          }}
        />
      )}
    </>
  );
}
