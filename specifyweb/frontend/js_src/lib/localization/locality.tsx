/**
 * Localization strings used in Leaflet, GeoLocate and LatLongUI
 *
 * @module
 */

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

/* eslint-disable react/jsx-no-literals */
/* eslint-disable @typescript-eslint/naming-convention */
export const localityText = createDictionary({
  // Leaflet
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
  // GeoLocate
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
  // LatLongUI
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
  // LatLongUI
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
  degrees: {
    'en-us': 'DD.DDDD (32.7619)',
    'ru-ru': 'DD.DDDD (32.7619)',
  },
  degreesMinutes: {
    'en-us': 'DD MMMM (32. 45.714)',
    'ru-ru': 'DD MMMM (32. 45.714)',
  },
  degreesMinutesSeconds: {
    'en-us': 'DD MM SS.SS (32 45 42.84)',
    'ru-ru': 'DD MM SS.SS (32 45 42.84)',
  },
  degreesWithDirection: {
    'en-us': 'DD.DDDD N/S/E/W (32.7619 N)',
    'ru-ru': 'DD.DDDD N/S/E/W (32.7619 N)',
  },
  degreesMinutesWithDirection: {
    'en-us': 'DD MM.MM N/S/E/W (32 45.714 N)',
    'ru-ru': 'DD MM.MM N/S/E/W (32 45.714 N)',
  },
  degreesMinutesSecondsWithDirection: {
    'en-us': 'DD MM SS.SS N/S/E/W (32 45 42.84 N)',
    'ru-ru': 'DD MM SS.SS N/S/E/W (32 45 42.84 N)',
  },
});
/* eslint-enable react/jsx-no-literals */
/* eslint-enable @typescript-eslint/naming-convention */
