/**
 * Localization strings used in Leaflet, GeoLocate and LatLongUI
 *
 * @module
 */

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

const localityText = createDictionary({
  // Leaflet
  polygonBoundaries: {
    'en-us': 'Polygon Boundaries',
    'ru-ru': 'Границы многоугольника',
    ca: 'Polygon Boundaries',
    'es-es': 'Polygon Boundaries',
  },
  errorRadius: {
    'en-us': 'Error Radius',
    'ru-ru': 'Радиус ошибки',
    ca: 'Error Radius',
    'es-es': 'Error Radius',
  },
  showMap: {
    'en-us': 'Show Map',
    'ru-ru': 'Показать карту',
    ca: 'Show Map',
    'es-es': 'Show Map',
  },
  noCoordinates: {
    'en-us': 'No coordinates',
    'ru-ru': 'Нет координат',
    ca: 'No coordinates',
    'es-es': 'No coordinates',
  },
  notEnoughInformationToMap: {
    'en-us': 'Locality must have coordinates to be mapped.',
    'ru-ru': 'Чтобы нанести на карту, необходимо указать координаты.',
    ca: 'Locality must have coordinates to be mapped.',
    'es-es': 'Locality must have coordinates to be mapped.',
  },
  occurrencePoints: {
    'en-us': 'Pins',
    'ru-ru': 'Точки',
    ca: 'Pins',
    'es-es': 'Pins',
  },
  occurrencePolygons: {
    'en-us': 'Polygons',
    'ru-ru': 'Полигоны',
    ca: 'Polygons',
    'es-es': 'Polygons',
  },
  // GeoLocate
  geoLocate: {
    'en-us': 'GEOLocate',
    'ru-ru': 'GEOLocate',
    ca: 'GEOLocate',
    'es-es': 'GEOLocate',
  },
  geographyRequiredDialogTitle: {
    'en-us': 'Geography Required',
    'ru-ru': 'Требуется география',
    ca: 'Geography Required',
    'es-es': 'Geography Required',
  },
  geographyRequiredDialogHeader: {
    'en-us': 'Geography must be mapped',
    'ru-ru': 'География должна быть связана',
    ca: 'Geography must be mapped',
    'es-es': 'Geography must be mapped',
  },
  geographyRequiredDialogMessage: {
    'en-us':
      'The GeoLocate plugin requires the geography field to be populated.',
    'ru-ru': 'Плагин GeoLocate требует, чтобы поле географии было заполнено.',
    ca: 'The GeoLocate plugin requires the geography field to be populated.',
    'es-es':
      'The GeoLocate plugin requires the geography field to be populated.',
  },
  // LatLongUI
  coordinates: {
    'en-us': 'Coordinates',
    'ru-ru': 'Координаты',
    ca: 'Coordinates',
    'es-es': 'Coordinates',
  },
  northWestCorner: {
    'en-us': 'NW Corner',
    'ru-ru': 'СЗ Угол',
    ca: 'NW Corner',
    'es-es': 'NW Corner',
  },
  southEastCorner: {
    'en-us': 'SE Corner',
    'ru-ru': 'ЮВ Угол',
    ca: 'SE Corner',
    'es-es': 'SE Corner',
  },
  // LatLongUI
  coordinateType: {
    'en-us': 'Coordinate Type',
    'ru-ru': 'Тип координат',
    ca: 'Coordinate Type',
    'es-es': 'Coordinate Type',
  },
  point: {
    'en-us': 'Point',
    'ru-ru': 'Точка',
    ca: 'Point',
    'es-es': 'Point',
  },
  line: {
    'en-us': 'Line',
    'ru-ru': 'Линия',
    ca: 'Line',
    'es-es': 'Line',
  },
  rectangle: {
    'en-us': 'Rectangle',
    'ru-ru': 'Прямоугольник',
    ca: 'Rectangle',
    'es-es': 'Rectangle',
  },
  parsed: {
    'en-us': 'Parsed',
    'ru-ru': 'Проверено',
    ca: 'Parsed',
    'es-es': 'Parsed',
  },
  latitude: {
    'en-us': 'Latitude',
    'ru-ru': 'Широта',
    ca: 'Latitude',
    'es-es': 'Latitude',
  },
  longitude: {
    'en-us': 'Longitude',
    'ru-ru': 'Долгота',
    ca: 'Longitude',
    'es-es': 'Longitude',
  },
  toggleFullScreen: {
    'en-us': 'Toggle Full Screen',
    'ru-ru': 'Включить полноэкранный режим',
    ca: 'Commuta la pantalla completa',
    'es-es': 'Toggle Full Screen',
  },
});

export default localityText;
