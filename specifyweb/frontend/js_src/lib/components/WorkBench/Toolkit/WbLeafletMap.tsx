import React from "react";
import Handsontable from "handsontable";

import { getSelectedLocalities } from './GeoLocate';
import { getLocalitiesDataFromSpreadsheet } from '../../Leaflet/wbLocalityDataExtractor';
import { getSelectedLast, getVisualHeaders } from '../hotHelpers';
import { LeafletMap } from '../../Leaflet/Map';
import { useBooleanState } from '../../../hooks/useBooleanState';
import type { Dataset } from "../../WbPlanView/Wrapped";
import type { WbMapping } from "../mapping";
import { Button } from "../../Atoms/Button";
import { localityText } from "../../../localization/locality";
import { wbText } from "../../../localization/workbench";

export function WbLeafletMap({
    hasLocality,
    hot,
    dataset,
    mappings,
  }: {
    readonly hasLocality: boolean;
    readonly hot: Handsontable;
    readonly dataset: Dataset;
    readonly mappings: WbMapping;
  }): JSX.Element {
    const [showLeafletMap, openLeafletMap, closeLeafletMap] = useBooleanState();
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
  
    return (
      <>
        <Button.Small
          aria-haspopup="dialog"
          aria-pressed={showLeafletMap}
          className="wb-leafletmap"
          title={wbText.unavailableWithoutLocality()}
          onClick={openLeafletMap}
          disabled={!hasLocality}
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
              const [_currentRow, currentCol] = getSelectedLast(hot!);
              hot?.scrollViewportTo(rowNumber, currentCol);
              // Select entire row
              hot?.selectRows(rowNumber);
            }}
          />
        )}
      </>
    );
  }