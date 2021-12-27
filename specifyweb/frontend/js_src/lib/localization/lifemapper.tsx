import { createDictionary, createJsxHeader } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

const lifemapperText = createDictionary({
  specifyNetwork: {
    'en-us': 'Specify Network (opens in new tab)',
    'ru-ru': 'Specify Network (открывается в новой вкладке)',
    ca: 'Specify Network (opens in new tab)',
  },
  speciesDistributionMap: {
    'en-us': 'Species Distribution Map',
    'ru-ru': 'Карта распространения вида',
    ca: 'Species Distribution Map',
  },
  markerLayerLabel: {
    'en-us': 'Your Database Pins',
    'ru-ru': 'Точки из вашей базы данных',
    ca: 'Your Database Pins',
  },
  polygonLayerLabel: {
    'en-us': 'Your Database Polygons',
    'ru-ru': 'Полигоны из вашей базы данных',
    ca: 'Your Database Polygons',
  },
  polygonBoundaryLayerLabel: {
    'en-us': 'Your Database Polygon Boundaries',
    'ru-ru': 'Границы полигонов из вашей базы данных',
    ca: 'Your Database Polygon Boundaries',
  },
  leafletDetailsHeader: {
    'en-us': 'Legend',
    'ru-ru': 'Legend',
    ca: 'Legend',
  },
  leafletDetailsErrorsHeader: {
    'en-us': 'Lifemapper:',
    'ru-ru': 'Lifemapper:',
    ca: 'Lifemapper:',
  },
  gbif: {
    'en-us': 'GBIF:',
    'ru-ru': 'GBIF:',
    ca: 'GBIF:',
  },
  projectionNotFound: {
    'en-us': 'No Distribution Model available.',
    'ru-ru': 'Модель распространения недоступна.',
    ca: 'No Distribution Model available.',
  },
  modelCreationData: {
    'en-us': 'Дата создания модели:',
    'ru-ru': 'Model Created:',
    ca: 'Дата создания модели:',
  },
  projection: {
    'en-us': 'Lifemapper Distribution Model',
    'ru-ru': 'Модель распространения Lifemapper',
    ca: 'Lifemapper Distribution Model',
  },
  occurrencePoints: {
    'en-us': 'GBIF Occurrence Points',
    'ru-ru': 'GBIF Точки встречаемость вида',
    ca: 'GBIF Occurrence Points',
  },
  overLimitMessage: {
    'en-us': (limit: number) => `Only the first ${limit} specimens are shown`,
    'ru-ru': (limit: number) => `Показаны только первые ${limit} точки`,
    ca: (limit: number) => `Only the first ${limit} specimens are shown`,
  },
  errorsOccurred: {
    'en-us': 'The following errors occurred while trying to display the map:',
    'ru-ru': 'Ошибки произошли при попытке отобразить карту:',
    ca: 'The following errors occurred while trying to display the map:',
  },
  noMap: {
    'en-us': 'Failed to find a projection map',
    'ru-ru': 'Не удалось найти карту проекции',
    ca: 'Failed to find a projection map',
  },
  failedToOpenPopUpDialogTitle: {
    'en-us': 'Failed to open the page',
    'ru-ru: 'Не удалось открыть страницу',
    ca: "No s'ha pogut obrir la pàgina",
  },
  failedToOpenPopUpDialogHeader: {
    'en-us': createJsxHeader('Failed to open Specify Network Page'),
    'ru-ru': createJsxHeader('Не удалось открыть страницу Specify Network');,
    ca: createJsxheader("No s'ha pogut obrir la pàgina de Specify Network"),
  },
  failedToOpenPopUpDialogMessage: {
    'en-us':`
      Please make sure your browser is not blocking pop-up windows and
      try again
    `,
    'ru-ru': `
      Убедитесь, что ваш браузер не блокирует всплывающие окна, и
      повторите попытку.
    `,
    ca: `
      Assegureu-vos que el vostre navegador no bloqueja les finestres
      emergents i torneu-ho a provar
    `,
  }
});

export default lifemapperText;
