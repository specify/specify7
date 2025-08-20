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
      const defaultBounds = [[0, 0], [512, 512]];
      map.fitBounds(defaultBounds as never);

      const img = new window.Image();
      img.src = src;
      img.onload = () => {
        // Update viewer bounds once the image is done loading.
        const bounds = [[0, 0], [img.height, img.width]];
        
        L.imageOverlay(src, bounds as never, { alt }).addTo(map);
        map.fitBounds(bounds as never);
      };
  
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
  