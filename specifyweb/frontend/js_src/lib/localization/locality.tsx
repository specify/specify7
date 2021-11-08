import { createDictionary, createHeader } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

const localityText = createDictionary({
  // Leaflet
  polygonBoundaries: {
    'en-us': 'Polygon Boundaries',
  },
  errorRadius: {
    'en-us': 'Error Radius',
  },
  showMap: {
    'en-us': 'Show Map',
  },
  noCoordinates: {
    'en-us': 'No coordinates',
  },
  notEnoughInformationToMap: {
    'en-us': 'Locality must have coordinates to be mapped.',
  },
  occurrencePoints: {
    'en-us': 'Pins',
  },
  occurrencePolygons: {
    'en-us': 'Polygons',
  },
  viewRecord: {
    'en-us': 'View Record',
  },
  // GeoLocate
  geoLocate: {
    'en-us': 'GEOLocate',
  },
  geographyRequiredDialogTitle: {
    'en-us': 'Geography Required',
  },
  geographyRequiredDialogHeader: {
    'en-us': createHeader('Geography must be mapped'),
  },
  geographyRequiredDialogMessage: {
    'en-us':
      'The GeoLocate plugin requires the geography field to be populated.',
  },
  // LatLongUI
  coordinates: {
    'en-us': 'Coordinates',
  },
  northWestCorner: {
    'en-us': 'NW Corner',
  },
  southEastCorner: {
    'en-us': 'SE Corner',
  },
  // LatLongUI
  coordinateType: {
    'en-us': 'Coordinate Type',
  },
  point: {
    'en-us': 'Point',
  },
  line: {
    'en-us': 'Line',
  },
  rectangle: {
    'en-us': 'Rectangle',
  },
  source: {
    'en-us': 'Source',
  },
  parsed: {
    'en-us': 'Parsed',
  },
  latitude: {
    'en-us': 'Latitude',
  },
  longitude: {
    'en-us': 'Longitude',
  },
  coords: {
    'en-us': 'Coords',
  },
});

export default localityText;
