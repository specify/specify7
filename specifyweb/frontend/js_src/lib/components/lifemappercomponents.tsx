import type L from 'leaflet';
import React from 'react';

import * as Leaflet from '../leaflet';
import type { MapInfo } from '../lifemapperreducer';
import { formatIconRequest } from '../lifemapperutills';
import lifemapperText from '../localization/lifemapper';

export function Badge<IS_ENABLED extends boolean>({
  name,
  title,
  onClick: handleClick,
  isEnabled,
}: {
  readonly name: string;
  readonly title: string;
  readonly onClick: IS_ENABLED extends true ? () => void : undefined;
  readonly isEnabled: IS_ENABLED;
}): JSX.Element {
  return (
    <button
      type="button"
      disabled={!isEnabled}
      onClick={isEnabled ? handleClick : undefined}
      className={`lifemapper-source-icon ${
        isEnabled ? '' : 'lifemapper-source-icon-not-found'
      }`}
      title={title}
      aria-label={title}
    >
      <img
        className="lifemapper-source-icon-active"
        src={formatIconRequest(name, 'active')}
        alt=""
      />
      <img
        className="lifemapper-source-icon-inactive"
        src={formatIconRequest(name, 'inactive')}
        alt=""
      />
      <img
        className="lifemapper-source-icon-hover"
        src={formatIconRequest(name, 'hover')}
        alt=""
      />
    </button>
  );
}

export function LifemapperMap({
  mapInfo,
}: {
  readonly mapInfo: MapInfo;
}): JSX.Element | null {
  const mapRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!mapRef.current) return undefined;

    let destructorCalled = false;
    const destructors: (() => void)[] = [];
    function destructor(map: L.Map): void {
      map.off();
      map.remove();
      destructors.forEach((destructor) => destructor());
    }
    let leafletMap: L.Map | undefined;
    Leaflet.showCOMap(mapRef.current, mapInfo.layers, [
      lifemapperText('leafletDetailsHeader'),
      `<div class="lifemapper-legend">
        <h2>${mapInfo.messages.infoSection.speciesName}</h2>
        <h2>${lifemapperText('gbif')}</h2>
        <span
          class="lifemapper-map-legend"
          role="img"
          style="background-image: url('/static/img/lifemapper_occurrence.png')"
        ></span>
        <h2>${lifemapperText('leafletDetailsErrorsHeader')}</h2>
        ${
          Object.keys(mapInfo.messages.errorDetails).length === 0
            ? `
              ${
                mapInfo.messages.infoSection.dateCreated
                  ? `<span>
                ${lifemapperText('modelCreationData')}
                <i>${mapInfo.messages.infoSection.dateCreated}</i>
              </span>`
                  : ''
              }
              <span
                class="lifemapper-map-legend"
                role="img"
                style="
                  background-image: url('/static/img/lifemapper_projection.png')
                "
              >
                <span>0%</span>
                <span>100%</span>
              </span>
              `
            : Object.values(mapInfo.messages.errorDetails)
                .map((message) => `<i>${message}</i>`)
                .join('')
        }
      </div>`,
    ])
      .then(([map, layerGroup]) => {
        if (destructorCalled) {
          destructor(map);
          return;
        }
        leafletMap = map;

        Leaflet.addMarkersToMap(map, layerGroup, mapInfo.markers.flat(), {
          marker: lifemapperText('markerLayerLabel'),
          polygon: lifemapperText('polygonLayerLabel'),
          polygonBoundary: lifemapperText('polygonBoundaryLayerLabel'),
          // Don't display error radii layer
        });

        return map;
      })
      .catch((error) => {
        throw error;
      });

    return (): void => {
      if (typeof leafletMap === 'undefined') {
        destructorCalled = true;
      } else destructor(leafletMap);
    };
  }, [mapRef, mapInfo]);

  return <div className="lifemapper-leaflet-map" ref={mapRef} />;
}
