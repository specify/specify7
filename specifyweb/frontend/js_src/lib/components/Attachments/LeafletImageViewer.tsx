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
  
    React.useEffect(() => {
      if (!containerRef.current) return;

      const map = L.map(containerRef.current, {
          crs: L.CRS.Simple
      });

      const img = new window.Image();
      img.src = src;
      img.onload = () => {
        const bounds = [[0, 0], [img.height, img.width]];
        
        L.imageOverlay(src, bounds as never, { alt }).addTo(map);
        map.fitBounds(bounds as never);
      };

      (function() {
        var control = new L.Control({position:'topright'});
        control.onAdd = function(map) {
            var azoom = L.DomUtil.create('a','resetzoom');
            azoom.innerHTML = "[Reset Zoom]";
            L.DomEvent
              .disableClickPropagation(azoom)
              .addListener(azoom, 'click', function() {
                map.setView(map.options.center as never, map.options.zoom);
              },azoom);
            return azoom;
          };
        return control;
      }())
      .addTo(map);
  
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
            height: '100%',
            width: '100%',
            position: 'relative',
          } as React.CSSProperties
        }
      />
    );
  }
  