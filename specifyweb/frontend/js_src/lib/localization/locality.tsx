/**
 * Localization strings used in Leaflet, GeoLocate and LatLongUI
 *
 * @module
 */

import { createDictionary, header } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

const localityText = createDictionary({
  // Leaflet
  polygonBoundaries: {
    'en-us': 'Polygon Boundaries',
    'ru-ru': 'Границы многоугольника',
    ca: 'Polygon Boundaries',
  },
  errorRadius: {
    'en-us': 'Error Radius',
    'ru-ru': 'Радиус ошибки',
    ca: 'Error Radius',
  },
  showMap: {
    'en-us': 'Show Map',
    'ru-ru': 'Показать карту',
    ca: 'Show Map',
  },
  noCoordinates: {
    'en-us': 'No coordinates',
    'ru-ru': 'Нет координат',
    ca: 'No coordinates',
  },
  notEnoughInformationToMap: {
    'en-us': 'Locality must have coordinates to be mapped.',
    'ru-ru': 'Чтобы нанести на карту, необходимо указать координаты.',
    ca: 'Locality must have coordinates to be mapped.',
  },
  occurrencePoints: {
    'en-us': 'Pins',
    'ru-ru': 'Точки',
    ca: 'Pins',
  },
  occurrencePolygons: {
    'en-us': 'Polygons',
    'ru-ru': 'Полигоны',
    ca: 'Polygons',
  },
  viewRecord: {
    'en-us': 'View Record',
    'ru-ru': 'Открыть запись',
    ca: 'View Record',
  },
  // GeoLocate
  geoLocate: {
    'en-us': 'GEOLocate',
    'ru-ru': 'GEOLocate',
    ca: 'GEOLocate',
  },
  geographyRequiredDialogTitle: {
    'en-us': 'Geography Required',
    'ru-ru': 'Требуется география',
    ca: 'Geography Required',
  },
  geographyRequiredDialogHeader: {
    'en-us': header('Geography must be mapped'),
    'ru-ru': header('География должна быть связана'),
    ca: header('Geography must be mapped'),
  },
  geographyRequiredDialogMessage: {
    'en-us':
      'The GeoLocate plugin requires the geography field to be populated.',
    'ru-ru': 'Плагин GeoLocate требует, чтобы поле географии было заполнено.',
    ca: 'The GeoLocate plugin requires the geography field to be populated.',
  },
  // LatLongUI
  coordinates: {
    'en-us': 'Coordinates',
    'ru-ru': 'Координаты',
    ca: 'Coordinates',
  },
  northWestCorner: {
    'en-us': 'NW Corner',
    'ru-ru': 'СЗ Угол',
    ca: 'NW Corner',
  },
  southEastCorner: {
    'en-us': 'SE Corner',
    'ru-ru': 'ЮВ Угол',
    ca: 'SE Corner',
  },
  // LatLongUI
  coordinateType: {
    'en-us': 'Coordinate Type',
    'ru-ru': 'Тип координат',
    ca: 'Coordinate Type',
  },
  point: {
    'en-us': 'Point',
    'ru-ru': 'Точка',
    ca: 'Point',
  },
  line: {
    'en-us': 'Line',
    'ru-ru': 'Линия',
    ca: 'Line',
  },
  rectangle: {
    'en-us': 'Rectangle',
    'ru-ru': 'Прямоугольник',
    ca: 'Rectangle',
  },
  source: {
    'en-us': 'Source',
    'ru-ru': 'Источник',
    ca: 'Source',
  },
  parsed: {
    'en-us': 'Parsed',
    'ru-ru': 'Проверено',
    ca: 'Parsed',
  },
  latitude: {
    'en-us': 'Latitude',
    'ru-ru': 'Широта',
    ca: 'Latitude',
  },
  longitude: {
    'en-us': 'Longitude',
    'ru-ru': 'Долгота',
    ca: 'Longitude',
  },
  coords: {
    'en-us': 'Coords',
    'ru-ru': 'Координаты',
    ca: 'Coords',
  },
});

export default localityText;
