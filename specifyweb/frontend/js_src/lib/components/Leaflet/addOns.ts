import type { LayersControlEventHandlerFn } from 'leaflet';

import { localityText } from '../../localization/locality';
import { getCache, setCache } from '../../utils/cache';
import type { IR, RA, RR } from '../../utils/types';
import { overwriteReadOnly } from '../../utils/types';
import { capitalize, KEY } from '../../utils/utils';
import L from './extend';
import type { LeafletMarker, MarkerGroups } from './index';
import { preferredBaseLayer, preferredOverlay } from './layers';

export type LeafletCacheSalt = 'CoMap' | 'MainMap';

export function rememberSelectedBaseLayers(
  map: L.Map,
  layers: IR<L.TileLayer>,
  cacheSalt: LeafletCacheSalt
): void {
  const cacheName = `currentLayer${cacheSalt}` as const;
  const currentLayer = getCache('leaflet', cacheName);
  const baseLayer =
    (typeof currentLayer === 'string' && currentLayer in layers
      ? layers[currentLayer]
      : layers[preferredBaseLayer]) ?? Object.values(layers)[0];
  baseLayer.addTo(map);

  map.on('baselayerchange', ({ name }: { readonly name: string }) => {
    setCache('leaflet', cacheName, name);
  });
}

function rememberSelectedOverlays(
  map: L.Map,
  layers: IR<L.FeatureGroup | L.TileLayer>,
  defaultOverlays: IR<boolean> = {}
): void {
  const handleOverlayEvent: LayersControlEventHandlerFn = ({ layer, type }) => {
    const layerName = Object.entries(layers).find(
      ([_, layerObject]) => layerObject === layer
    )?.[KEY];
    if (typeof layerName === 'string')
      setCache(
        'leaflet',
        `show${capitalize(layerName) as Capitalize<MarkerLayerName>}` as const,
        type === 'overlayadd'
      );
  };

  Object.keys(layers)
    .filter(
      (layerName) =>
        getCache(
          'leaflet',
          `show${capitalize(layerName) as Capitalize<MarkerLayerName>}` as const
        ) ??
        defaultOverlays[layerName] ??
        false
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

export function addPrintMapButton(map: L.Map): void {
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

const defaultLabels = {
  marker: localityText.occurrencePoints(),
  polygon: localityText.occurrencePolygons(),
  polygonBoundary: localityText.polygonBoundaries(),
  errorRadius: localityText.errorRadius(),
} as const;

export type LeafletInstance = L.Map & {
  readonly addMarkers: (markers: RA<MarkerGroups>) => void;
};

export function addMarkersToMap(
  map: L.Map,
  defaultOverlays: IR<L.TileLayer>,
  controlLayers: L.Control.Layers,
  markers: RA<MarkerGroups>,
  labels: Partial<RR<MarkerLayerName, string>> = defaultLabels
): LeafletInstance {
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
        [groupName, L.featureGroup.subGroup(cluster)] as readonly [
          MarkerLayerName,
          L.FeatureGroup
        ]
    )
  );

  rememberSelectedOverlays(
    map,
    { ...defaultOverlays, ...layerGroups },
    {
      ...defaultMarkerGroupsState,
      [preferredOverlay]: true,
    }
  );

  const addedGroups = new Set<MarkerLayerName>();

  const addMarkers = (markers: RA<MarkerGroups>): void =>
    // Sort markers by layer groups
    markers.forEach((markers) =>
      Object.entries(markers).forEach(([markerGroupName, markers]) =>
        (markers as RA<LeafletMarker>).forEach((marker) => {
          layerGroups[markerGroupName].addLayer(marker);

          if (addedGroups.has(markerGroupName)) return;
          // Add layer groups' checkboxes to the layer control menu
          const label =
            labels?.[markerGroupName] ?? defaultLabels[markerGroupName];
          controlLayers.addOverlay(layerGroups[markerGroupName], label);
          addedGroups.add(markerGroupName);
        })
      )
    );

  addMarkers(markers);

  const leafletMap = map as LeafletInstance;
  overwriteReadOnly(leafletMap, 'addMarkers', addMarkers);
  return leafletMap;
}
