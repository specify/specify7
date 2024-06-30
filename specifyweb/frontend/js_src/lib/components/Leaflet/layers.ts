import type { TileLayerOptions } from 'leaflet';

import { ajax } from '../../utils/ajax';
import { Http } from '../../utils/ajax/definitions';
import { getAppResourceUrl } from '../../utils/ajax/helpers';
import type { IR, RA, RR } from '../../utils/types';
import { softFail } from '../Errors/Crash';
import {
  cacheableUrl,
  contextUnlockedPromise,
  foreverFetch,
} from '../InitialContext';
import L from './extend';

type SerializedLayer = {
  readonly endpoint: string;
  readonly serverType: 'tileServer' | 'wms';
  readonly layerOptions: TileLayerOptions;
  readonly styles?: RA<keyof typeof layerStyles>;
};

type Layers<LAYER> = RR<'baseMaps' | 'overlays', IR<LAYER>>;

export const leafletLayersEndpoint =
  'https://files.specifysoftware.org/specify7/7.8.10/leaflet-layers.json';

/**
 * Optional filters to apply to a layer
 */
const layerStyles = {
  grayscale: 'grayscale brightness-150',
  // Smartly inverts leaflet layer's color scheme when in dark-mode:
  'auto-dark-mode': 'dark:invert-leaflet-layer',
};

export const preferredBaseLayer = 'Satellite Map (ESRI)';
export const preferredOverlay = 'Labels and boundaries';

/**
 * DO NOT USE THIS OBJECT DIRECTLY (except in tests).
 * Use leafletLayersPromise instead.
 *
 * TileServers and WMS servers that Leaflet should use
 *
 * These layers are only used when:
 *  * Leaflet failed to fetch layers from:
 *    leafletLayersEndpoint (defined above)
 *  * User didn't define a resource file `leaflet-layers`
 *
 * On any updates to this file, you should also update the one at
 * leafletLayersEndpoint
 *
 * Documentation:
 * https://github.com/specify/specify7/wiki/Adding-Custom-Tile-Servers
 *
 * Adding "dark:invert-leaflet-layer' smartly inverts the layer colors when in
 * dark mode
 */
export const defaultTileLayers: Layers<SerializedLayer> = {
  baseMaps: {
    'Street Map (OpenStreetMap)': {
      endpoint: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      serverType: 'tileServer',
      layerOptions: {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      },
      styles: ['auto-dark-mode'],
    },
    'Street Map (ESRI)': {
      endpoint:
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
      serverType: 'tileServer',
      layerOptions: {
        maxZoom: 23,
        attribution:
          'Esri, HERE, Garmin, USGS, Intermap, INCREMENT P, NRCan, Esri Japan, METI, Esri China (Hong Kong), Esri Korea, Esri (Thailand), NGCC, (c) OpenStreetMap contributors, and the GIS User Community',
      },
      styles: ['auto-dark-mode'],
    },
    'Topographic Map (ESRI)': {
      endpoint:
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      serverType: 'tileServer',
      layerOptions: {
        maxZoom: 23,
        attribution:
          'Sources: Esri, HERE, Garmin, Intermap, increment P Corp., GEBCO, USGS, FAO, NPS, NRCAN, GeoBase, IGN, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), (c) OpenStreetMap contributors, and the GIS User Community',
      },
      styles: ['auto-dark-mode'],
    },
    'Satellite Map (ESRI)': {
      endpoint:
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      serverType: 'tileServer',
      layerOptions: {
        maxZoom: 23,
        attribution:
          'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      },
    },
    'Satellite Map (ESRI) (grayscale)': {
      endpoint:
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      serverType: 'tileServer',
      layerOptions: {
        maxZoom: 23,
        attribution:
          'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      },
      styles: ['grayscale'],
    },
    'Satellite Map (Géoportail/France)': {
      endpoint:
        'https://wxs.ign.fr/{apikey}/geoportail/wmts?REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&STYLE={style}&TILEMATRIXSET=PM&FORMAT={format}&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}',
      serverType: 'tileServer',
      layerOptions: {
        attribution:
          '<a target="_blank" href="https://www.geoportail.gouv.fr/">Geoportail France</a>',
        bounds: [
          [-75, -180],
          [81, 180],
        ],
        minZoom: 2,
        maxZoom: 12,
        // @ts-expect-error
        apikey: 'choisirgeoportail',
        format: 'image/jpeg',
        style: 'normal',
      },
    },
    'Satellite Map (USGS)': {
      endpoint:
        'https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}',
      serverType: 'tileServer',
      layerOptions: {
        maxZoom: 16,
        attribution:
          'Tiles courtesy of the <a href="https://usgs.gov/">U.S. Geological Survey</a>',
      },
    },
    'Live Satellite Map (NASA/GIBS)': {
      endpoint:
        'https://gibs.earthdata.nasa.gov/wmts/epsg3031/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/{time}/{tilematrixset}/{z}/{y}/{x}.{format}',
      serverType: 'tileServer',
      layerOptions: {
        attribution:
          'Imagery provided by services from the Global Imagery Browse Services (GIBS), operated by the NASA/GSFC/Earth Science Data and Information System (<a href="https://earthdata.nasa.gov">ESDIS</a>) with funding provided by NASA/HQ.',
        bounds: [
          [-85.051_128_777_6, -179.999_999_975],
          [85.051_128_777_6, 179.999_999_975],
        ],
        minZoom: 1,
        maxZoom: 9,
        // @ts-expect-error
        format: 'jpg',
        time: '',
        tilematrixset: '250m',
      },
    },
  },
  overlays: {
    'Labels and boundaries': {
      endpoint:
        'https://esp.usdoj.gov/arcweb/rest/services/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      serverType: 'tileServer',
      layerOptions: {
        maxZoom: 23,
        attribution:
          'Esri, HERE, Garmin, (c) OpenStreetMap contributors, and the GIS user community',
      },
    },
  },
};

/**
 * By default in Leaflet, all base maps and overlay layers are on the same pane.
 * We are pushing overlay layers to a separate pane to give us more control over
 * the z-index.
 */
export const overlayPaneName = 'overlayLayersPane';

export const fetchLeafletLayers = async (): Promise<Layers<L.TileLayer>> =>
  layersPromise.then(parseLayersFromJson);

/**
 * Try to fetch up-to-date tile servers. If fails, use the default tile servers
 */
const layersPromise: Promise<Layers<SerializedLayer>> =
  contextUnlockedPromise.then(async (entrypoint) =>
    entrypoint === 'main'
      ? ajax(cacheableUrl(getAppResourceUrl('leaflet-layers', 'quiet')), {
          headers: { Accept: 'text/plain' },
          errorMode: 'silent',
        })
          .then(async ({ data, status }) =>
            status === Http.NO_CONTENT
              ? ajax<Layers<SerializedLayer>>(
                  cacheableUrl(leafletLayersEndpoint),
                  {
                    headers: { Accept: 'application/json' },
                    errorMode: 'silent',
                  }
                ).then(({ data }) => data)
              : (JSON.parse(data) as Layers<SerializedLayer>)
          )
          .catch((error) => {
            softFail(error);
            return defaultTileLayers;
          })
      : foreverFetch()
  );

/**
 * Have to call this every time you try to create leaflet layers so as to create
 * new L.tileLayer instances (Leaflet doesn't allow reusing them)
 */
const parseLayersFromJson = (
  json: Layers<SerializedLayer>
): Layers<L.TileLayer> =>
  Object.fromEntries(
    Object.entries(json).map(
      ([layerGroup, layers]) =>
        [
          layerGroup,
          Object.fromEntries(
            Object.entries(layers).map(
              ([layerName, { endpoint, serverType, layerOptions, styles }]) => [
                layerName,
                (serverType === 'wms' ? L.tileLayer.wms : L.tileLayer)(
                  endpoint,
                  {
                    ...(layerGroup === 'overlays'
                      ? {
                          pane: overlayPaneName,
                        }
                      : {}),
                    ...layerOptions,
                    ...(Array.isArray(styles)
                      ? {
                          className: [
                            layerOptions.className ?? '',
                            ...styles.map((style) => layerStyles[style] ?? ''),
                          ]
                            .filter(Boolean)
                            .join(' '),
                        }
                      : {}),
                  }
                ),
              ]
            )
          ),
        ] as const
    )
  );
