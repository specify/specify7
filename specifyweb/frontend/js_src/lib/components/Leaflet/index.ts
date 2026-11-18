/**
 * Utility functions for rendering a Leaflet map
 *
 * @module
 */

import { renderToStaticMarkup } from 'react-dom/server';

import { commonText } from '../../localization/common';
import { f } from '../../utils/functools';
import type { RA, WritableArray } from '../../utils/types';
import { overwriteReadOnly } from '../../utils/types';
import { className } from '../Atoms/className';
import { icons } from '../Atoms/Icons';
import { userPreferences } from '../Preferences/userPreferences';
import { splitJoinedMappingPath } from '../WbPlanView/mappingHelpers';
import type { LeafletInstance } from './addOns';
import {
  addMarkersToMap,
  addPrintMapButton,
  rememberSelectedBaseLayers,
} from './addOns';
import { mappingLocalityColumns } from './config';
import L from './extend';
import type { Field, LocalityData } from './helpers';
import { isValidAccuracy } from './helpers';
import type { fetchLeafletLayers } from './layers';
import { overlayPaneName } from './layers';

const DEFAULT_ZOOM = 5;

export function showLeafletMap({
  tileLayers,
  container,
  localityPoints = [],
  onMarkerClick: handleMarkerClick,
}: {
  readonly tileLayers: Awaited<ReturnType<typeof fetchLeafletLayers>>;
  readonly container: HTMLDivElement;
  readonly localityPoints: RA<LocalityData>;
  readonly onMarkerClick?: (index: number, event: L.LeafletEvent) => void;
}): LeafletInstance {
  container.classList.add(
    'overflow-hidden',
    'h-full',
    'min-h-[theme(spacing.80)]'
  );

  // eslint-disable-next-line functional/prefer-readonly-type
  let defaultCenter: [number, number] = [0, 0];
  let defaultZoom = 1;
  if (localityPoints.length > 0) {
    defaultCenter = [
      localityPoints[0]['locality.latitude1'].value as number,
      localityPoints[0]['locality.longitude1'].value as number,
    ];
    defaultZoom = DEFAULT_ZOOM;
  }

  const animate = userPreferences.get(
    'leaflet',
    'behavior',
    'animateTransitions'
  );
  const map = L.map(container, {
    maxZoom: 23,
    doubleClickZoom: userPreferences.get(
      'leaflet',
      'behavior',
      'doubleClickZoom'
    ),
    closePopupOnClick: userPreferences.get(
      'leaflet',
      'behavior',
      'closePopupOnClick'
    ),
    zoomAnimation: animate,
    fadeAnimation: animate,
    markerZoomAnimation: animate,
    inertia: userPreferences.get('leaflet', 'behavior', 'panInertia'),
    dragging: userPreferences.get('leaflet', 'behavior', 'mouseDrags'),
    scrollWheelZoom: userPreferences.get(
      'leaflet',
      'behavior',
      'scrollWheelZoom'
    ),
  }).setView(defaultCenter, defaultZoom);

  /**
   * Create a new pane for all overlay layers rather than have overlays and base
   * maps on the same pane - to allow for greater z-index control
   */
  const overlayPane = map.createPane(overlayPaneName);
  const layersPaneZindex = getLayerPaneZindex(map);
  overlayPane.style.zIndex = (layersPaneZindex + 10).toString();

  const controlLayers = L.control.layers(
    tileLayers.baseMaps,
    tileLayers.overlays
  );
  controlLayers.addTo(map);
  const leafletMap = map as LeafletInstance;
  overwriteReadOnly(leafletMap, 'controlLayers', controlLayers);
  if (
    !Array.isArray((controlLayers as LeafletInstance['controlLayers'])._layers)
  )
    throw new Error('Unable to retrieve layer names');

  // Hide controls when printing map
  container
    .getElementsByClassName('leaflet-control-container')[0]
    ?.classList.add('print:hidden');

  addPrintMapButton(map);
  rememberSelectedBaseLayers(map, tileLayers.baseMaps);

  return addMarkersToMap(
    leafletMap,
    localityPoints.map((pointDataDict, index) =>
      getMarkersFromLocalityData({
        localityData: pointDataDict,
        onMarkerClick: handleMarkerClick?.bind(undefined, index),
      })
    )
  );
}

export function getLayerPaneZindex(map: L.Map): number {
  // 200 is the default tilePane z-index in Leaflet
  const defaultLayersPaneZindex = 200;
  return (
    f.parseInt(map.getPane('tilePane')?.style.zIndex) ?? defaultLayersPaneZindex
  );
}

export type MarkerGroups = {
  readonly marker: RA<L.Marker>;
  readonly polygon: RA<L.Polygon | L.Polyline>;
  readonly polygonBoundary: RA<L.Marker>;
  readonly errorRadius: RA<L.Circle>;
};
export type LeafletMarker = L.Circle | L.Marker | L.Polygon | L.Polyline;

const createLine = (
  // eslint-disable-next-line functional/prefer-readonly-type
  coordinate1: [number, number],
  // eslint-disable-next-line functional/prefer-readonly-type
  coordinate2: [number, number]
): L.Polyline =>
  new L.Polyline([coordinate1, coordinate2], {
    weight: 3,
    opacity: 0.5,
    smoothFactor: 1,
  });

export const formatLocalityData = (
  localityData: LocalityData,
  viewUrl: string | undefined,
  isLoaded: boolean
): string =>
  // REFACTOR: turn this into React, or React.render_to_string
  [
    ...Object.entries(localityData)
      .filter(([fieldName]) => !mappingLocalityColumns.includes(fieldName))
      .filter(
        // eslint-disable-next-line functional/prefer-readonly-type
        (entry): entry is [string, Field<number | string>] =>
          typeof entry[1] === 'object' && entry[1].value !== ''
      )
      .map(([fieldName, field]) =>
        splitJoinedMappingPath(fieldName).includes('taxon')
          ? `<b>${field.value}</b>`
          : commonText.colonLine({
              label: `<b>${field.headerName}</b>`,
              value: field.value.toString(),
            })
      ),
    ...(typeof viewUrl === 'string'
      ? [
          `
          <br>
          <a
            href="${viewUrl}"
            target="_blank"
            class="${className.link}"
            title="${commonText.opensInNewTab()}"
          >
            ${commonText.viewRecord()}
            <span
              title="${commonText.opensInNewTab()}"
              aria-label="${commonText.opensInNewTab()}"
            >${renderToStaticMarkup(icons.externalLink)}</span>
          </a>`,
        ]
      : []),
    Array.from(isLoaded ? [] : [commonText.loading()]),
  ].join('<br>');

export function getMarkersFromLocalityData({
  localityData: { rowNumber: _rowNumber, ...localityData },
  onMarkerClick: handleMarkerClick,
  iconClass,
}: {
  readonly localityData: LocalityData;
  readonly onMarkerClick?: L.LeafletEventHandlerFn | string;
  readonly iconClass?: string;
}): MarkerGroups {
  const markers: {
    readonly [KEY in keyof MarkerGroups]: WritableArray<
      MarkerGroups[KEY][number]
    >;
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
    parsedLocalityData.latitude1 === undefined ||
    parsedLocalityData.longitude1 === undefined
  )
    return markers;

  const icon = new L.Icon.Default();
  if (typeof iconClass === 'string') icon.options.className = iconClass;

  const createPoint = (latitude1: number, longitude1: number): L.Marker =>
    L.marker([latitude1, longitude1], {
      icon,
    });

  if (
    parsedLocalityData.latitude2 === undefined ||
    parsedLocalityData.longitude2 === undefined
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
      if (typeof handleMarkerClick === 'function')
        vector.on('click', handleMarkerClick);
      vector.bindPopup(
        formatLocalityData(
          localityData,
          undefined,
          handleMarkerClick === undefined
        )
      );
    });

  return markers;
}
