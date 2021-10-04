/*
 * Utility functions for rendering a Leaflet map
 *
 */

import $ from 'jquery';
import type { LayersControlEventHandlerFn } from 'leaflet';

import * as cache from './cache';
import type { IR, RA, RR } from './components/wbplanview';
import {
  leafletLayersEndpoint,
  leafletTileServers,
  mappingLocalityColumns,
  preferredBaseLayer,
  preferredOverlay,
} from './leafletconfig';
import L from './leafletextend';
import type { Field, LocalityData } from './leafletutils';
import commonText from './localization/common';
import localityText from './localization/locality';
import { capitalize } from './wbplanviewhelper';
import { splitJoinedMappingPath } from './wbplanviewmappinghelper';

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
    title: commonText('geoMap'),
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
      localityPoints[0]['locality.latitude1'].value as number,
      localityPoints[0]['locality.longitude1'].value as number,
    ];
    defaultZoom = DEFAULT_ZOOM;
  }

  const map = L.map(leafletMapContainer[0], { maxZoom: 23 }).setView(
    defaultCenter,
    defaultZoom
  );
  const controlLayers = L.control.layers(
    tileLayers.baseMaps,
    tileLayers.overlays
  );
  controlLayers.addTo(map);

  addMarkersToMap(
    map,
    controlLayers,
    localityPoints.map((pointDataDict, index) =>
      getMarkersFromLocalityData({
        localityData: pointDataDict,
        markerClickCallback: markerClickCallback?.bind(undefined, index),
      })
    )
  );

  addFullScreenButton(map);
  addPrintMapButton(map);
  rememberSelectedBaseLayers(map, tileLayers.baseMaps, 'MainMap');

  return map;
}

export type LeafletCacheSalt = string & ('MainMap' | 'CoMap');

function rememberSelectedBaseLayers(
  map: L.Map,
  layers: IR<L.TileLayer>,
  cacheSalt: LeafletCacheSalt
): void {
  const cacheName = `currentLayer${cacheSalt}` as const;
  const currentLayer = cache.get('leaflet', cacheName);
  const baseLayer =
    (currentLayer !== false && currentLayer in layers
      ? layers[currentLayer]
      : layers[preferredBaseLayer]) ?? Object.values(layers)[0];
  baseLayer.addTo(map);

  map.on('baselayerchange', ({ name }: { readonly name: string }) => {
    cache.set('leaflet', cacheName, name, { overwrite: true });
  });
}

function rememberSelectedOverlays(
  map: L.Map,
  layers: IR<L.TileLayer | L.FeatureGroup>,
  defaultOverlays: IR<boolean> = {}
): void {
  const handleOverlayEvent: LayersControlEventHandlerFn = ({ layer, type }) => {
    const layerName = Object.entries(layers).find(
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

  Object.keys(layers)
    .filter((layerName) =>
      cache.get(
        'leaflet',
        `show${capitalize(layerName) as Capitalize<MarkerLayerName>}` as const,
        { defaultValue: defaultOverlays[layerName] ?? false }
      )
    )
    .forEach((layerName) => layers[layerName].addTo(map));

  map.on('overlayadd', handleOverlayEvent);
  map.on('overlayremove', handleOverlayEvent);
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
  [header, details]: [string, string]
): Element {
  // @ts-expect-error
  L.control.details = (options) => new L.Control.Details(options);
  // @ts-expect-error
  L.control.details({ position: 'topleft' }).addTo(map);
  const detailsContainer = container.getElementsByClassName(
    'leaflet-details-container'
  )[0];
  detailsContainer.getElementsByTagName('summary')[0].textContent = header;
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
  labels?: Partial<RR<MarkerLayerName, string>>
): void {
  if (markers.length === 0) return;

  // Initialize layer groups
  const cluster = L.markerClusterGroup({
    iconCreateFunction(cluster) {
      const childCount = cluster.getChildCount();

      const minHue = 10;
      const maxHue = 90;
      const maxValue = 200;
      const hue = Math.max(
        0,
        Math.round((childCount / maxValue) * (minHue - maxHue) + maxHue)
      );

      const iconObject = new L.DivIcon({
        html: `<div
          style="background-color: hsl(${hue}deg, 50%, 50%, 0.7)"
        ><span>${childCount}</span></div>`,
        className: `marker-cluster marker-cluster-${
          childCount < 10 ? 'small' : childCount < 100 ? 'medium' : 'large'
        }`,
        iconSize: new L.Point(40, 40),
      });

      const iconElement = iconObject.createIcon();
      iconElement.classList.add('test');

      return iconObject;
    },
  });
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

  rememberSelectedOverlays(map, layerGroups, {
    ...defaultMarkerGroupsState,
    [preferredOverlay]: true,
  });

  const layerLabels: Exclude<typeof labels, undefined> =
    typeof labels === 'undefined'
      ? {
          marker: localityText('occurrencePoints'),
          polygon: localityText('occurrencePolygons'),
          polygonBoundary: localityText('polygonBoundaries'),
          errorRadius: localityText('errorRadius'),
        }
      : labels;
  // Add layer groups' checkboxes to the layer control menu
  Object.entries(layerLabels).forEach(([key, label]) =>
    controlLayers.addOverlay(layerGroups[key as MarkerLayerName], label)
  );
}

export function isValidAccuracy(
  latlongaccuracy: string | undefined
): latlongaccuracy is string {
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
  localityData: LocalityData,
  viewUrl?: string,
  hideRedundant = false
): string =>
  [
    ...Object.entries(localityData)
      .filter(
        ([fieldName]) =>
          !hideRedundant || !mappingLocalityColumns.includes(fieldName)
      )
      .filter(
        (entry): entry is [string, Field<string | number>] =>
          typeof entry[1] !== 'undefined' && entry[1].value !== ''
      )
      .map(([fieldName, field]) =>
        splitJoinedMappingPath(fieldName).includes('taxon')
          ? `<b>${field.value}</b>`
          : `<b>${field.headerName}</b>: ${field.value}`
      ),
    ...(viewUrl
      ? [
          `
          <br>
          <a
            href="${viewUrl}"
            target="_blank"
          >${localityText('viewRecord')}</a>`,
        ]
      : []),
  ].join('<br>');

export function getMarkersFromLocalityData({
  localityData: { rowNumber: _rowNumber, ...localityData },
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

  const getNumber = (fieldName: string): number | undefined =>
    typeof localityData[fieldName]?.value === 'number'
      ? (localityData[fieldName].value as number)
      : undefined;

  const getString = (fieldName: string): string | undefined =>
    typeof localityData[fieldName]?.value === 'string'
      ? (localityData[fieldName].value as string)
      : undefined;

  const parsedLocalityData = {
    latitude1: getNumber('locality.latitude1'),
    latitude2: getNumber('locality.latitude2'),
    longitude1: getNumber('locality.longitude1'),
    longitude2: getNumber('locality.longitude2'),
    latlongaccuracy: getString('locality.latlongaccuracy'),
    latlongtype: getString('locality.latlongtype'),
  };

  if (
    typeof parsedLocalityData.latitude1 === 'undefined' ||
    typeof parsedLocalityData.longitude1 === 'undefined'
  )
    return markers;

  const icon = new L.Icon.Default();
  if (typeof iconClass !== 'undefined') icon.options.className = iconClass;

  const createPoint = (latitude1: number, longitude1: number): L.Marker =>
    L.marker([latitude1, longitude1], {
      icon,
    });

  if (
    typeof parsedLocalityData.latitude2 === 'undefined' ||
    typeof parsedLocalityData.longitude2 === 'undefined'
  ) {
    // A circle
    if (isValidAccuracy(parsedLocalityData.latlongaccuracy))
      markers.errorRadius.push(
        L.circle(
          [parsedLocalityData.latitude1, parsedLocalityData.longitude1],
          {
            radius: Number.parseFloat(parsedLocalityData.latlongaccuracy),
          }
        )
      );

    // A point
    markers.marker.push(
      createPoint(parsedLocalityData.latitude1, parsedLocalityData.longitude1)
    );
  } else {
    markers.polygon.push(
      parsedLocalityData.latlongtype?.toLowerCase() === 'line'
        ? createLine(
            [parsedLocalityData.latitude1, parsedLocalityData.longitude1],
            [parsedLocalityData.latitude2, parsedLocalityData.longitude2]
          )
        : L.polygon([
            [parsedLocalityData.latitude1, parsedLocalityData.longitude1],
            [parsedLocalityData.latitude2, parsedLocalityData.longitude1],
            [parsedLocalityData.latitude2, parsedLocalityData.longitude2],
            [parsedLocalityData.latitude1, parsedLocalityData.longitude2],
          ])
    );
    markers.polygonBoundary.push(
      createPoint(parsedLocalityData.latitude1, parsedLocalityData.longitude1),
      createPoint(parsedLocalityData.latitude1, parsedLocalityData.longitude2)
    );
  }

  Object.values(markers)
    .flat(2)
    .forEach((vector) => {
      if (typeof markerClickCallback === 'function')
        vector.on('click', markerClickCallback);
      vector.bindPopup(formatLocalityData(localityData, undefined, true));
    });

  return markers;
}

export type LayerConfig = {
  readonly transparent: boolean;
  readonly layerLabel: string;
  readonly isDefault: boolean;
  readonly tileLayer: {
    readonly mapUrl: string;
    readonly options: IR<unknown>;
  };
};

export async function showCOMap(
  mapContainer: Readonly<HTMLDivElement>,
  listOfLayersRaw: RA<LayerConfig>,
  details: [string, string] | undefined = undefined
): Promise<[L.Map, L.Control.Layers, HTMLDivElement | undefined]> {
  const tileLayers = await getLeafletLayers();

  const listOfLayers: {
    readonly transparent: boolean;
    readonly layerLabel: string;
    readonly tileLayer: L.TileLayer.WMS | L.TileLayer;
  }[] = [
    ...Object.entries(tileLayers.baseMaps).map(([layerLabel, tileLayer]) => ({
      transparent: false,
      layerLabel,
      tileLayer,
    })),
    ...listOfLayersRaw.map(
      ({ transparent, layerLabel, tileLayer: { mapUrl, options } }) => ({
        transparent,
        layerLabel,
        tileLayer: L.tileLayer.wms(mapUrl, options),
      })
    ),
    ...Object.entries(tileLayers.overlays).map(([layerLabel, tileLayer]) => ({
      transparent: true,
      layerLabel,
      tileLayer,
    })),
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

  const overlayLayers = formatLayersDict(
    listOfLayers.filter(({ transparent }) => transparent)
  );
  const baseLayers = formatLayersDict(
    listOfLayers.filter(({ transparent }) => !transparent)
  );

  const map = L.map(mapContainer).setView([0, 0], 1);

  const layerGroup = L.control.layers(baseLayers, overlayLayers);
  layerGroup.addTo(map);

  addFullScreenButton(map);
  addPrintMapButton(map);
  rememberSelectedBaseLayers(map, baseLayers, 'CoMap');
  rememberSelectedOverlays(map, overlayLayers, {
    [preferredOverlay]: true,
    ...Object.fromEntries(
      Object.keys(tileLayers.overlays).map((label) => [label, true])
    ),
  });

  listOfLayersRaw
    .filter(({ transparent, isDefault }) => transparent && isDefault)
    .forEach(({ layerLabel }) => {
      overlayLayers[layerLabel].addTo(map);
    });

  if (typeof details !== 'undefined')
    return [
      map,
      layerGroup,
      addDetailsButton(mapContainer, map, details) as HTMLDivElement,
    ];

  return [map, layerGroup, undefined];
}
