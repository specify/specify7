import type Leaflet from 'leaflet';
import React from 'react';

import type { Locality } from '../datamodel';
import { formatLocalityData } from '../leaflet';
import type { LocalityData } from '../leafletutils';
import type { SpecifyResource } from '../legacytypes';
import { fetchLocalityDataFromLocalityResource } from '../localityrecorddataextractor';
import commonText from '../localization/common';
import localityText from '../localization/locality';
import { Button } from './basic';
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

  return typeof localityData === 'undefined' ? null : localityData === false ? (
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
        (typeof fullLocalityData.current === 'undefined'
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
    <>
      <Button.Simple id={id} onClick={handleToggle} aria-pressed={isOpen}>
        {localityText('showMap')}
      </Button.Simple>
      {isOpen && <LeafletDialog locality={locality} onClose={handleClose} />}
    </>
  );
}
