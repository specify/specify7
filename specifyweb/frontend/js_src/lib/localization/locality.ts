/**
 * Localization strings used in Leaflet, GeoLocate and LatLongUI
 *
 * @module
 */

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

export const localityText = createDictionary({
  polygonBoundaries: {
    'en-us': 'Polygon Boundaries',
    'ru-ru': 'Границы многоугольника',
  },
  errorRadius: {
    'en-us': 'Error Radius',
    'ru-ru': 'Радиус ошибки',
  },
  showMap: {
    'en-us': 'Show Map',
    'ru-ru': 'Показать карту',
  },
  noCoordinates: {
    'en-us': 'No coordinates',
    'ru-ru': 'Нет координат',
  },
  notEnoughInformationToMap: {
    'en-us': 'Locality must have coordinates to be mapped.',
    'ru-ru': 'Чтобы нанести на карту, необходимо указать координаты.',
  },
  occurrencePoints: {
    'en-us': 'Pins',
    'ru-ru': 'Точки',
  },
  occurrencePolygons: {
    'en-us': 'Polygons',
    'ru-ru': 'Полигоны',
  },
  geoLocate: {
    'en-us': 'GEOLocate',
    'ru-ru': 'GEOLocate',
  },
  geographyRequiredDialogHeader: {
    'en-us': 'Geography must be mapped',
    'ru-ru': 'География должна быть связана',
  },
  geographyRequiredDialogText: {
    'en-us':
      'The GeoLocate plugin requires the geography field to be populated.',
    'ru-ru': 'Плагин GeoLocate требует, чтобы поле географии было заполнено.',
  },
  coordinates: {
    'en-us': 'Coordinates',
    'ru-ru': 'Координаты',
  },
  northWestCorner: {
    'en-us': 'NW Corner',
    'ru-ru': 'СЗ Угол',
  },
  southEastCorner: {
    'en-us': 'SE Corner',
    'ru-ru': 'ЮВ Угол',
  },
  coordinateType: {
    'en-us': 'Coordinate Type',
    'ru-ru': 'Тип координат',
  },
  point: {
    'en-us': 'Point',
    'ru-ru': 'Точка',
  },
  line: {
    'en-us': 'Line',
    'ru-ru': 'Линия',
  },
  rectangle: {
    'en-us': 'Rectangle',
    'ru-ru': 'Прямоугольник',
  },
  parsed: {
    'en-us': 'Parsed',
    'ru-ru': 'Проверено',
  },
  latitude: {
    'en-us': 'Latitude',
    'ru-ru': 'Широта',
  },
  longitude: {
    'en-us': 'Longitude',
    'ru-ru': 'Долгота',
  },
  toggleFullScreen: {
    'en-us': 'Toggle Full Screen',
    'ru-ru': 'Включить полноэкранный режим',
  },
} as const);
