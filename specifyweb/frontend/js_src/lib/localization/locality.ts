/**
 * Localization strings used in Leaflet, GeoLocate and LatLongUI
 *
 * @module
 */

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

export const localityText = createDictionary({
  openMap: {
    'en-us': 'Open Map',
    'ru-ru': 'Открыть карту',
    'es-es': 'Abrir mapa',
    'fr-fr': 'Ouvrir la carte',
    'uk-ua': 'Відкрийте карту',
  },
  geoMap: {
    'en-us': 'GeoMap',
    'ru-ru': 'Карта',
    'es-es': 'Geomapa',
    'fr-fr': 'GéoCarte',
    'uk-ua': 'Геокарта',
  },
  queryMapSubset: {
    comment: 'Used in GeoMap header while records are still being fetched',
    'en-us': `
      GeoMap - Plotted {plotted:number|formatted} of {total:number|formatted}
      records
    `,
    'ru-ru': `
      Карта - Отображено {plotted:number|formatted} из {total:number|formatted}
      записей
    `,
    'es-es': `
      GeoMap - Registros trazados {plotted:number|formatted} de
      {total:number|formatted}
    `,
    'fr-fr': `
      GéoCarte - Tracé {plotted:number|formatted} de {total:number|formatted}
      enregistrements
    `,
    'uk-ua': `
      GeoMap - нанесено {plotted:number|formatted} із {total:number|formatted}
      записів
    `,
  },
  queryMapAll: {
    'en-us': 'GeoMap - Plotted {plotted:number|formatted} records',
    'ru-ru': 'Карта - Отображено {plotted:number|formatted} записей',
    'es-es': 'GeoMap - Registros trazados {plotted:number|formatted}',
    'fr-fr': 'GéoCarte - {plotted:number|formatted} enregistrements tracés',
    'uk-ua': 'GeoMap - Нанесені записи {plotted:number|formatted}.',
  },
  polygonBoundaries: {
    'en-us': 'Polygon Boundaries',
    'ru-ru': 'Границы многоугольника',
    'es-es': 'Límites de polígono',
    'fr-fr': 'Limites du polygone',
    'uk-ua': 'Межі багатокутників',
  },
  errorRadius: {
    'en-us': 'Error Radius',
    'ru-ru': 'Радиус ошибки',
    'es-es': 'Radio de error',
    'fr-fr': "Rayon d'erreur",
    'uk-ua': 'Радіус помилки',
  },
  showMap: {
    'en-us': 'Show Map',
    'ru-ru': 'Показать карту',
    'es-es': 'Mostrar mapa',
    'fr-fr': 'Afficher la carte',
    'uk-ua': 'Показати карту',
  },
  noCoordinates: {
    'en-us': 'No coordinates',
    'ru-ru': 'Нет координат',
    'es-es': 'sin coordenadas',
    'fr-fr': 'Pas de coordonnées',
    'uk-ua': 'Без координат',
  },
  notEnoughInformationToMap: {
    'en-us': '{localityTable:string} must have coordinates to be mapped.',
    'ru-ru': `
      Чтобы нанести {localityTable:string} на карту, необходимо указать
      координаты.
    `,
    'es-es': '{localityTable:string} debe tener coordenadas para ser mapeado.',
    'fr-fr': `
      {localityTable:string} doit avoir des coordonnées pour être cartographié.
    `,
    'uk-ua': '{localityTable:string} має мати координати для відображення.',
  },
  occurrencePoints: {
    'en-us': 'Pins',
    'ru-ru': 'Точки',
    'es-es': 'Patas',
    'fr-fr': 'Épingles',
    'uk-ua': 'Шпильки',
  },
  occurrencePolygons: {
    'en-us': 'Polygons',
    'ru-ru': 'Полигоны',
    'es-es': 'polígonos',
    'fr-fr': 'Polygones',
    'uk-ua': 'Багатокутники',
  },
  geoLocate: {
    'en-us': 'GEOLocate',
    'ru-ru': 'GEOLocate',
    'es-es': 'GEOlocalizar',
    'fr-fr': 'GEOLocate',
    'uk-ua': 'GEOLocate',
  },
  geographyRequired: {
    'en-us': '{geographyTable:string} must be mapped',
    'ru-ru': '{geographyTable:string} должна быть связана',
    'es-es': '{geographyTable:string} debe estar mapeado',
    'fr-fr': '{geographyTable:string} doit être cartographié',
    'uk-ua': '{geographyTable:string} має бути зіставлено',
  },
  geographyRequiredDescription: {
    'en-us':
      'The GeoLocate plugin requires the geography field to be populated.',
    'ru-ru': 'Плагин GeoLocate требует, чтобы поле географии было заполнено.',
    'es-es': `
      El complemento GeoLocate requiere que se complete el campo de geografía.
    `,
    'fr-fr':
      'Le plug-in GeoLocate nécessite que le champ géographique soit rempli.',
    'uk-ua': 'Плагін GeoLocate вимагає заповнення поля географії.',
  },
  coordinates: {
    'en-us': 'Coordinates',
    'ru-ru': 'Координаты',
    'es-es': 'Coordenadas',
    'fr-fr': 'Coordonnées',
    'uk-ua': 'Координати',
  },
  northWestCorner: {
    comment: 'Represents coordinates. Careful with translation',
    'en-us': 'NW Corner',
    'ru-ru': 'СЗ Угол',
    'es-es': 'Esquina noroeste',
    'fr-fr': 'Coin NO',
    'uk-ua': 'NW Кут',
  },
  southEastCorner: {
    comment: 'Represents coordinates. Careful with translation',
    'en-us': 'SE Corner',
    'ru-ru': 'ЮВ Угол',
    'es-es': 'Esquina SE',
    'fr-fr': 'Coin SE',
    'uk-ua': 'SE Кут',
  },
  coordinateType: {
    'en-us': 'Coordinate Type',
    'ru-ru': 'Тип координат',
    'es-es': 'Tipo de coordenadas',
    'fr-fr': 'Type de coordonnées',
    'uk-ua': 'Тип координат',
  },
  point: {
    'en-us': 'Point',
    'ru-ru': 'Точка',
    'es-es': 'Punto',
    'fr-fr': 'Point',
    'uk-ua': 'точка',
  },
  line: {
    'en-us': 'Line',
    'ru-ru': 'Линия',
    'es-es': 'Línea',
    'fr-fr': 'Ligne',
    'uk-ua': 'лінія',
  },
  rectangle: {
    'en-us': 'Rectangle',
    'ru-ru': 'Прямоугольник',
    'es-es': 'Rectángulo',
    'fr-fr': 'Rectangle',
    'uk-ua': 'Прямокутник',
  },
  parsed: {
    'en-us': 'Parsed',
    'ru-ru': 'Проверено',
    'es-es': 'analizado',
    'fr-fr': 'analysé',
    'uk-ua': 'Проаналізовано',
  },
  latitude: {
    'en-us': 'Latitude',
    'ru-ru': 'Широта',
    'es-es': 'Latitud',
    'fr-fr': 'Latitude',
    'uk-ua': 'Широта',
  },
  longitude: {
    'en-us': 'Longitude',
    'ru-ru': 'Долгота',
    'es-es': 'Longitud',
    'fr-fr': 'Longitude',
    'uk-ua': 'Довгота',
  },
  toggleFullScreen: {
    'en-us': 'Toggle Full Screen',
    'ru-ru': 'Включить полноэкранный режим',
    'es-es': 'Alternar pantalla completa',
    'fr-fr': 'Basculer en plein écran',
    'uk-ua': 'Перемкнути повний екран',
  },
  degrees: {
    'en-us': 'DD.DDDD (32.7619)',
    'ru-ru': 'DD.DDDD (32.7619)',
    'es-es': 'DD.DDDD (32.7619)',
    'fr-fr': 'DD.dddd (32.7619)',
    'uk-ua': 'DD.DDDD (32,7619)',
  },
  degreesMinutes: {
    'en-us': 'DD MMMM (32. 45.714)',
    'ru-ru': 'DD MMMM (32. 45.714)',
    'es-es': 'DDMMMM (32. 45.714)',
    'fr-fr': 'DD MMMM (32. 45.714)',
    'uk-ua': 'ДД ММММ (32. 45.714)',
  },
  degreesMinutesSeconds: {
    'en-us': 'DD MM SS.SS (32 45 42.84)',
    'ru-ru': 'DD MM SS.SS (32 45 42.84)',
    'es-es': 'DD MM SS.SS (32 45 42,84)',
    'fr-fr': 'DD MM SS.ss (32 45 42.84)',
    'uk-ua': 'ДД ММ СС.СС (32 45 42,84)',
  },
  degreesWithDirection: {
    'en-us': 'DD.DDDD N/S/E/W (32.7619 N)',
    'ru-ru': 'DD.DDDD N/S/E/W (32.7619 N)',
    'es-es': 'DD.DDDD N/S/E/O (32.7619 N)',
    'fr-fr': 'DD.dddd N/S/E/O (32,7619 N)',
    'uk-ua': 'DD.DDDD Пн/Пд/З/З (32,7619 Пн)',
  },
  degreesMinutesWithDirection: {
    'en-us': 'DD MM.MM N/S/E/W (32 45.714 N)',
    'ru-ru': 'DD MM.MM N/S/E/W (32 45.714 N)',
    'es-es': 'DD MM.MM N/S/E/O (32 45.714 N)',
    'fr-fr': 'DD MM.mm N/S/E/O (32 45.714 N)',
    'uk-ua': 'ДД ММ.ХМ Пн/Пд/В/З (32 45,714 Пн)',
  },
  degreesMinutesSecondsWithDirection: {
    'en-us': 'DD MM SS.SS N/S/E/W (32 45 42.84 N)',
    'ru-ru': 'DD MM SS.SS N/S/E/W (32 45 42.84 N)',
    'es-es': 'DD MM SS.SS N/S/E/W (32 45 42,84 N)',
    'fr-fr': 'DD MM SS.ss N/S/E/O (32 45 42.84 N)',
    'uk-ua': 'DD MM SS.SS N/S/E/W (32 45 42.84 N)',
  },
} as const);
