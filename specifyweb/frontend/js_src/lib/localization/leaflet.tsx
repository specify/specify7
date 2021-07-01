import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./utils.tsx before editing this file

const leafletText = createDictionary({
  geoMap: 'GeoMap',
  polygonBoundaries: (layerName: string): string =>
    `${layerName} Polygon Boundaries`,
  errorRadius: (layerName: string): string => `${layerName} Error Radius`,
  showMap: 'Show Map',
  noCoordinates: 'No coordinates',
  notEnoughInformationToMap: 'Locality must have coordinates to be mapped.',
});

export default leafletText;
