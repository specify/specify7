import type Leaflet from 'leaflet';
import React from 'react';

import type { Locality } from '../DataModel/types';
import { formatLocalityData } from '../Leaflet/leaflet';
import type { LocalityData } from '../Leaflet/leafletHelpers';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { fetchLocalityDataFromLocalityResource } from '../Leaflet/localityRecordDataExtractor';
import { commonText } from '../../localization/common';
import { localityText } from '../../localization/locality';
import { Button } from '../Atoms/Button';
import { ErrorBoundary } from '../Errors/ErrorBoundary';
import { LeafletMap } from '../Molecules/Leaflet';
import { Dialog } from '../Molecules/Dialog';
import { useAsyncState } from '../../hooks/useAsyncState';
import { useBooleanState } from '../../hooks/useBooleanState';

function LeafletDialog({
  locality,
  onClose: handleClose,
}: {
  readonly locality: SpecifyResource<Locality>;
  readonly onClose: () => void;
}): JSX.Element | null {
  const [localityData] = useAsyncState(
    React.useCallback(
      async () => fetchLocalityDataFromLocalityResource(locality, true),
      [locality]
    ),
    true
  );

  const fullLocalityData = React.useRef<LocalityData | false | undefined>(
    undefined
  );

  return localityData === undefined ? null : localityData === false ? (
    <Dialog
      buttons={commonText('close')}
      header={localityText('noCoordinates')}
      onClose={handleClose}
    >
      {localityText('notEnoughInformationToMap')}
    </Dialog>
  ) : (
    <LeafletMap
      localityPoints={[localityData]}
      markerClickCallback={async (_, { target: marker }): Promise<void> =>
        (fullLocalityData.current === undefined
          ? fetchLocalityDataFromLocalityResource(locality)
          : Promise.resolve(fullLocalityData.current)
        ).then((localityData) => {
          fullLocalityData.current = localityData;
          if (localityData !== false)
            (marker as Leaflet.Marker)
              .getPopup()
              ?.setContent(formatLocalityData(localityData, undefined, true));
        })
      }
      onClose={handleClose}
    />
  );
}

export function LeafletPlugin({
  locality,
  id,
}: {
  readonly locality: SpecifyResource<Locality>;
  readonly id: string | undefined;
}): JSX.Element {
  const [isOpen, _, handleClose, handleToggle] = useBooleanState();

  return (
    <ErrorBoundary dismissable>
      <Button.Small
        aria-pressed={isOpen}
        className="w-fit"
        id={id}
        onClick={handleToggle}
      >
        {localityText('showMap')}
      </Button.Small>
      {isOpen && <LeafletDialog locality={locality} onClose={handleClose} />}
    </ErrorBoundary>
  );
}
