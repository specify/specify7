/**
 * Strings used by developer tools and error messages. Low priority for
 * localization
 *
 * @module
 */

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

export const developmentText = createDictionary({
  crashReportVisualizer: {
    'en-us': 'Crash Report Visualizer',
    'es-es': 'Visualizador de informes de bloqueo',
    'fr-fr': "Visualiseur de rapport d'incident",
    'ru-ru': 'Визуализатор отчетов о сбоях',
    'uk-ua': 'Візуалізатор звітів про збої',
  },
  downloadAsHtml: {
    'en-us': 'Download as HTML',
    'es-es': 'Descargar como HTML',
    'fr-fr': 'Télécharger au format HTML',
    'ru-ru': 'Скачать как HTML',
    'uk-ua': 'Завантажити як HTML',
  },
  details: {
    'en-us': 'Details',
    'es-es': 'Detalles',
    'fr-fr': 'Des détails',
    'ru-ru': 'Подробности',
    'uk-ua': 'Подробиці',
  },
} as const);
