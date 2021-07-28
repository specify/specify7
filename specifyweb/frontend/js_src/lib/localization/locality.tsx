import { createDictionary, createHeader } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

const localityText = createDictionary({
  // Leaflet
  geoMap: 'GeoMap',
  polygonBoundaries: 'Polygon Boundaries',
  errorRadius: 'Error Radius',
  showMap: 'Show Map',
  noCoordinates: 'No coordinates',
  notEnoughInformationToMap: 'Locality must have coordinates to be mapped.',
  occurrencePoints: 'Pins',
  occurrencePolygons: 'Polygons',
  viewRecord: 'View Record',

  // GeoLocate
  geoLocate: 'GEOLocate',
  geographyRequiredDialogTitle: 'Geography Required',
  geographyRequiredDialogHeader: createHeader('Geography must be mapped'),
  geographyRequiredDialogMessage:
    'The GeoLocate plugin requires the geography field to be populated.',

  // LatLongUI
  coordinates: 'Coordinates',
  start: 'Start',
  end: 'End',
  northWestCorner: 'NW Corner',
  southEastCorner: 'SE Corner',

  // LatLongUI
  coordinateType: 'Coordinate Type',
  point: 'Point',
  line: 'Line',
  rectangle: 'Rectangle',
  source: 'Source',
  parsed: 'Parsed',
  latitude: 'Latitude',
  longitude: 'Longitude',
  coords: 'Coords',
  notApplicable: 'N/A',
});

export default localityText;
