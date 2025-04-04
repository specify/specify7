import type { LayersControlEventHandlerFn } from 'leaflet';

import { localityText } from '../../localization/locality';
import { getCache, setCache } from '../../utils/cache';
import type { IR, RA, RR } from '../../utils/types';
import { overwriteReadOnly } from '../../utils/types';
import L, { leafletControls } from './extend';
import type { LeafletMarker, MarkerGroups } from './index';
import { preferredBaseLayer, preferredOverlay } from './layers';

const mapName = 'main';

export function rememberSelectedBaseLayers(
  map: L.Map,
  layers: IR<L.TileLayer>
): void {
  const currentLayer = getCache('leafletCurrentLayer', mapName);
  const baseLayer =
    (typeof currentLayer === 'string' && currentLayer in layers
      ? layers[currentLayer]
      : layers[preferredBaseLayer]) ?? Object.values(layers)[0];
  baseLayer.addTo(map);

  map.on('baselayerchange', ({ name }: { readonly name: string }) => {
    setCache('leafletCurrentLayer', mapName, name);
  });
}

function rememberSelectedOverlays(
  map: LeafletInstance,
  defaultVisibleOverlays: IR<boolean> = {}
): void {
  const handleOverlayEvent: LayersControlEventHandlerFn = ({ layer, type }) => {
    const name = map.controlLayers._layers.find(
      (entry) => entry.layer === layer
    )?.name;
    if (typeof name === 'string')
      setCache('leafletOverlays', name, type === 'overlayadd');
    else
      console.error('Unable to find the name of the overlay', { layer, map });
  };

  const isVisible = (name: string, defaultValue = false): boolean =>
    getCache('leafletOverlays', name) ??
    defaultVisibleOverlays[name] ??
    defaultValue;
  map.controlLayers._layers
    .filter(({ name }) => isVisible(name))
    .forEach(({ layer }) => layer.addTo(map));
  const originalAddOverlay = map.controlLayers.addOverlay;
  map.controlLayers.addOverlay = (layer, name): typeof map.controlLayers => {
    originalAddOverlay.call(map.controlLayers, layer, name);
    if (isVisible(name, true)) layer.addTo(map);
    return map.controlLayers;
  };

  map.on('overlayadd', handleOverlayEvent);
  map.on('overlayremove', handleOverlayEvent);
}

export function addFullScreenButton(
  map: L.Map,
  callback: (isEnabled: boolean) => void
): void {
  new (leafletControls.FullScreen(callback))({ position: 'topleft' }).addTo(
    map
  );
}

export function addPrintMapButton(map: L.Map): void {
  new leafletControls.PrintMap({ position: 'topleft' }).addTo(map);
}

const markerLayerName = [
  'marker',
  'polygon',
  'polygonBoundary',
  'errorRadius',
] as const;
export type MarkerLayerName = (typeof markerLayerName)[number];
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
  readonly controlLayers: L.Control.Layers & {
    readonly _layers: RA<{
      readonly layer: L.FeatureGroup | L.TileLayer;
      readonly name: string;
    }>;
  };
};

export function addMarkersToMap(
  map: LeafletInstance,
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
          L.FeatureGroup,
        ]
    )
  );

  rememberSelectedOverlays(map, {
    ...defaultMarkerGroupsState,
    [preferredOverlay]: true,
  });

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
          map.controlLayers.addOverlay(layerGroups[markerGroupName], label);
          addedGroups.add(markerGroupName);
        })
      )
    );

  addMarkers(markers);

  const leafletMap = map;
  overwriteReadOnly(leafletMap, 'addMarkers', addMarkers);
  return leafletMap;
}
