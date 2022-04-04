/**
 * Utility functions for rendering a Leaflet map
 *
 * @module
 */

import type { LayersControlEventHandlerFn } from 'leaflet';

import { ajax, Http } from './ajax';
import * as cache from './cache';
import { legacyNonJsxIcons } from './components/icons';
import { cachableUrl, contextUnlockedPromise } from './initialcontext';
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
import type { IR, RA, RR } from './types';
import { capitalize } from './helpers';
import { splitJoinedMappingPath } from './wbplanviewmappinghelper';

const DEFAULT_ZOOM = 5;

// Try to fetch up-to-date tile servers. If fails, use the default tile servers
const parseLayersFromJson = (json: IR<unknown>): typeof leafletTileServers =>
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

export const leafletTileServersPromise: Promise<typeof leafletTileServers> =
  contextUnlockedPromise
    .then(async () =>
      ajax<IR<unknown>>(
        cachableUrl('/context/app.resource?name=leaflet-layers'),
        { headers: { Accept: 'application/json' } },
        { strict: false, expectedResponseCodes: [Http.OK, Http.NOT_FOUND] }
      )
    )
    .then(({ data, status }) =>
      status === Http.NOT_FOUND
        ? ajax<IR<unknown>>(
            cachableUrl(leafletLayersEndpoint),
            { headers: { Accept: 'application/json' } },
            { strict: false }
          ).then(({ data }) => data)
        : data
    )
    .then(parseLayersFromJson)
    .catch((error) => {
      console.error(error);
      return leafletTileServers;
    });

export async function showLeafletMap({
  container,
  localityPoints = [],
  markerClickCallback,
}: {
  readonly container: HTMLDivElement;
  readonly localityPoints: RA<LocalityData>;
  readonly markerClickCallback?: (index: number, event: L.LeafletEvent) => void;
}): Promise<L.Map> {
  const tileLayers = await leafletTileServersPromise;

  container.classList.add(
    'overflow-hidden',
    'h-full',
    'min-h-[theme(spacing.80)]'
  );

  let defaultCenter: [number, number] = [0, 0];
  let defaultZoom = 1;
  if (localityPoints.length > 0) {
    defaultCenter = [
      localityPoints[0]['locality.latitude1'].value as number,
      localityPoints[0]['locality.longitude1'].value as number,
    ];
    defaultZoom = DEFAULT_ZOOM;
  }

  const map = L.map(container, { maxZoom: 23 }).setView(
    defaultCenter,
    defaultZoom
  );
  const controlLayers = L.control.layers(
    tileLayers.baseMaps,
    tileLayers.overlays
  );
  controlLayers.addTo(map);

  // Hide controls when printing map
  container
    .getElementsByClassName('leaflet-control-container')[0]
    ?.classList.add('print:hidden');

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
    (typeof currentLayer === 'string' && currentLayer in layers
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
    if (typeof layerName === 'string')
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

export function addFullScreenButton(
  map: L.Map,
  callback: (isEnabled: boolean) => void
): void {
  // @ts-expect-error
  new L.Control.FullScreen({ position: 'topleft', callback }).addTo(map);
}

function addPrintMapButton(map: L.Map): void {
  // @ts-expect-error
  new L.Control.PrintMap({ position: 'topleft' }).addTo(map);
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
  );

  const groupsWithMarkers = new Set<string>();

  // Sort markers by layer groups
  markers.forEach((markers) =>
    Object.entries(markers).forEach(([markerGroupName, markers]) =>
      (markers as RA<Marker>).forEach((marker) => {
        layerGroups[markerGroupName].addLayer(marker);
        groupsWithMarkers.add(markerGroupName);
      })
    )
  );

  rememberSelectedOverlays(map, layerGroups, {
    ...defaultMarkerGroupsState,
    [preferredOverlay]: true,
  });

  const defaultLabels = {
    marker: localityText('occurrencePoints'),
    polygon: localityText('occurrencePolygons'),
    polygonBoundary: localityText('polygonBoundaries'),
    errorRadius: localityText('errorRadius'),
  };

  // Add layer groups' checkboxes to the layer control menu
  Object.entries(labels ?? defaultLabels)
    .filter(([markerGroupName]) => groupsWithMarkers.has(markerGroupName))
    .forEach(([key, label]) =>
      controlLayers.addOverlay(layerGroups[key], label ?? defaultLabels[key])
    );
}

export function isValidAccuracy(
  latlongaccuracy: string | undefined
): latlongaccuracy is string {
  try {
    return (
      typeof latlongaccuracy !== 'undefined' &&
      !Number.isNaN(Number.parseFloat(latlongaccuracy)) &&
      Number.parseFloat(latlongaccuracy) >= 1
    );
  } catch {
    return false;
  }
}

export type MarkerGroups = {
  readonly marker: RA<L.Marker>;
  readonly polygon: RA<L.Polygon | L.Polyline>;
  readonly polygonBoundary: RA<L.Marker>;
  readonly errorRadius: RA<L.Circle>;
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
          typeof entry[1] === 'object' && entry[1].value !== ''
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
            title="${commonText('opensInNewTab')}"
          >
            ${commonText('viewRecord')}
            <span
              title="${commonText('opensInNewTab')}"
              aria-label="${commonText('opensInNewTab')}"
            >${legacyNonJsxIcons.link}</span>
          </a>`,
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
  const markers: {
    readonly [KEY in keyof MarkerGroups]: MarkerGroups[KEY][number][];
  } = {
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
  if (typeof iconClass === 'string') icon.options.className = iconClass;

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
