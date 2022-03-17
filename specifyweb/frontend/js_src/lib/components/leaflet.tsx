import React from 'react';

import { showLeafletMap } from '../leaflet';
import type L from '../leafletextend';
import type { LocalityData } from '../leafletutils';
import type { RA } from '../types';
import { crash } from './errorboundary';

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

  React.useEffect(() => {
    if (containerRef.current === null) return;
    showLeafletMap({
      localityPoints,
      markerClickCallback,
      onClose: handleClose,
    }).catch(crash);
  }, []);

  return <div ref={containerRef} />;
}
