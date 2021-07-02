import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./utils.tsx before editing this file

const localityText = createDictionary({
  // Leaflet
  geoMap: 'GeoMap',
  polygonBoundaries: (layerName: string): string =>
    `${layerName} Polygon Boundaries`,
  errorRadius: (layerName: string): string => `${layerName} Error Radius`,
  showMap: 'Show Map',
  noCoordinates: 'No coordinates',
  notEnoughInformationToMap: 'Locality must have coordinates to be mapped.',
  occurrencePolygons: (groupName: string)=>
    `${groupName} Polygons`,

  // GeoLocate
  geoLocate: 'GEOLocate',
  geographyMustBeMapped:
    'The GeoLocate plugin requires the geography field to be populated.',

  // LatLongUI
  coordinates: 'Coordinates',
  start: 'Start',
  end: 'End',
  northWestCorner: 'NW Corner',
  southEastCorner: 'SE Corner',
});

export default localityText;
