import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

const lifemapperText = createDictionary({
  specifyNetwork: {
    'en-us': 'Specify Network (opens in new tab)',
    'ru-ru': 'Specify Network (открывается в новой вкладке)',
  },
  speciesDistributionMap: {
    'en-us': 'Species Distribution Map',
    'ru-ru': 'Карта распространения вида',
  },
  markerLayerLabel: {
    'en-us': 'Your Database Pins',
    'ru-ru': 'Точки из вашей базы данных',
  },
  polygonLayerLabel: {
    'en-us': 'Your Database Polygons',
    'ru-ru': 'Полигоны из вашей базы данных',
  },
  polygonBoundaryLayerLabel: {
    'en-us': 'Your Database Polygon Boundaries',
    'ru-ru': 'Границы полигонов из вашей базы данных',
  },
  leafletDetailsHeader: {
    'en-us': 'Legend',
    'ru-ru': 'Legend',
  },
  leafletDetailsErrorsHeader: {
    'en-us': 'Lifemapper:',
    'ru-ru': 'Lifemapper:',
  },
  gbif: {
    'en-us': 'GBIF:',
    'ru-ru': 'GBIF:',
  },
  projectionNotFound: {
    'en-us': 'No Distribution Model available.',
    'ru-ru': 'Модель распространения недоступна.',
  },
  modelCreationData: {
    'en-us': 'Дата создания модели:',
    'ru-ru': 'Model Created:',
  },
  projection: {
    'en-us': 'Lifemapper Distribution Model',
    'ru-ru': 'Модель распространения Lifemapper',
  },
  occurrencePoints: {
    'en-us': 'GBIF Occurrence Points',
    'ru-ru': 'GBIF Точки встречаемость вида',
  },
  overLimitMessage: {
    'en-us': (limit: number) => `Only the first ${limit} specimens are shown`,
    'ru-ru': (limit: number) => `Показаны только первые ${limit} точки`,
  },
  errorsOccurred: {
    'en-us': 'The following errors occurred while trying to display the map:',
    'ru-ru': 'Ошибки произошли при попытке отобразить карту:',
  },
  noMap: {
    'en-us': 'Failed to find a projection map',
    'ru-ru': 'Не удалось найти карту проекции',
  },
});

export default lifemapperText;
