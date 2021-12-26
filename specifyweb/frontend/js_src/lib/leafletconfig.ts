/**
 * TileServers and WMS servers that Leaflet should use as well as configuration
 * for which fields to display in the pop-up bubbles
 *
 * @module
 *
 */

import type { IR, RA, RR } from './types';
import type { MappingPath } from './components/wbplanviewmapper';
import L from './leafletextend';

export const leafletLayersEndpoint =
  'https://files.specifysoftware.org/specify7/7.6.0/leaflet-layers.json';

/**
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
 *
 */
export const leafletTileServers: RR<
  'baseMaps' | 'overlays',
  IR<L.TileLayer>
> = {
  baseMaps: {
    'Street Map (OpenStreetMap)': L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright"' +
          ' target="_blank">OpenStreetMap</a> contributors',
      }
    ),
    'Street Map (ESRI)': L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 23,
        attribution:
          'Esri, HERE, Garmin, USGS, Intermap, INCREMENT P, NRCan, Esri Japan, METI, Esri China (Hong Kong), Esri Korea, Esri (Thailand), NGCC, (c) OpenStreetMap contributors, and the GIS User Community',
      }
    ),
    'Topographic Map (ESRI)': L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 23,
        attribution:
          'Sources: Esri, HERE, Garmin, Intermap, increment P Corp., GEBCO, USGS, FAO, NPS, NRCAN, GeoBase, IGN, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), (c) OpenStreetMap contributors, and the GIS User Community',
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
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 23,
        attribution:
          'Esri, HERE, Garmin, (c) OpenStreetMap contributors, and the GIS user community\n',
      }
    ),
  },
} as const;

export const preferredBaseLayer = 'Satellite Map (ESRI)';
export const preferredOverlay = 'Labels and boundaries';

/* These fields should be present for locality to be mappable */
export const requiredLocalityColumns: RA<string> = [
  'locality.latitude1',
  'locality.longitude1',
] as const;

export const mappingLocalityColumns: RA<string> = [
  ...requiredLocalityColumns,
  'locality.latitude2',
  'locality.longitude2',
  'locality.latlongtype',
  'locality.latlongaccuracy',
];

/**
 * The fields to display in a Leaflet pin's pop-up box
 * `pathToRelationship` is a mappingPath that shows how to get from
 * the table that contains the field to the locality table and vice versa.
 * To-many relationships in `pathToRelationship` should be represented as '#1'
 * `pathToFields` is an array of mappingPaths that shows a path to a field
 * Both `pathToRelationship` and each `pathToFields` should begin with the
 * same table name.
 * The order of fields in this array would determine the order in the pop-up
 * window
 */
export type LocalityPinFields = {
  readonly pathToRelationship: MappingPath;
  readonly pathsToFields: RA<MappingPath>;
};

/**
 * Applies only to the Leaflet map on the Locality form and the CO
 *  Lifemapper badge.
 * Defined the maximum number of -to-many records to fetch at any point of the
 *   mapping path.
 * Leaflet map in the workbench does not have such limit.
 */
export const MAX_TO_MANY_INDEX = 10;

/**
 * NOTE:
 * Leaflet map on the Locality form and the CO Lifemapper badge is going
 * to display `$rank > fullname` for a single rank that is attached to a given
 * record, instead of `$rank > name` for each rank specified in this definition.
 *
 * Similarly, those maps are going to display `agent > fullname`, instead of
 * `agent > lastname`
 *
 */
export const localityPinFields: RA<LocalityPinFields> = [
  {
    pathToRelationship: ['collectionobject', 'collectingevent', 'locality'],
    pathsToFields: [
      ['collectionobject', 'determinations', '#1', 'taxon', '$Genus', 'name'],
      ['collectionobject', 'determinations', '#1', 'taxon', '$Species', 'name'],
      [
        'collectionobject',
        'determinations',
        '#1',
        'taxon',
        '$Subspecies',
        'name',
      ],
      ['collectionobject', 'catalognumber'],
      ['collectionobject', 'fieldnumber'],
    ],
  },
  {
    pathToRelationship: ['locality', 'collectingevents', '#1'],
    pathsToFields: [
      [
        'locality',
        'collectingevents',
        '#1',
        'collectionobjects',
        '#1',
        'determinations',
        '#1',
        'taxon',
        '$Genus',
        'name',
      ],
      [
        'locality',
        'collectingevents',
        '#1',
        'collectionobjects',
        '#1',
        'determinations',
        '#1',
        'taxon',
        '$Species',
        'name',
      ],
      [
        'locality',
        'collectingevents',
        '#1',
        'collectionobjects',
        '#1',
        'determinations',
        '#1',
        'taxon',
        '$Subspecies',
        'name',
      ],
      [
        'locality',
        'collectingevents',
        '#1',
        'collectionobjects',
        '#1',
        'catalognumber',
      ],
      ['locality', 'collectingevents', '#1', 'stationfieldnumber'],
      [
        'locality',
        'collectingevents',
        '#1',
        'collectionobjects',
        '#1',
        'fieldnumber',
      ],
      [
        'locality',
        'collectingevents',
        '#1',
        'collectors',
        '#1',
        'agent',
        'lastname',
      ],
      ['locality', 'collectingevents', '#1', 'startdate'],
    ],
  },
  {
    pathToRelationship: ['locality'],
    pathsToFields: [
      ['locality', 'localityname'],
      ['locality', 'latitude1'],
      ['locality', 'longitude1'],
      ['locality', 'latitude2'],
      ['locality', 'longitude2'],
      ['locality', 'latlongtype'],
      ['locality', 'latlongaccuracy'],
      ['locality', 'geography', '$Country', 'name'],
      ['locality', 'geography', '$State', 'name'],
      ['locality', 'geography', '$County', 'name'],
    ],
  },
  {
    pathToRelationship: ['collectingevent', 'locality'],
    pathsToFields: [
      ['collectingevent', 'collectors', '#1', 'agent', 'lastname'],
      ['collectingevent', 'startdate'],
      ['collectingevent', 'stationfieldnumber'],
    ],
  },
];
