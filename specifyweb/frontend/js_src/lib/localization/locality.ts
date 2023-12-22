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
    'de-ch': 'Karte öffnen',
  },
  geoMap: {
    'en-us': 'GeoMap',
    'ru-ru': 'Карта',
    'es-es': 'GeoMap',
    'fr-fr': 'GéoCarte',
    'uk-ua': 'Геокарта',
    'de-ch': 'Karte',
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
      GeoMap - Trazado {plotted:number|formatted} de {total:number|formatted}
      registros
    `,
    'fr-fr': `
      GéoCarte - Tracé {plotted:number|formatted} de {total:number|formatted}
      enregistrements
    `,
    'uk-ua': `
      GeoMap - нанесено {plotted:number|formatted} із {total:number|formatted}
      записів
    `,
    'de-ch': `
      GeoMap hat {plotted:number|formatted} von {total:number|formatted}
      Datensätzen gezeichnet
    `,
  },
  queryMapAll: {
    'en-us': 'GeoMap - Plotted {plotted:number|formatted} records',
    'ru-ru': 'Карта - Отображено {plotted:number|formatted} записей',
    'es-es': 'GeoMap - {plotted:number|formatted} registros trazados',
    'fr-fr': 'GéoCarte - {plotted:number|formatted} enregistrements tracés',
    'uk-ua': 'GeoMap - Нанесені записи {plotted:number|formatted}.',
    'de-ch': 'GeoMap hat {plotted:number|formatted} Datensätze gezeichnet',
  },
  polygonBoundaries: {
    'en-us': 'Polygon Boundaries',
    'ru-ru': 'Границы многоугольника',
    'es-es': 'Límites de polígono',
    'fr-fr': 'Limites du polygone',
    'uk-ua': 'Межі багатокутників',
    'de-ch': 'Polygon-Grenzen',
  },
  errorRadius: {
    'en-us': 'Error Radius',
    'ru-ru': 'Радиус ошибки',
    'es-es': 'Radio de error',
    'fr-fr': "Rayon d'erreur",
    'uk-ua': 'Радіус помилки',
    'de-ch': 'Fehlerradius',
  },
  showMap: {
    'en-us': 'Show Map',
    'ru-ru': 'Показать карту',
    'es-es': 'Mostrar mapa',
    'fr-fr': 'Afficher la carte',
    'uk-ua': 'Показати карту',
    'de-ch': 'Karte anzeigen',
  },
  noCoordinates: {
    'en-us': 'No coordinates',
    'ru-ru': 'Нет координат',
    'es-es': 'Sin coordenadas',
    'fr-fr': 'Pas de coordonnées',
    'uk-ua': 'Без координат',
    'de-ch': 'Keine Koordinaten',
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
    'de-ch': `
      {localityTable:string} muss Koordinaten haben, um kartiert werden zu
      können.
    `,
  },
  occurrencePoints: {
    'en-us': 'Pins',
    'ru-ru': 'Точки',
    'es-es': 'Chinchetas',
    'fr-fr': 'Épingles',
    'uk-ua': 'Шпильки',
    'de-ch': 'Stecknadeln',
  },
  occurrencePolygons: {
    'en-us': 'Polygons',
    'ru-ru': 'Полигоны',
    'es-es': 'Polígonos',
    'fr-fr': 'Polygones',
    'uk-ua': 'Багатокутники',
    'de-ch': 'Polygone',
  },
  geoLocate: {
    'en-us': 'GEOLocate',
    'ru-ru': 'GEOLocate',
    'es-es': 'GEOLocate',
    'fr-fr': 'GEOLocate',
    'uk-ua': 'GEOLocate',
    'de-ch': 'GEO Lokalisierung',
  },
  geographyRequired: {
    'en-us': '{geographyTable:string} must be mapped',
    'ru-ru': '{geographyTable:string} должна быть связана',
    'es-es': '{geographyTable:string} debe ser mapeado',
    'fr-fr': '{geographyTable:string} doit être cartographié',
    'uk-ua': '{geographyTable:string} має бути зіставлено',
    'de-ch': '{geographyTable:string} muss kartiert werden',
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
    'de-ch': `
      Das GeoLocate-Plugin erfordert, dass das Koordinaten-Feld eingegeben wird.
    `,
  },
  coordinates: {
    'en-us': 'Coordinates',
    'ru-ru': 'Координаты',
    'es-es': 'Coordenadas',
    'fr-fr': 'Coordonnées',
    'uk-ua': 'Координати',
    'de-ch': 'Koordinaten',
  },
  northWestCorner: {
    comment: 'Represents coordinates. Careful with translation',
    'en-us': 'NW Corner',
    'ru-ru': 'СЗ Угол',
    'es-es': 'Esquina NO',
    'fr-fr': 'Coin NO',
    'uk-ua': 'NW Кут',
    'de-ch': 'NW-Ecke',
  },
  southEastCorner: {
    comment: 'Represents coordinates. Careful with translation',
    'en-us': 'SE Corner',
    'ru-ru': 'ЮВ Угол',
    'es-es': 'Esquina SE',
    'fr-fr': 'Coin SE',
    'uk-ua': 'SE Кут',
    'de-ch': 'SO-Ecke',
  },
  coordinateType: {
    'en-us': 'Coordinate Type',
    'ru-ru': 'Тип координат',
    'es-es': 'Tipo de coordenada',
    'fr-fr': 'Type de coordonnées',
    'uk-ua': 'Тип координат',
    'de-ch': 'Koordinatentyp',
  },
  point: {
    'en-us': 'Point',
    'ru-ru': 'Точка',
    'es-es': 'Punto',
    'fr-fr': 'Point',
    'uk-ua': 'точка',
    'de-ch': 'Punkt',
  },
  line: {
    'en-us': 'Line',
    'ru-ru': 'Линия',
    'es-es': 'Línea',
    'fr-fr': 'Ligne',
    'uk-ua': 'лінія',
    'de-ch': 'Linie',
  },
  rectangle: {
    'en-us': 'Rectangle',
    'ru-ru': 'Прямоугольник',
    'es-es': 'Rectángulo',
    'fr-fr': 'Rectangle',
    'uk-ua': 'Прямокутник',
    'de-ch': 'Rechteck',
  },
  parsed: {
    'en-us': 'Parsed',
    'ru-ru': 'Проверено',
    'es-es': 'Procesado',
    'fr-fr': 'analysé',
    'uk-ua': 'Проаналізовано',
    'de-ch': 'Geparst',
  },
  latitude: {
    'en-us': 'Latitude',
    'ru-ru': 'Широта',
    'es-es': 'Latitud',
    'fr-fr': 'Latitude',
    'uk-ua': 'Широта',
    'de-ch': 'Breitengrad',
  },
  longitude: {
    'en-us': 'Longitude',
    'ru-ru': 'Долгота',
    'es-es': 'Longitud',
    'fr-fr': 'Longitude',
    'uk-ua': 'Довгота',
    'de-ch': 'Längengrad',
  },
  toggleFullScreen: {
    'en-us': 'Toggle Full Screen',
    'ru-ru': 'Включить полноэкранный режим',
    'es-es': 'Cambiar a pantalla completa',
    'fr-fr': 'Basculer en plein écran',
    'uk-ua': 'Перемкнути повний екран',
    'de-ch': 'Vollbildmodus',
  },
  degrees: {
    'en-us': 'DD.DDDD (32.7619)',
    'ru-ru': 'DD.DDDD (32.7619)',
    'es-es': 'GG.GGGG (32.7619)',
    'fr-fr': 'DD.dddd (32.7619)',
    'uk-ua': 'DD.DDDD (32,7619)',
    'de-ch': 'DD.DDDD (32.7619)',
  },
  degreesMinutes: {
    'en-us': 'DD MMMM (32. 45.714)',
    'ru-ru': 'DD MMMM (32. 45.714)',
    'es-es': 'GG MMMM (32. 45.714)',
    'fr-fr': 'DD MMMM (32. 45.714)',
    'uk-ua': 'ДД ММММ (32. 45.714)',
    'de-ch': 'DD MMMM (32. 45.714)',
  },
  degreesMinutesSeconds: {
    'en-us': 'DD MM SS.SS (32 45 42.84)',
    'ru-ru': 'DD MM SS.SS (32 45 42.84)',
    'es-es': 'GG MM SS.SS (32 45 42.84)',
    'fr-fr': 'DD MM SS.ss (32 45 42.84)',
    'uk-ua': 'ДД ММ СС.СС (32 45 42,84)',
    'de-ch': 'DD MM SS.SS (32 45 42.84)',
  },
  degreesWithDirection: {
    'en-us': 'DD.DDDD N/S/E/W (32.7619 N)',
    'ru-ru': 'DD.DDDD N/S/E/W (32.7619 N)',
    'es-es': 'GG.GGGG N/S/E/O (32.7619 N)',
    'fr-fr': 'DD.dddd N/S/E/O (32,7619 N)',
    'uk-ua': 'DD.DDDD Пн/Пд/З/З (32,7619 Пн)',
    'de-ch': 'DD.DDDD N/S/O/W (32.7619 N)',
  },
  degreesMinutesWithDirection: {
    'en-us': 'DD MM.MM N/S/E/W (32 45.714 N)',
    'ru-ru': 'DD MM.MM N/S/E/W (32 45.714 N)',
    'es-es': 'GG MM.MM N/S/E/O (32 45.714 N)',
    'fr-fr': 'DD MM.mm N/S/E/O (32 45.714 N)',
    'uk-ua': 'ДД ММ.ХМ Пн/Пд/В/З (32 45,714 Пн)',
    'de-ch': 'DD MM.MM N/S/O/W (32 45.714 N)',
  },
  degreesMinutesSecondsWithDirection: {
    'en-us': 'DD MM SS.SS N/S/E/W (32 45 42.84 N)',
    'ru-ru': 'DD MM SS.SS N/S/E/W (32 45 42.84 N)',
    'es-es': 'GG MM SS.SS N/S/E/W (32 45 42.84 N)',
    'fr-fr': 'DD MM SS.ss N/S/E/O (32 45 42.84 N)',
    'uk-ua': 'DD MM SS.SS N/S/E/W (32 45 42.84 N)',
    'de-ch': 'DD MM SS.SS N/S/O/W (32 45 42.84 N)',
  },
} as const);
