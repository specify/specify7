import React from 'react';
import L from '../Leaflet/extend';
import { commonText } from '../../localization/common';

export function LeafletImageViewer({
  src,
  alt,
}: {
  readonly src: string;
  readonly alt: string;
}): JSX.Element {
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  const defaultBounds = L.latLngBounds([0,0], [512, 512]);
  const boundsRef = React.useRef<L.LatLngBounds>(defaultBounds);

  React.useEffect(() => {
    if (!containerRef.current) return;

    const map = L.map(containerRef.current, {
        crs: L.CRS.Simple,
        minZoom: -10,
    });
    boundsRef.current = defaultBounds;

    const img = new window.Image();
    img.src = src;
    img.onload = () => {
      // Update viewer bounds once the image is done loading.
      boundsRef.current = L.latLngBounds([0, 0], [img.height, img.width]);
      
      L.imageOverlay(src, boundsRef.current, { alt }).addTo(map);
      map.fitBounds(boundsRef.current);
    };

    // Inject reset zoom button
    map.addControl(resetZoomButton(map, boundsRef));

    const resizeObserver = new window.ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      map.remove();
    }
  }, [src]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full"
      style={
        {
          '--transition-duration': 0,
          zIndex: 0,
          minWidth: '512px',
          minHeight: '512px',
          height: '100%',
          width: '100%',
          position: 'relative',
        } as React.CSSProperties
      }
    />
  );
}

function resetZoomButton(
  map: L.Map,
  boundsRef: React.MutableRefObject<L.LatLngBounds>
): L.Control {
  const ResetZoomControl = L.Control.extend({
    options: { position: 'topleft' },
    onAdd: function () {
      const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
      const button = L.DomUtil.create('a', '', container) as HTMLAnchorElement;
      button.innerHTML = '⟳';
      button.title = commonText.reset();
      button.href = "#";
      button.setAttribute('role', 'button');
      button.style.textAlign = 'center';
      button.style.fontSize = '18px';
      button.style.lineHeight = '30px';
      button.style.width = '30px';
      button.style.height = '30px';

      L.DomEvent.disableClickPropagation(container);
      L.DomEvent.disableScrollPropagation(container);
      L.DomEvent.on(button, 'click', function (e) {
        L.DomEvent.stop(e);
        map.fitBounds(boundsRef.current);
      });

      return container;
    },
  });

  return new ResetZoomControl();
}