import type Handsontable from 'handsontable';
import React from 'react';

import { localityText } from '../../localization/locality';
import { wbText } from '../../localization/workbench';
import type { IR, RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import type { Field } from '../Leaflet/helpers';
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
  const [localityPoints, setLocalityPoints] = React.useState<
    RA<IR<Field<number | string>>> | undefined
  >(undefined);

  const handleOpen = () => {
    const selection =
      mappings === undefined
        ? undefined
        : getSelectedLocalities(
            hot,
            dataset.columns,
            mappings.localityColumns,
            true,
            true
          );
    const localityPoints =
      selection === undefined || mappings === undefined
        ? undefined
        : getLocalitiesDataFromSpreadsheet(
            mappings.localityColumns,
            selection.visualRows.map((visualRow) =>
              hot.getDataAtRow(visualRow)
            ),
            getVisualHeaders(hot, dataset.columns),
            selection.visualRows
          );
    setLocalityPoints(localityPoints);
  };

  return (
    <>
      <Button.Small
        aria-haspopup="dialog"
        aria-pressed={localityPoints !== undefined}
        disabled={!hasLocality}
        title={wbText.unavailableWithoutLocality()}
        onClick={handleOpen}
      >
        {localityText.geoMap()}
      </Button.Small>
      {localityPoints !== undefined && (
        <LeafletMap
          localityPoints={localityPoints}
          onClose={() => setLocalityPoints(undefined)}
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
