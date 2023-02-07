import { ajax } from '../../utils/ajax';
import type { IR, RR } from '../../utils/types';
import {
  cachableUrl,
  contextUnlockedPromise,
  foreverFetch,
} from '../InitialContext';
import { formatUrl } from '../Router/queryString';
import L from './extend';
import { Http } from '../../utils/ajax/definitions';
import { softFail } from '../Errors/Crash';

export const leafletLayersEndpoint =
  'https://files.specifysoftware.org/specify7/7.7.0/leaflet-layers.json';

/**
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
export const defaultTileLayers: RR<'baseMaps' | 'overlays', IR<L.TileLayer>> = {
  baseMaps: {
    'Street Map (OpenStreetMap)': L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright"' +
          ' target="_blank">OpenStreetMap</a> contributors',
        // Smartly inverts leaflet layer's color scheme when in dark-mode:
        className: 'dark:invert-leaflet-layer',
      }
    ),
    'Street Map (ESRI)': L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 23,
        attribution:
          'Esri, HERE, Garmin, USGS, Intermap, INCREMENT P, NRCan, Esri Japan, METI, Esri China (Hong Kong), Esri Korea, Esri (Thailand), NGCC, (c) OpenStreetMap contributors, and the GIS User Community',
        className: 'dark:invert-leaflet-layer',
      }
    ),
    'Topographic Map (ESRI)': L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 23,
        attribution:
          'Sources: Esri, HERE, Garmin, Intermap, increment P Corp., GEBCO, USGS, FAO, NPS, NRCAN, GeoBase, IGN, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), (c) OpenStreetMap contributors, and the GIS User Community',
        className: 'dark:invert-leaflet-layer',
      }
    ),
    'Satellite Map (ESRI)': L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 23,
        attribution:
          'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      }
    ),
    'Satellite Map (Géoportail/France)': L.tileLayer(
      'https://wxs.ign.fr/{apikey}/geoportail/wmts?REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&STYLE={style}&TILEMATRIXSET=PM&FORMAT={format}&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}',
      {
        attribution:
          '<a target="_blank" href="https://www.geoportail.gouv.fr/">' +
          'Geoportail France</a>',
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
      }
    ),
    'Satellite Map (USGS)': L.tileLayer(
      'https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 20,
        attribution:
          'Tiles courtesy of the <a href="https://usgs.gov/"' +
          ' target="_blank">U.S. Geological Survey</a>',
      }
    ),
    'Live Satellite Map (NASA/GIBS)': L.tileLayer(
      'https://gibs.earthdata.nasa.gov/wmts/epsg3031/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/{time}/{tilematrixset}/{z}/{y}/{x}.{format}',
      {
        attribution:
          'Imagery provided by services from the Global Imagery Browse Services (GIBS), operated by the NASA/GSFC/Earth Science Data and Information System ' +
          '(<a href="https://earthdata.nasa.gov" target="_blank">ESDIS</a>)' +
          ' with' +
          ' funding provided by NASA/HQ.',
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
      }
    ),
  },
  overlays: {
    'Labels and boundaries': L.tileLayer(
      'https://esp.usdoj.gov/arcweb/rest/services/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 23,
        attribution:
          'Esri, HERE, Garmin, (c) OpenStreetMap contributors, and the GIS user community',
      }
    ),
  },
} as const;

export const preferredBaseLayer = 'Satellite Map (ESRI)';
export const preferredOverlay = 'Labels and boundaries';
/*
 * Try to fetch up-to-date tile servers. If fails, use the default tile servers
 */
export const leafletLayersPromise: Promise<typeof defaultTileLayers> =
  contextUnlockedPromise.then(async (entrypoint) =>
    entrypoint === 'main'
      ? ajax<string>(
          cachableUrl(
            formatUrl('/context/app.resource', {
              name: 'leaflet-layers',
              quiet: '',
            })
          ),
          { headers: { Accept: 'text/plain' } },
          {
            errorMode: 'silent',
            expectedResponseCodes: [Http.OK, Http.NO_CONTENT],
          }
        )
          .then(({ data, status }) =>
            status === Http.NO_CONTENT
              ? ajax<IR<unknown>>(
                  cachableUrl(leafletLayersEndpoint),
                  { headers: { Accept: 'application/json' } },
                  { errorMode: 'silent' }
                ).then(({ data }) => data)
              : (JSON.parse(data) as IR<unknown>)
          )
          .then(parseLayersFromJson)
          .catch((error) => {
            softFail(error);
            return defaultTileLayers;
          })
      : foreverFetch<typeof defaultTileLayers>()
  );

const parseLayersFromJson = (json: IR<unknown>): typeof defaultTileLayers =>
  Object.fromEntries(
    Object.entries(json).map(([layerGroup, layers]) => [
      layerGroup,
      Object.fromEntries(
        Object.entries(
          layers as IR<{
            readonly endpoint: string;
            readonly serverType: 'tileServer' | 'wms';
            readonly layerOptions: IR<unknown>;
          }>
        ).map(([layerName, { endpoint, serverType, layerOptions }]) => [
          layerName,
          (serverType === 'wms' ? L.tileLayer.wms : L.tileLayer)(
            endpoint,
            layerOptions
          ),
        ])
      ),
    ])
  ) as typeof defaultTileLayers;
