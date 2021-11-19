import { createDictionary, createHeader } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

const localityText = createDictionary({
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
  viewRecord: {
    'en-us': 'View Record',
    'ru-ru': 'Открыть запись',
  },
  // GeoLocate
  geoLocate: {
    'en-us': 'GEOLocate',
    'ru-ru': 'GEOLocate',
  },
  geographyRequiredDialogTitle: {
    'en-us': 'Geography Required',
    'ru-ru': 'Требуется география',
  },
  geographyRequiredDialogHeader: {
    'en-us': createHeader('Geography must be mapped'),
    'ru-ru': createHeader('География должна быть связана'),
  },
  geographyRequiredDialogMessage: {
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
  source: {
    'en-us': 'Source',
    'ru-ru': 'Источник',
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
  coords: {
    'en-us': 'Coords',
    'ru-ru': 'Координаты',
  },
});

export default localityText;
