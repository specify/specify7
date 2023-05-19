import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { useAsyncState } from '../../hooks/useAsyncState';
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
import { fetchLeafletLayers } from './layers';

const resizeThrottle = 250;

export function LeafletMap({
  localityPoints,
  onMarkerClick: handleMarkerClick,
  forwardRef,
  ...rest
}: {
  readonly localityPoints?: RA<LocalityData>;
  readonly onMarkerClick?: (index: number, event: L.LeafletEvent) => void;
  readonly forwardRef?: (map: LeafletInstance | undefined) => void;
} & (
  | {
      readonly dialog: false;
    }
  | {
      readonly header?: LocalizedString;
      readonly headerButtons?: JSX.Element;
      readonly description?: JSX.Element;
      readonly buttons?: JSX.Element | LocalizedString;
      readonly onClose: () => void;
      readonly dialog?: 'modal' | 'nonModal';
    }
)): JSX.Element {
  const [container, setContainer] = React.useState<HTMLDivElement | null>(null);

  const [handleResize, setHandleResize] = React.useState<
    (() => void) | undefined
  >(undefined);
  const [isFullScreen, __, ___, handleToggleFullScreen] = useBooleanState();
  const [tileLayers] = useAsyncState(fetchLeafletLayers, true);

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
    addFullScreenButton(map, () => {
      handleToggleFullScreen();
      map.invalidateSize();
    });
    forwardRef?.(map);
    return (): void => {
      void map.remove();
      forwardRef?.(undefined);
    };
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
      style={
        {
          '--transition-duration': 0,
          /**
           * Create a new stacking context, so that elements in the map don't
           * appear over non-map elements (i.e, Dialog). Not sure why they
           * don't do it by default
           */
          zIndex: 0,
        } as React.CSSProperties
      }
    />
  );
  return rest.dialog === false && !isFullScreen ? (
    children
  ) : (
    <Dialog
      buttons={
        ('buttons' in rest ? rest.buttons : undefined) ?? commonText.close()
      }
      className={{
        container: isFullScreen
          ? dialogClassNames.fullScreen
          : dialogClassNames.extraWideContainer,
      }}
      dimensionsKey="LeafletMap"
      header={
        ('header' in rest ? rest.header : undefined) ?? localityText.geoMap()
      }
      headerButtons={'headerButtons' in rest ? rest.headerButtons : undefined}
      modal={rest.dialog === 'modal'}
      onClose={'onClose' in rest ? rest.onClose : handleToggleFullScreen}
      onResize={handleResize}
    >
      {'description' in rest ? rest.description : undefined}
      {children}
    </Dialog>
  );
}
