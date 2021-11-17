import { createDictionary, createHeader } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

const localityText = createDictionary({
  // Leaflet
  polygonBoundaries: {
    'en-us': 'Polygon Boundaries',
    'ru-ru': 'Polygon Boundaries',
  },
  errorRadius: {
    'en-us': 'Error Radius',
    'ru-ru': 'Error Radius',
  },
  showMap: {
    'en-us': 'Show Map',
    'ru-ru': 'Show Map',
  },
  noCoordinates: {
    'en-us': 'No coordinates',
    'ru-ru': 'No coordinates',
  },
  notEnoughInformationToMap: {
    'en-us': 'Locality must have coordinates to be mapped.',
    'ru-ru': 'Locality must have coordinates to be mapped.',
  },
  occurrencePoints: {
    'en-us': 'Pins',
    'ru-ru': 'Pins',
  },
  occurrencePolygons: {
    'en-us': 'Polygons',
    'ru-ru': 'Polygons',
  },
  viewRecord: {
    'en-us': 'View Record',
    'ru-ru': 'View Record',
  },
  // GeoLocate
  geoLocate: {
    'en-us': 'GEOLocate',
    'ru-ru': 'GEOLocate',
  },
  geographyRequiredDialogTitle: {
    'en-us': 'Geography Required',
    'ru-ru': 'Geography Required',
  },
  geographyRequiredDialogHeader: {
    'en-us': createHeader('Geography must be mapped'),
    'ru-ru': createHeader('Geography must be mapped'),
  },
  geographyRequiredDialogMessage: {
    'en-us':
      'The GeoLocate plugin requires the geography field to be populated.',
    'ru-ru':
      'The GeoLocate plugin requires the geography field to be populated.',
  },
  // LatLongUI
  coordinates: {
    'en-us': 'Coordinates',
    'ru-ru': 'Coordinates',
  },
  northWestCorner: {
    'en-us': 'NW Corner',
    'ru-ru': 'NW Corner',
  },
  southEastCorner: {
    'en-us': 'SE Corner',
    'ru-ru': 'SE Corner',
  },
  // LatLongUI
  coordinateType: {
    'en-us': 'Coordinate Type',
    'ru-ru': 'Coordinate Type',
  },
  point: {
    'en-us': 'Point',
    'ru-ru': 'Point',
  },
  line: {
    'en-us': 'Line',
    'ru-ru': 'Line',
  },
  rectangle: {
    'en-us': 'Rectangle',
    'ru-ru': 'Rectangle',
  },
  source: {
    'en-us': 'Source',
    'ru-ru': 'Source',
  },
  parsed: {
    'en-us': 'Parsed',
    'ru-ru': 'Parsed',
  },
  latitude: {
    'en-us': 'Latitude',
    'ru-ru': 'Latitude',
  },
  longitude: {
    'en-us': 'Longitude',
    'ru-ru': 'Longitude',
  },
  coords: {
    'en-us': 'Coords',
    'ru-ru': 'Coords',
  },
});

export default localityText;
