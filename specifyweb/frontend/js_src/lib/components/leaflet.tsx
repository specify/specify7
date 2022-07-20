import React from 'react';
import _ from 'underscore';

import { addFullScreenButton, showLeafletMap } from '../leaflet';
import type L from '../leafletextend';
import type { LocalityData } from '../leafletutils';
import { commonText } from '../localization/common';
import type { RA } from '../types';
import { LoadingContext } from './contexts';
import { useBooleanState } from './hooks';
import { Dialog, dialogClassNames } from './modaldialog';

const resizeThrottle = 250;

export function LeafletMap({
  localityPoints,
  markerClickCallback,
  forwardRef,
  header = commonText('geoMap'),
  buttons = commonText('close'),
  onClose: handleClose,
  modal = true,
}: {
  readonly localityPoints: RA<LocalityData>;
  readonly markerClickCallback?: (index: number, event: L.LeafletEvent) => void;
  readonly forwardRef?: React.RefCallback<L.Map>;
  readonly header?: string;
  readonly buttons?: JSX.Element | string;
  readonly onClose?: () => void;
  readonly modal?: boolean;
}): JSX.Element {
  const [container, setContainer] = React.useState<HTMLDivElement | null>(null);

  const [handleResize, setHandleResize] = React.useState<
    (() => void) | undefined
  >(undefined);
  const [isFullScreen, __, ___, handleToggleFullScreen] = useBooleanState();
  const loading = React.useContext(LoadingContext);
  React.useEffect(() => {
    if (container === null) return undefined;
    let globalMap: L.Map | undefined;
    loading(
      showLeafletMap({
        container,
        localityPoints,
        markerClickCallback,
      }).then((map) => {
        globalMap = map;
        setHandleResize(() =>
          _.throttle(() => map.invalidateSize(), resizeThrottle)
        );
        addFullScreenButton(map, handleToggleFullScreen);
        forwardRef?.(map);
      })
    );
    return (): void => void globalMap?.remove();
  }, [container, loading, localityPoints, markerClickCallback, forwardRef]);

  return (
    <Dialog
      buttons={buttons}
      className={{
        container: isFullScreen
          ? dialogClassNames.fullScreen
          : dialogClassNames.extraWideContainer,
      }}
      header={header}
      modal={modal}
      onClose={handleClose}
      onResize={handleResize}
    >
      <div
        ref={setContainer}
        style={{ '--transition-duration': 0 } as React.CSSProperties}
      />
    </Dialog>
  );
}
