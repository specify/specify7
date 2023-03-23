import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { usePromise } from '../../hooks/useAsyncState';
import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { localityText } from '../../localization/locality';
import type { RA } from '../../utils/types';
import { throttle } from '../../utils/utils';
import { Dialog, dialogClassNames } from '../Molecules/Dialog';
import type { LeafletInstance } from './addOns';
import { addFullScreenButton } from './addOns';
import type L from './extend';
import type { LocalityData } from './helpers';
import { showLeafletMap } from './index';
import { leafletLayersPromise } from './layers';

const resizeThrottle = 250;

export function LeafletMap({
  localityPoints,
  onMarkerClick: handleMarkerClick,
  forwardRef,
  header = localityText.geoMap(),
  headerButtons,
  buttons = commonText.close(),
  onClose: handleClose,
  dialog = 'modal',
}: {
  readonly localityPoints?: RA<LocalityData>;
  readonly onMarkerClick?: (index: number, event: L.LeafletEvent) => void;
  readonly forwardRef?: React.RefCallback<LeafletInstance>;
  readonly header?: LocalizedString;
  readonly headerButtons?: JSX.Element;
  readonly buttons?: JSX.Element | LocalizedString;
  readonly onClose: () => void;
  readonly dialog?: 'modal' | 'nonModal' | false;
}): JSX.Element {
  const [container, setContainer] = React.useState<HTMLDivElement | null>(null);

  const [handleResize, setHandleResize] = React.useState<
    (() => void) | undefined
  >(undefined);
  const [isFullScreen, __, ___, handleToggleFullScreen] = useBooleanState();
  const [tileLayers] = usePromise(leafletLayersPromise, true);

  const handleClickRef =
    React.useRef<typeof handleMarkerClick>(handleMarkerClick);
  React.useEffect(() => {
    handleClickRef.current = handleMarkerClick;
  }, [handleMarkerClick]);

  React.useEffect(() => {
    if (container === null || tileLayers === undefined) return undefined;
    const map = showLeafletMap({
      tileLayers,
      container,
      localityPoints: localityPoints ?? [],
      onMarkerClick: (...args) => handleClickRef.current?.(...args),
    });
    setHandleResize(() => throttle(() => map.invalidateSize(), resizeThrottle));
    addFullScreenButton(map, handleToggleFullScreen);
    forwardRef?.(map);
    return (): void => void map.remove();
  }, [
    tileLayers,
    container,
    localityPoints,
    forwardRef,
    handleToggleFullScreen,
  ]);

  const children = (
    <div
      ref={setContainer}
      style={{ '--transition-duration': 0 } as React.CSSProperties}
    />
  );
  return dialog === false ? (
    children
  ) : (
    <Dialog
      buttons={buttons}
      className={{
        container: isFullScreen
          ? dialogClassNames.fullScreen
          : dialogClassNames.extraWideContainer,
      }}
      dimensionsKey="LeafletMap"
      header={header}
      headerButtons={headerButtons}
      modal={dialog === 'modal'}
      onClose={handleClose}
      onResize={handleResize}
    >
      {children}
    </Dialog>
  );
}
