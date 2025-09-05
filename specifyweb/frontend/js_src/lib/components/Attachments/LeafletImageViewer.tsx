import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { commonText } from '../../localization/common';
import { icons } from '../Atoms/Icons';
import L from '../Leaflet/extend';

export function LeafletImageViewer({
  src,
  alt,
}: {
  readonly src: string;
  readonly alt: string;
}): JSX.Element {
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  const defaultBounds = L.latLngBounds([0, 0], [512, 512]);
  const boundsRef = React.useRef<L.LatLngBounds>(defaultBounds);

  React.useEffect(() => {
    if (!containerRef.current) return;

    const map = L.map(containerRef.current, {
      crs: L.CRS.Simple,
      minZoom: -10,
      zoomSnap: 0,
    });
    boundsRef.current = defaultBounds;

    const img = new window.Image();
    img.src = src;
    const onImageLoad = () => {
      // Update viewer bounds once the image is done loading.
      boundsRef.current = L.latLngBounds([0, 0], [img.height, img.width]);

      L.imageOverlay(src, boundsRef.current, { alt }).addTo(map);
      map.fitBounds(boundsRef.current);
    };
    img.addEventListener('load', onImageLoad);

    // Inject reset zoom button
    map.addControl(resetZoomButton(map, boundsRef));

    const resizeObserver = new window.ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      map.remove();
      img.removeEventListener('load', onImageLoad);
      resizeObserver.disconnect();
    };
  }, [src]);

  return (
    <div
      className="h-full w-full"
      ref={containerRef}
      style={
        {
          '--transition-duration': 0,
          zIndex: 0,
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
    onAdd() {
      const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
      const button = L.DomUtil.create('a', '', container) as HTMLAnchorElement;
      button.innerHTML = renderToStaticMarkup(icons.arrowPath);
      button.title = commonText.reset();
      button.href = '#';
      button.setAttribute('role', 'button');
      button.style.display = 'flex';
      button.style.alignItems = 'center';
      button.style.justifyContent = 'center';
      button.style.width = '30px';
      button.style.height = '30px';

      L.DomEvent.disableClickPropagation(container);
      L.DomEvent.disableScrollPropagation(container);
      L.DomEvent.on(button, 'click', (e) => {
        L.DomEvent.stop(e);
        map.fitBounds(boundsRef.current);
      });

      return container;
    },
  });

  return new ResetZoomControl();
}
