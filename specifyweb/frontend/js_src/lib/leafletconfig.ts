/*
 * TileServers and WMS servers that Leaflet should use
 *
 */

'use strict';

import L from './leafletextend';
import type { IR, RA, RR } from './components/wbplanview';
import type { LocalityField } from './leafletutils';

export const leafletTileServers: RR<
  'baseMaps' | 'overlays',
  IR<L.TileLayer>
> = {
  baseMaps: {
    'OpenStreetMap Standard': L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }
    ),
    'OpenStreetMap Humanitarian': L.tileLayer(
      'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
      {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        subdomains: ['a', 'b'],
      }
    ),
    'OpenStreetMap CyclOSM': L.tileLayer(
      'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
      {
        maxZoom: 20,
        attribution:
          '<a href="https://github.com/cyclosm/cyclosm-cartocss-style/releases" title="CyclOSM - Open Bicycle render">CyclOSM</a> | Map data: {attribution.OpenStreetMap}',
      }
    ),
    'OpenStreetMap Transport': L.tileLayer(
      'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
      {
        maxZoom: 20,
        attribution:
          '<a href="https://github.com/cyclosm/cyclosm-cartocss-style/releases" title="CyclOSM - Open Bicycle render">CyclOSM</a> | Map data: {attribution.OpenStreetMap}',
      }
    ),
    'ESRI: World_Street_Map': L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
      {
        attribution:
          'Esri, HERE, Garmin, USGS, Intermap, INCREMENT P, NRCan, Esri Japan, METI, Esri China (Hong Kong), Esri Korea, Esri (Thailand), NGCC, (c) OpenStreetMap contributors, and the GIS User Community',
      }
    ),
    'ESRI: World_Topo_Map': L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      {
        attribution:
          'Sources: Esri, HERE, Garmin, Intermap, increment P Corp., GEBCO, USGS, FAO, NPS, NRCAN, GeoBase, IGN, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), (c) OpenStreetMap contributors, and the GIS User Community',
      }
    ),
    'ESRI: WorldImagery': L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution:
          'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      }
    ),
    'GeoportailFrance orthos': L.tileLayer(
      'https://wxs.ign.fr/{apikey}/geoportail/wmts?REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&STYLE={style}&TILEMATRIXSET=PM&FORMAT={format}&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}',
      {
        attribution:
          '<a target="_blank" href="https://www.geoportail.gouv.fr/">Geoportail France</a>',
        bounds: [
          [-75, -180],
          [81, 180],
        ],
        minZoom: 2,
        maxZoom: 19,
        // @ts-expect-error
        apikey: 'choisirgeoportail',
        // TODO: get an api key
        format: 'image/jpeg',
        style: 'normal',
      }
    ),
    'USGS USImagery': L.tileLayer(
      'https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 20,
        attribution:
          'Tiles courtesy of the <a href="https://usgs.gov/">U.S. Geological Survey</a>',
      }
    ),
    'NASAGIBS ModisTerraTrueColorCR': L.tileLayer(
      'https://map1.vis.earthdata.nasa.gov/wmts-webmerc/MODIS_Terra_CorrectedReflectance_TrueColor/default/{time}/{tilematrixset}{maxZoom}/{z}/{y}/{x}.{format}',
      {
        attribution:
          'Imagery provided by services from the Global Imagery Browse Services (GIBS), operated by the NASA/GSFC/Earth Science Data and Information System ' +
          '(<a href="https://earthdata.nasa.gov">ESDIS</a>) with funding provided by NASA/HQ.',
        bounds: [
          [-85.051_128_777_6, -179.999_999_975],
          [85.051_128_777_6, 179.999_999_975],
        ],
        minZoom: 1,
        maxZoom: 9,
        // @ts-expect-error
        format: 'jpg',
        time: '',
        tilematrixset: 'GoogleMapsCompatible_Level',
      }
    ),
    'NASAGIBS ModisTerraBands367CR': L.tileLayer(
      'https://map1.vis.earthdata.nasa.gov/wmts-webmerc/MODIS_Terra_CorrectedReflectance_TrueColor/default/{time}/{tilematrixset}{maxZoom}/{z}/{y}/{x}.{format}',
      {
        attribution:
          'Imagery provided by services from the Global Imagery Browse Services (GIBS), operated by the NASA/GSFC/Earth Science Data and Information System ' +
          '(<a href="https://earthdata.nasa.gov">ESDIS</a>) with funding provided by NASA/HQ.',
        bounds: [
          [-85.051_128_777_6, -179.999_999_975],
          [85.051_128_777_6, 179.999_999_975],
        ],
        minZoom: 1,
        maxZoom: 9,
        // @ts-expect-error
        format: 'jpg',
        time: '',
        tilematrixset: 'GoogleMapsCompatible_Level',
      }
    ),
    'NASAGIBS ViirsEarthAtNight2012': L.tileLayer(
      'https://map1.vis.earthdata.nasa.gov/wmts-webmerc/VIIRS_CityLights_2012/default/{time}/{tilematrixset}{maxZoom}/{z}/{y}/{x}.{format}',
      {
        attribution:
          'Imagery provided by services from the Global Imagery Browse Services (GIBS), operated by the NASA/GSFC/Earth Science Data and Information System ' +
          '(<a href="https://earthdata.nasa.gov">ESDIS</a>) with funding provided by NASA/HQ.',
        bounds: [
          [-85.051_128_777_6, -179.999_999_975],
          [85.051_128_777_6, 179.999_999_975],
        ],
        minZoom: 1,
        maxZoom: 8,
        // @ts-expect-error
        format: 'jpg',
        time: '',
        tilematrixset: 'GoogleMapsCompatible_Level',
      }
    ),
    'NASAGIBS ModisTerraLSTDay': L.tileLayer(
      'https://map1.vis.earthdata.nasa.gov/wmts-webmerc/MODIS_Terra_Land_Surface_Temp_Day/default/{time}/{tilematrixset}{maxZoom}/{z}/{y}/{x}.{format}',
      {
        attribution:
          'Imagery provided by services from the Global Imagery Browse Services (GIBS), operated by the NASA/GSFC/Earth Science Data and Information System ' +
          '(<a href="https://earthdata.nasa.gov">ESDIS</a>) with funding provided by NASA/HQ.',
        bounds: [
          [-85.051_128_777_6, -179.999_999_975],
          [85.051_128_777_6, 179.999_999_975],
        ],
        minZoom: 1,
        maxZoom: 7,
        opacity: 0.75,
        // @ts-expect-error
        format: 'png',
        time: '',
        tilematrixset: 'GoogleMapsCompatible_Level',
      }
    ),
    'NASAGIBS ModisTerraAOD': L.tileLayer(
      'https://map1.vis.earthdata.nasa.gov/wmts-webmerc/MODIS_Terra_Aerosol/default/{time}/{tilematrixset}{maxZoom}/{z}/{y}/{x}.{format}',
      {
        attribution:
          'Imagery provided by services from the Global Imagery Browse Services (GIBS), operated by the NASA/GSFC/Earth Science Data and Information System ' +
          '(<a href="https://earthdata.nasa.gov">ESDIS</a>) with funding provided by NASA/HQ.',
        bounds: [
          [-85.051_128_777_6, -179.999_999_975],
          [85.051_128_777_6, 179.999_999_975],
        ],
        minZoom: 1,
        maxZoom: 6,
        opacity: 0.75,
        // @ts-expect-error
        format: 'png',
        time: '',
        tilematrixset: 'GoogleMapsCompatible_Level',
      }
    ),
    'NASAGIBS ModisTerraChlorophyll': L.tileLayer(
      'https://map1.vis.earthdata.nasa.gov/wmts-webmerc/MODIS_Terra_Chlorophyll_A/default/{time}/{tilematrixset}{maxZoom}/{z}/{y}/{x}.{format}',
      {
        attribution:
          'Imagery provided by services from the Global Imagery Browse Services (GIBS), operated by the NASA/GSFC/Earth Science Data and Information System ' +
          '(<a href="https://earthdata.nasa.gov">ESDIS</a>) with funding provided by NASA/HQ.',
        bounds: [
          [-85.051_128_777_6, -179.999_999_975],
          [85.051_128_777_6, 179.999_999_975],
        ],
        minZoom: 1,
        maxZoom: 7,
        opacity: 0.75,
        // @ts-expect-error
        format: 'png',
        time: '',
        tilematrixset: 'GoogleMapsCompatible_Level',
      }
    ),
  },
  overlays: {
    'ESRI: Reference/World_Boundaries_and_Places': L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      {
        attribution:
          'Esri, HERE, Garmin, (c) OpenStreetMap contributors, and the GIS user community',
      }
    ),
    'ESRI: Reference/World_Boundaries_and_Places_Alternate': L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places_Alternate/MapServer/tile/{z}/{y}/{x}',
      {
        attribution:
          'Esri, HERE, Garmin, (c) OpenStreetMap contributors, and the GIS user community',
      }
    ),
    'ESRI: Canvas/World_Dark_Gray_Reference': L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
      {
        attribution:
          'Esri, HERE, Garmin, (c) OpenStreetMap contributors, and the GIS user community\n',
      }
    ),
    'ESRI: Reference/World_Reference_Overlay': L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Reference_Overlay/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: 'Sources: Esri, Garmin, USGS, NPS',
      }
    ),
  },
} as const;

export const coMapTileServers: {
  transparent: boolean;
  layerLabel: string;
}[] = [
  {
    transparent: false,
    layerLabel: 'ESRI: WorldImagery',
  },
  {
    transparent: true,
    layerLabel: 'ESRI: Canvas/World_Dark_Gray_Reference',
  },
];

export const localityColumnsToSearchFor: RA<LocalityField> = [
  'localityname',
  'latitude1',
  'longitude1',
  'latitude2',
  'longitude2',
  'latlongtype',
  'latlongaccuracy',
] as const;

export const requiredLocalityColumns: RA<LocalityField> = [
  'latitude1',
  'longitude1',
] as const;
