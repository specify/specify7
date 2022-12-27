import type Handsontable from 'handsontable';
import React from 'react';

import { commonText } from '../../localization/common';
import { f } from '../../utils/functools';
import type { IR, RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { sortFunction } from '../../utils/utils';
import { Button } from '../Atoms/Button';
import {
  getLocalityCoordinate,
  getSelectedLocalityColumns,
} from '../Leaflet/wbLocalityDataExtractor';
import type { GeoLocatePayload } from '../Molecules/GeoLocate';
import { GenericGeoLocate } from '../Molecules/GeoLocate';
import { getSelectedRegions, getVisualHeaders, setHotData } from './hotHelpers';

export function WbGeoLocate({
  hot,
  columns,
  localityColumns,
  onClose: handleClose,
}: {
  readonly hot: Handsontable;
  readonly columns: RA<string>;
  readonly localityColumns: RA<IR<string>>;
  readonly onClose: () => void;
}): JSX.Element | null {
  const [data, setData] = React.useState<IR<string> | undefined>(undefined);
  const [localityIndex, setLocalityIndex] = React.useState<number>(0);

  const selection = React.useMemo(
    () => getSelectedLocalities(hot, columns, localityColumns, true),
    [hot, columns, localityColumns]
  );

  function handleMove(newLocalityIndex: number): void {
    if (selection === undefined) return;
    const { localityColumns, visualRow } =
      selection.parseLocalityIndex(newLocalityIndex);
    setData(getGeoLocateData(hot, columns, { localityColumns, visualRow }));
    hot.selectRows(visualRow);
    setLocalityIndex(newLocalityIndex);
  }

  const visualHeaders = React.useMemo(
    () => getVisualHeaders(hot, columns),
    [hot, columns]
  );

  React.useEffect(() => {
    handleMove(0);
  }, [hot, columns, localityColumns]);

  const handleResult = React.useCallback(
    ({ latitude, longitude, uncertainty }: GeoLocatePayload) => {
      if (selection === undefined) return;
      const { visualRow, localityColumns } =
        selection.parseLocalityIndex(localityIndex);

      const changes = [
        ['locality.latitude1', latitude],
        ['locality.longitude1', longitude],
        ['locality.latlongaccuracy', uncertainty],
      ]
        .map(
          ([fieldName, data]) =>
            [
              visualRow,
              visualHeaders.indexOf(localityColumns[fieldName]),
              data,
            ] as const
        )
        .filter(([, visualCol]) => visualCol !== -1);

      setHotData(hot, changes);

      if (selection.length === 1) handleClose();
    },
    [hot, visualHeaders, handleClose, localityIndex]
  );

  return data === undefined ? null : (
    <GenericGeoLocate
      buttons={
        <>
          <Button.DialogClose>{commonText('close')}</Button.DialogClose>
          <Button.Blue
            disabled={selection?.isFirst(localityIndex) ?? true}
            onClick={(): void => handleMove(localityIndex - 1)}
          >
            {commonText('previous')}
          </Button.Blue>
          <Button.Blue
            disabled={selection?.isLast(localityIndex) ?? true}
            onClick={(): void => handleMove(localityIndex + 1)}
          >
            {commonText('next')}
          </Button.Blue>
        </>
      }
      data={data}
      onClose={handleClose}
      onUpdate={handleResult}
    />
  );
}

// Generate Locality iterator. Able to handle multiple localities in a row
export function getSelectedLocalities(
  hot: Handsontable,
  columns: RA<string>,
  localityColumns: RA<IR<string>>,
  // If false, treat single cell selection as entire spreadsheet selection
  allowSingleCell: boolean
):
  | {
      readonly length: number;
      readonly isFirst: (index: number) => boolean;
      readonly isLast: (index: number) => boolean;
      readonly visualRows: RA<number>;
      readonly selectedHeaders: RA<string>;
      readonly parseLocalityIndex: (index: number) => {
        readonly localityColumns: IR<string>;
        readonly visualRow: number;
      };
    }
  | undefined {
  const selectedRegions = getSelectedRegions(hot);

  const selectedVirtualColumns = f.unique(
    selectedRegions.flatMap(({ startCol, endCol }) =>
      Array.from(
        { length: endCol - startCol + 1 },
        (_, index) => startCol + index
      )
    )
  );

  const selectedHeaders = Array.from(selectedVirtualColumns)
    .sort(sortFunction(f.id))
    .map((visualCol) => columns[hot.toPhysicalColumn(visualCol)]);

  const selectedRows = Array.from(
    f.unique(
      selectedRegions.flatMap(({ startRow, endRow }) =>
        Array.from(
          { length: endRow - startRow + 1 },
          (_, index) => startRow + index
        )
      )
    )
  ).sort(sortFunction(f.id));

  const selectAll =
    !allowSingleCell &&
    selectedHeaders.length === 1 &&
    selectedRows.length === 1;

  const localityColumnGroups = selectAll
    ? localityColumns
    : getSelectedLocalityColumns(localityColumns, selectedHeaders);
  if (localityColumnGroups.length === 0) return undefined;

  const visualRows = selectAll
    ? Array.from({ length: hot.countRows() }, (_, index) => index)
    : selectedRows;
  const length = visualRows.length * localityColumnGroups.length;

  // FIXME: check if all of these are actually used
  return {
    length,
    isFirst: (index) => index === 0,
    isLast: (index) => index + 1 >= length,
    visualRows,
    selectedHeaders,
    parseLocalityIndex: (localityIndex) => ({
      localityColumns:
        localityColumnGroups[localityIndex % localityColumnGroups.length],
      visualRow:
        visualRows[Math.floor(localityIndex / localityColumnGroups.length)],
    }),
  };
}

function getGeoLocateData(
  hot: Handsontable,
  columns: RA<string>,
  {
    localityColumns,
    visualRow,
  }: {
    readonly localityColumns: IR<string>;
    readonly visualRow: number;
  }
): IR<string> {
  const visualHeaders = getVisualHeaders(hot, columns);

  const localityData =
    getLocalityCoordinate(
      hot.getDataAtRow(visualRow),
      visualHeaders,
      localityColumns
    ) || {};

  const rawData = {
    country: localityData['locality.geography.$country.name']?.value,
    state: localityData['locality.geography.$state.name']?.value,
    county: localityData['locality.geography.$county.name']?.value,
    locality: localityData['locality.localityname']?.value,
    points:
      typeof localityData['locality.latitude1'] === 'object' &&
      typeof localityData['locality.longitude1'] === 'object'
        ? `${localityData['locality.latitude1'].value}|${localityData['locality.longitude1'].value}`
        : undefined,
  };

  return Object.fromEntries(
    filterArray(
      Object.entries(rawData).map(([key, value]) =>
        value === undefined ? undefined : [key, value.toString()]
      )
    )
  );
}
