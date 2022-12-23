/**
 * Localization strings used in Leaflet, GeoLocate and LatLongUI
 *
 * @module
 */

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

export const reportsText = createDictionary({
  label: {
    'en-us': 'Label',
    'ru-ru': 'Этикетка',
  },
  labels: {
    'en-us': 'Labels',
    'ru-ru': 'Этикетки',
  },
  report: {
    'en-us': 'Report',
    'ru-ru': 'Отчет',
  },
  reports: {
    'en-us': 'Reports',
    'ru-ru': 'Отчеты',
  },
  reportProblems: {
    'en-us': 'Problems with report',
    'ru-ru': 'Проблемы с отчетом',
  },
  reportProblemsDescription: {
    'en-us': 'The selected report has the following problems:',
    'ru-ru': 'В выбранном отчете есть следующие проблемы:',
  },
  missingAttachments: {
    'en-us': 'Missing attachments',
    'ru-ru': 'Отсутствующие вложения',
  },
  fix: {
    'en-us': 'Fix',
    'ru-ru': 'Исправить',
  },
  chooseFile: {
    'en-us': 'Choose file',
    'ru-ru': 'Выберите файл',
  },
  reportParameters: {
    'en-us': 'Report Parameters',
    'ru-ru': 'Параметры отчета',
  },
  runReport: {
    'en-us': 'Run Report',
    'ru-ru': 'Запустить репорт',
  },
  missingReportQuery: {
    'en-us': 'Missing Report Query',
    'ru-ru': 'Отсутствует запрос отчета',
  },
  missingReportQueryDescription: {
    'en-us': 'This report does not have an associated query',
    'ru-ru': 'Этот отчет не имеет связанного запроса',
  },
  missingReport: {
    'en-us': 'Missing report',
    'ru-ru': 'Отсутствует отчет',
  },
  missingReportDescription: {
    'en-us': 'Unable to find an SpReport record for this App Resource',
    'ru-ru': 'Не удалось найти запись SpReport для этого ресурса приложения',
  },
  generateLabel: {
    'en-us': 'Generate label',
    'ru-ru': 'Сгенерировать метку',
  },
  generateLabelOnSave: {
    'en-us': 'Generate label on save',
    'ru-ru': 'Генерировать метку при сохранении',
  },
  generateReport: {
    'en-us': 'Generate report',
    'ru-ru': 'Сгенерировать отчет',
  },
  generateReportOnSave: {
    'en-us': 'Generate report on save',
    'ru-ru': 'Генерировать отчет при сохранении',
  },
} as const);
