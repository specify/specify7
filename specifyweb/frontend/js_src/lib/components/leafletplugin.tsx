import type Leaflet from 'leaflet';
import React from 'react';

import type { Locality } from '../datamodel';
import { formatLocalityData } from '../leaflet';
import type { LocalityData } from '../leafletutils';
import type { SpecifyResource } from '../legacytypes';
import { fetchLocalityDataFromLocalityResource } from '../localityrecorddataextractor';
import { commonText } from '../localization/common';
import { localityText } from '../localization/locality';
import { Button } from './basic';
import { ErrorBoundary } from './errorboundary';
import { useAsyncState, useBooleanState } from './hooks';
import { LeafletMap } from './leaflet';
import { Dialog } from './modaldialog';

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

  const fullLocalityData = React.useRef<undefined | false | LocalityData>(
    undefined
  );

  return localityData === undefined ? null : localityData === false ? (
    <Dialog
      header={localityText('noCoordinates')}
      onClose={handleClose}
      buttons={commonText('close')}
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
        id={id}
        onClick={handleToggle}
        aria-pressed={isOpen}
        className="w-fit"
      >
        {localityText('showMap')}
      </Button.Small>
      {isOpen && <LeafletDialog locality={locality} onClose={handleClose} />}
    </ErrorBoundary>
  );
}
