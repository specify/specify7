import React from 'react';
import _ from 'underscore';

import { addFullScreenButton, showLeafletMap } from '../leaflet';
import type L from '../leafletextend';
import type { LocalityData } from '../leafletutils';
import commonText from '../localization/common';
import type { RA } from '../types';
import { LoadingContext } from './contexts';
import { useBooleanState } from './hooks';
import { Dialog, dialogClassNames } from './modaldialog';

const resizeThrottle = 250;

export function LeafletMap({
  localityPoints,
  markerClickCallback,
  onClose: handleClose,
}: {
  readonly localityPoints: RA<LocalityData>;
  readonly markerClickCallback?: (index: number, event: L.LeafletEvent) => void;
  readonly onClose?: () => void;
}): JSX.Element {
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  const [handleResize, setHandleResize] = React.useState<
    (() => void) | undefined
  >(undefined);
  const [isFullScreen, __, ___, handleToggleFullScreen] = useBooleanState();
  const loading = React.useContext(LoadingContext);
  React.useEffect(() => {
    if (containerRef.current === null) return undefined;
    let globalMap: L.Map | undefined;
    loading(
      showLeafletMap({
        localityPoints,
        markerClickCallback,
      }).then((map) => {
        globalMap = map;
        setHandleResize(_.throttle(() => map.invalidateSize(), resizeThrottle));
        addFullScreenButton(map, () => handleToggleFullScreen);
      })
    );
    return (): void => void globalMap?.remove();
  }, [loading, localityPoints, markerClickCallback]);

  return (
    <Dialog
      header={commonText('geoMap')}
      buttons={commonText('close')}
      className={{
        container: isFullScreen
          ? dialogClassNames.fullScreen
          : dialogClassNames.wideContainer,
      }}
      onResize={handleResize}
      onClose={handleClose}
    >
      <div ref={containerRef} />
    </Dialog>
  );
}
