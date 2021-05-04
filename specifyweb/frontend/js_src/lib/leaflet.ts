/*
 * Utility functions for rendering a Leaflet map
 *
 */

'use strict';

import $ from 'jquery';
import type { IR, RA } from './components/wbplanview';
import { coMapTileServers, leafletTileServers } from './leafletconfig';
import L from './leafletextend';
import type { LocalityData } from './leafletutils';

const DEFAULT_ZOOM = 5;

export function showLeafletMap({
  localityPoints = [],
  markerClickCallback,
  leafletMapContainer,
}: {
  readonly localityPoints: RA<LocalityData>;
  readonly markerClickCallback?: () => void;
  readonly leafletMapContainer: string | JQuery<HTMLDivElement> | undefined;
}): L.Map | undefined {
  if (
    typeof leafletMapContainer === 'string' &&
    document.getElementById(leafletMapContainer) !== null
  )
    return;

  if (typeof leafletMapContainer !== 'object')
    leafletMapContainer = $(
      `<div ${
        typeof leafletMapContainer === 'undefined'
          ? ''
          : `id="${leafletMapContainer}"`
      }></div>`
    );

  leafletMapContainer.dialog({
    width: 900,
    height: 600,
    title: 'Leaflet map',
    close() {
      map.remove();
      $(this).remove();
    },
  });

  let defaultCenter: [number, number] = [0, 0];
  let defaultZoom = 1;
  if (localityPoints.length > 0) {
    defaultCenter = [localityPoints[0].latitude1, localityPoints[0].longitude1];
    defaultZoom = DEFAULT_ZOOM;
  }

  const map = L.map(leafletMapContainer[0], {
    layers: [Object.values(leafletTileServers.baseMaps)[0]],
  }).setView(defaultCenter, defaultZoom);
  const controlLayers = L.control.layers(
    leafletTileServers.baseMaps,
    leafletTileServers.overlays
  );
  controlLayers.addTo(map);

  let index = 0;
  addMarkersToMap(
    map,
    controlLayers,
    localityPoints.flatMap((pointDataDict) =>
      displayLocalityOnTheMap({
        localityData: pointDataDict,
        markerClickCallback: markerClickCallback?.bind(undefined, index++),
        map,
      })
    ),
    'Polygon boundaries',
    true
  );

  addFullScreenButton(map);

  return map;
}

function addFullScreenButton(map: L.Map): void {
  // @ts-expect-error
  L.control.fullScreen = (options: any) => new L.Control.FullScreen(options);
  // @ts-expect-error
  L.control.fullScreen({ position: 'topleft' }).addTo(map);
}

function addDetailsButton(
  container: HTMLDivElement,
  map: L.Map,
  details: string
): Element {
  // @ts-expect-error
  L.control.details = (options) => new L.Control.Details(options);
  // @ts-expect-error
  L.control.details({ position: 'topleft' }).addTo(map);
  const detailsContainer = container.getElementsByClassName(
    'details-container'
  )[0];
  detailsContainer.getElementsByTagName('span')[0].innerHTML = details;
  return detailsContainer;
}

export function addMarkersToMap(
  map: L.Map,
  controlLayers: any,
  markers: any,
  layerName: string,
  enable = false
): void {
  if (markers.length === 0) return;

  const layer = L.layerGroup(markers);
  controlLayers.addOverlay(layer, layerName);
  layer.addTo(map);

  if (enable) map.addLayer(layer);
}

function isValidAccuracy(
  latlongaccuracy: string | number | undefined
): boolean {
  try {
    if (
      typeof latlongaccuracy === 'undefined' ||
      (typeof latlongaccuracy === 'number' && latlongaccuracy < 1) ||
      (typeof latlongaccuracy === 'string' &&
        Number.parseFloat(latlongaccuracy) < 1)
    )
      return false;
  } catch {
    return false;
  }
  return true;
}

export function displayLocalityOnTheMap({
  localityData: {
    latitude1,
    longitude1,
    latitude2 = undefined,
    longitude2 = undefined,
    latlongtype = undefined,
    latlongaccuracy = undefined,
    localityname = undefined,
  },
  markerClickCallback,
  map,
  iconClass,
}: {
  readonly localityData: LocalityData;
  readonly markerClickCallback?: string | (() => void);
  readonly map?: L.Map;
  readonly iconClass?: string;
}) {
  if (typeof latitude1 === 'undefined' || typeof 'longitude1' === undefined)
    return [];

  const icon = new L.Icon.Default();
  if (typeof iconClass !== 'undefined') icon.options.className = iconClass;

  const createPoint = (latitude1: number, longitude1: number): L.Marker =>
    L.marker([latitude1, longitude1], {
      icon,
    });

  const vectors = [];

  if (typeof latitude2 === 'undefined' || typeof longitude2 === 'undefined') {
    // A circle
    if (isValidAccuracy(latlongaccuracy))
      vectors.push(
        L.circle([latitude1, longitude1], {
          radius: latlongaccuracy,
        }),
        createPoint(latitude1, longitude1)
      );
    // A point
    else vectors.push(createPoint(latitude1, longitude1));
  } else
    vectors.push(
      latlongtype?.toLowerCase() === 'line'
        ? // A line
          new L.Polyline(
            [
              [latitude1, longitude1],
              [latitude2, longitude2],
            ],
            {
              weight: 3,
              opacity: 0.5,
              smoothFactor: 1,
            }
          )
        : // A polygon
          L.polygon([
            [latitude1, longitude1],
            [latitude2, longitude1],
            [latitude2, longitude2],
            [latitude1, longitude2],
          ]),
      createPoint(latitude1, longitude1),
      createPoint(latitude2, longitude2)
    );

  const polygonBoundaries: typeof vectors = [];

  let isFirstVector = true;
  vectors.forEach((vector) => {
    if (isFirstVector && typeof map !== 'undefined') {
      vector.addTo(map);
      isFirstVector = false;
    } else polygonBoundaries.push(vector);

    const markerName =
      typeof markerClickCallback === 'string'
        ? markerClickCallback
        : typeof localityname === 'string' && localityname.length > 0
        ? localityname
        : undefined;

    if (typeof markerName !== 'undefined') vector.bindPopup(markerName);
    if (typeof markerClickCallback === 'function')
      vector.on('click', markerClickCallback);
  });

  return polygonBoundaries;
}

export type LayerConfig = {
  readonly transparent: boolean;
  readonly layerLabel: string;
  readonly tileLayer: {
    readonly mapUrl: string;
    readonly options: IR<unknown>;
  };
};

export function showCOMap(
  mapContainer: Readonly<HTMLDivElement>,
  listOfLayersRaw: RA<LayerConfig>,
  details: string | undefined = undefined
): [L.Map, L.Control.Layers, HTMLDivElement | undefined] {
  const listOfLayers: {
    transparent: boolean;
    layerLabel: string;
    tileLayer: L.TileLayer.WMS | L.TileLayer;
  }[] = [
    ...coMapTileServers.map(({ transparent, layerLabel }) => ({
      transparent,
      layerLabel,
      tileLayer:
        leafletTileServers[transparent ? 'overlays' : 'baseMaps'][layerLabel],
    })),
    ...listOfLayersRaw.map(
      ({ transparent, layerLabel, tileLayer: { mapUrl, options } }) => ({
        transparent,
        layerLabel,
        tileLayer: L.tileLayer.wms(mapUrl, options),
      })
    ),
  ];

  const formatLayersDict = (
    listOfLayers: {
      transparent: boolean;
      layerLabel: string;
      tileLayer: L.TileLayer.WMS | L.TileLayer;
    }[]
  ) =>
    Object.fromEntries(
      listOfLayers.map(({ layerLabel, tileLayer }) => [layerLabel, tileLayer])
    );

  const allLayers = Object.values(formatLayersDict(listOfLayers));
  const overlayLayers = formatLayersDict(
    listOfLayers.filter(({ transparent }) => transparent)
  );

  const map = L.map(mapContainer, {
    layers: allLayers,
  }).setView([0, 0], 1);

  const layerGroup = L.control.layers({}, overlayLayers);
  layerGroup.addTo(map);

  addFullScreenButton(map);

  if (typeof details !== 'undefined')
    return [
      map,
      layerGroup,
      addDetailsButton(mapContainer, map, details) as HTMLDivElement,
    ];

  return [map, layerGroup, undefined];
}
