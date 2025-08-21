import React from 'react';
import L from '../Leaflet/extend';

export function LeafletImageViewer({
  src,
  alt,
}: {
  readonly src: string;
  readonly alt: string;
}): JSX.Element {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<L.Map | null>(null);
  const centerRef = React.useRef<L.LatLng | null>(null);

  React.useEffect(() => {
    if (!containerRef.current) return;

    const map = L.map(containerRef.current, {
        crs: L.CRS.Simple,
        minZoom: -2,
        maxBoundsViscosity: 0.1,
    });
    mapRef.current = map;

    const defaultBounds = [[0, 0], [512, 512]];
    map.fitBounds(defaultBounds as never);

    const ResetZoomControl = L.Control.extend({
      options: { position: 'topleft' },
      onAdd: function () {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        const button = L.DomUtil.create('a', '', container);
        button.innerHTML = '⟳';
        button.title = 'Reset Zoom';
        // eslint-disable-next-line
        button.href="#";
        button.role = 'button';
        button.style.textAlign = 'center';
        button.style.fontSize = '18px';
        button.style.lineHeight = '30px';
        button.style.width = '30px';
        button.style.height = '30px';

        L.DomEvent.on(button, 'click', function (e) {
          L.DomEvent.stop(e);
          if (mapRef.current) {
            if (mapRef.current && centerRef.current) {
              mapRef.current.setView(centerRef.current, -2);
            }
          }
        });

        return container;
      },
    });
    map.addControl(new ResetZoomControl());

    const img = new window.Image();
    img.src = src;
    img.onload = () => {
      // Update viewer bounds once the image is done loading.
      const bounds = [[0, 0], [img.height, img.width]];
      
      L.imageOverlay(src, bounds as never, { alt }).addTo(map);
      map.fitBounds(bounds as never);
      map.setMinZoom(-2);
      // map.setMaxBounds(bounds as never);
      const center = L.latLng(img.height / 2, img.width / 2);
      centerRef.current = center;
    };

    return () => {
      map.remove();
      mapRef.current = null;
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
  