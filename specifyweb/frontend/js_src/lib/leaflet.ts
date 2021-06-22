/*
 * Utility functions for rendering a Leaflet map
 *
 */

import $ from 'jquery';
import type { LayersControlEventHandlerFn } from 'leaflet';

import * as cache from './cache';
import type { IR, RA, RR } from './components/wbplanview';
import {
  coMapTileServers,
  leafletLayersEndpoint,
  leafletTileServers,
} from './leafletconfig';
import L from './leafletextend';
import type { Field, LocalityData } from './leafletutils';
import { capitalize } from './wbplanviewhelper';

const DEFAULT_ZOOM = 5;

// Try to fetch up-to-date tile servers. If fails, use the default tile servers
let leafletMaps: typeof leafletTileServers | undefined;

const parseLayersFromJson = (json: Record<string, any>) =>
  Object.fromEntries(
    Object.entries(json).map(([layerGroup, layers]) => [
      layerGroup,
      Object.fromEntries(
        Object.entries(
          layers as Record<
            string,
            {
              readonly endpoint: string;
              readonly serverType: 'tileServer' | 'wms';
              readonly layerOptions: Record<string, unknown>;
            }
          >
        ).map(([layerName, { endpoint, serverType, layerOptions }]) => [
          layerName,
          (serverType === 'wms' ? L.tileLayer.wms : L.tileLayer)(
            endpoint,
            layerOptions
          ),
        ])
      ),
    ])
  ) as typeof leafletTileServers;

export const getLeafletLayers = async (): Promise<typeof leafletTileServers> =>
  typeof leafletMaps === 'undefined'
    ? new Promise(async (resolve) =>
        fetch('/context/app.resource?name=leaflet-layers')
          .then(async (response) => response.json())
          .then((data) => resolve((leafletMaps = parseLayersFromJson(data))))
          .catch(async () =>
            fetch(leafletLayersEndpoint)
              .then(async (response) => response.json())
              .then((data) =>
                resolve((leafletMaps = parseLayersFromJson(data)))
              )
              .catch((error) => {
                console.error(error);
                resolve(leafletTileServers);
              })
          )
      )
    : Promise.resolve(leafletMaps);

export async function showLeafletMap({
  localityPoints = [],
  markerClickCallback,
  leafletMapContainer,
}: {
  readonly localityPoints: RA<LocalityData>;
  readonly markerClickCallback?: (index: number, event: L.LeafletEvent) => void;
  readonly leafletMapContainer: string | JQuery<HTMLDivElement> | undefined;
}): Promise<L.Map | undefined> {
  const tileLayers = await getLeafletLayers();

  if (
    typeof leafletMapContainer === 'string' &&
    document.getElementById(leafletMapContainer) !== null
  )
    return undefined;

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
    title: 'GeoMap',
    close() {
      map.remove();
      $(this).remove();
    },
  });

  leafletMapContainer[0].style.overflow = 'hidden';

  let defaultCenter: [number, number] = [0, 0];
  let defaultZoom = 1;
  if (localityPoints.length > 0) {
    defaultCenter = [
      localityPoints[0]['locality.latitude1'].value,
      localityPoints[0]['locality.longitude1'].value,
    ];
    defaultZoom = DEFAULT_ZOOM;
  }

  const map = L.map(leafletMapContainer[0], {
    layers: [Object.values(tileLayers.baseMaps)[0]],
  }).setView(defaultCenter, defaultZoom);
  const controlLayers = L.control.layers(
    tileLayers.baseMaps,
    tileLayers.overlays
  );
  controlLayers.addTo(map);

  let index = 0;
  addMarkersToMap(
    map,
    controlLayers,
    localityPoints.map((pointDataDict) =>
      getMarkersFromLocalityData({
        localityData: pointDataDict,
        markerClickCallback: markerClickCallback?.bind(undefined, index++),
      })
    )
  );

  addFullScreenButton(map);
  addPrintMapButton(map);
  rememberSelectedLayers(map, tileLayers.baseMaps, '');

  return map;
}

export type LeafletCacheSalt = string & '';

function rememberSelectedLayers(
  map: L.Map,
  layers: IR<L.TileLayer>,
  cacheSalt: LeafletCacheSalt
): void {
  const cacheName = `currentLayer${cacheSalt}` as const;
  const currentLayer = cache.get('leaflet', cacheName);
  if (currentLayer !== false && currentLayer in layers)
    layers[currentLayer].addTo(map);

  map.on('baselayerchange', ({ name }: { readonly name: string }) =>
    cache.set('leaflet', cacheName, name, { overwrite: true })
  );
}

function addFullScreenButton(map: L.Map): void {
  // @ts-expect-error
  new L.Control.FullScreen({ position: 'topleft' }).addTo(map);
}

function addPrintMapButton(map: L.Map): void {
  // @ts-expect-error
  new L.Control.PrintMap({ position: 'topleft' }).addTo(map);
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
    'leaflet-details-container'
  )[0];
  detailsContainer.getElementsByTagName('span')[0].innerHTML = details;
  return detailsContainer;
}

const markerLayerName = [
  'marker',
  'polygon',
  'polygonBoundary',
  'errorRadius',
] as const;

export type MarkerLayerName = typeof markerLayerName[number];

const defaultMarkerGroupsState: RR<MarkerLayerName, boolean> = {
  marker: true,
  polygon: true,
  polygonBoundary: false,
  errorRadius: false,
};

export function addMarkersToMap(
  map: L.Map,
  controlLayers: L.Control.Layers,
  markers: RA<MarkerGroups>,
  layerName = ''
): void {
  if (markers.length === 0) return;

  // Initialize layer groups
  const cluster = L.markerClusterGroup();
  cluster.addTo(map);

  const layerGroups = Object.fromEntries(
    markerLayerName.map(
      (groupName) =>
        [groupName, L.featureGroup.subGroup(cluster)] as [
          MarkerLayerName,
          L.FeatureGroup
        ]
    )
  ) as RR<MarkerLayerName, L.FeatureGroup>;

  // Sort markers by layer groups
  markers.forEach((markers) =>
    Object.entries(markers).forEach(([markerGroupName, markers]) =>
      (markers as Marker[]).forEach((marker) =>
        layerGroups[markerGroupName as MarkerLayerName].addLayer(marker)
      )
    )
  );

  // Enable some layer groups
  Object.entries(layerGroups).forEach(([markerGroupName, layer]) => {
    if (
      markerGroupName === 'marker' ||
      cache.get(
        'leaflet',
        `show${
          capitalize(markerGroupName) as Capitalize<MarkerLayerName>
        }` as const,
        {
          defaultValue:
            defaultMarkerGroupsState[markerGroupName as MarkerLayerName],
        }
      )
    )
      layer.addTo(map);
  });

  // Remember user's preference for layer's visibility
  const handleOverlayEvent: LayersControlEventHandlerFn = ({ layer, type }) => {
    const layerName = Object.entries(layerGroups).find(
      ([_, layerObject]) => layerObject === layer
    )?.[0];
    if (typeof layerName !== 'undefined')
      cache.set(
        'leaflet',
        `show${capitalize(layerName) as Capitalize<MarkerLayerName>}` as const,
        type === 'overlayadd',
        {
          overwrite: true,
        }
      );
  };
  map.on('overlayadd', handleOverlayEvent);
  map.on('overlayremove', handleOverlayEvent);

  // Add layer groups' checkboxes to the layer control menu
  controlLayers.addOverlay(layerGroups.polygon, `${layerName} Polygons`);
  controlLayers.addOverlay(
    layerGroups.polygonBoundary,
    `${layerName} Polygon Boundaries`
  );
  controlLayers.addOverlay(
    layerGroups.errorRadius,
    `${layerName} Error Radius`
  );
}

export function isValidAccuracy(latlongaccuracy: string | undefined): boolean {
  try {
    if (
      typeof latlongaccuracy === 'undefined' ||
      Number.isNaN(Number.parseFloat(latlongaccuracy)) ||
      Number.parseFloat(latlongaccuracy) < 1
    )
      return false;
  } catch {
    return false;
  }
  return true;
}

export type MarkerGroups = {
  readonly marker: L.Marker[];
  readonly polygon: (L.Polygon | L.Polyline)[];
  readonly polygonBoundary: L.Marker[];
  readonly errorRadius: L.Circle[];
};
type Marker = L.Marker | L.Polygon | L.Polyline | L.Circle;

const createLine = (
  coordinate1: [number, number],
  coordinate2: [number, number]
): L.Polyline =>
  new L.Polyline([coordinate1, coordinate2], {
    weight: 3,
    opacity: 0.5,
    smoothFactor: 1,
  });

export const formatLocalityData = (
  localityData: Partial<LocalityData>
): string =>
  Object.values(localityData)
    .filter(
      (field): field is Field<string | number> => typeof field !== 'undefined'
    )
    .filter((field) => field.value !== '')
    .map((field) => `<b>${field.headerName}</b>: ${field.value}`)
    .join('<br>');

export function getMarkersFromLocalityData({
  localityData: {
    'locality.latitude1': latitude1,
    'locality.longitude1': longitude1,
    'locality.latitude2': latitude2 = undefined,
    'locality.longitude2': longitude2 = undefined,
    'locality.latlongtype': latlongtype = undefined,
    'locality.latlongaccuracy': latlongaccuracy = { headerName: '', value: '' },
    rowNumber: _rowNumber,
    ...rest
  },
  markerClickCallback,
  iconClass,
}: {
  readonly localityData: LocalityData;
  readonly markerClickCallback?: string | L.LeafletEventHandlerFn;
  readonly iconClass?: string;
}): MarkerGroups {
  const markers: MarkerGroups = {
    marker: [],
    polygon: [],
    polygonBoundary: [],
    errorRadius: [],
  };

  if (typeof latitude1 === 'undefined' || typeof longitude1 === undefined)
    return markers;

  const icon = new L.Icon.Default();
  if (typeof iconClass !== 'undefined') icon.options.className = iconClass;

  const createPoint = (latitude1: number, longitude1: number): L.Marker =>
    L.marker([latitude1, longitude1], {
      icon,
    });

  if (typeof latitude2 === 'undefined' || typeof longitude2 === 'undefined') {
    // A circle
    if (isValidAccuracy(latlongaccuracy.value))
      markers.errorRadius.push(
        L.circle([latitude1.value, longitude1.value], {
          radius: Number.parseFloat(latlongaccuracy.value),
        })
      );

    // A point
    markers.marker.push(createPoint(latitude1.value, longitude1.value));
  } else {
    markers.polygon.push(
      latlongtype?.value?.toLowerCase() === 'line'
        ? // A line
          createLine(
            [latitude1.value, longitude1.value],
            [latitude2.value, longitude2.value]
          )
        : // A polygon
          L.polygon([
            [latitude1.value, longitude1.value],
            [latitude2.value, longitude1.value],
            [latitude2.value, longitude2.value],
            [latitude1.value, longitude2.value],
          ])
    );
    markers.polygonBoundary.push(
      createPoint(latitude1.value, longitude1.value),
      createPoint(latitude2.value, longitude2.value)
    );
  }

  Object.values(markers)
    .flat(2)
    .forEach((vector) => {
      if (typeof markerClickCallback === 'function')
        vector.on('click', markerClickCallback);
      vector.bindPopup(formatLocalityData(rest));
    });

  return markers;
}

export type LayerConfig = {
  readonly transparent: boolean;
  readonly layerLabel: string;
  readonly tileLayer: {
    readonly mapUrl: string;
    readonly options: IR<unknown>;
  };
};

export async function showCOMap(
  mapContainer: Readonly<HTMLDivElement>,
  listOfLayersRaw: RA<LayerConfig>,
  details: string | undefined = undefined
): Promise<[L.Map, L.Control.Layers, HTMLDivElement | undefined]> {
  const tileLayers = await getLeafletLayers();

  const listOfLayers: {
    transparent: boolean;
    layerLabel: string;
    tileLayer: L.TileLayer.WMS | L.TileLayer;
  }[] = [
    ...coMapTileServers.map(({ transparent, layerLabel }) => ({
      transparent,
      layerLabel,
      tileLayer: tileLayers[transparent ? 'overlays' : 'baseMaps'][layerLabel],
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
  addPrintMapButton(map);

  if (typeof details !== 'undefined')
    return [
      map,
      layerGroup,
      addDetailsButton(mapContainer, map, details) as HTMLDivElement,
    ];

  return [map, layerGroup, undefined];
}
