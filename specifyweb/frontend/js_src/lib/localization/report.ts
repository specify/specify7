/**
 * Localization strings used for reports and labels
 *
 * @module
 */

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

export const reportsText = createDictionary({
  label: {
    'en-us': 'Label',
    'ru-ru': 'Этикетка',
    'es-es': 'Etiqueta',
    'fr-fr': 'Étiquette',
    'uk-ua': 'Етикетка',
    'de-ch': 'Etikett',
  },
  labels: {
    'en-us': 'Labels',
    'ru-ru': 'Этикетки',
    'es-es': 'Etiquetas',
    'fr-fr': 'Étiquettes',
    'uk-ua': 'Етикетки',
    'de-ch': 'Etiketten',
  },
  report: {
    'en-us': 'Report',
    'ru-ru': 'Отчет',
    'es-es': 'Informe',
    'fr-fr': 'Rapport',
    'uk-ua': 'Звіт',
    'de-ch': 'Auswertung',
  },
  reports: {
    'en-us': 'Reports',
    'ru-ru': 'Отчеты',
    'es-es': 'Informes',
    'fr-fr': 'Rapports',
    'uk-ua': 'Звіти',
    'de-ch': 'Berichte',
  },
  reportProblems: {
    'en-us': 'Problems with report',
    'ru-ru': 'Проблемы с отчетом',
    'es-es': 'Problemas con el informe',
    'fr-fr': 'Problèmes avec le rapport',
    'uk-ua': 'Проблеми зі звітом',
    'de-ch': 'Probleme mit Bericht',
  },
  reportProblemsDescription: {
    'en-us': 'The selected report has the following problems:',
    'ru-ru': 'В выбранном отчете есть следующие проблемы:',
    'es-es': 'El informe seleccionado tiene los siguientes problemas:',
    'fr-fr': 'Le rapport sélectionné présente les problèmes suivants :',
    'uk-ua': 'Вибраний звіт має такі проблеми:',
    'de-ch': 'Der ausgewählte Bericht hat folgende Probleme:',
  },
  missingAttachments: {
    'en-us': 'Missing attachments',
    'ru-ru': 'Отсутствующие вложения',
    'es-es': 'Adjuntos ausentes',
    'fr-fr': 'Pièces jointes manquantes',
    'uk-ua': 'Відсутні вкладення',
    'de-ch': 'Fehlende Anhänge',
  },
  fix: {
    'en-us': 'Fix',
    'ru-ru': 'Исправить',
    'es-es': 'Reparar',
    'fr-fr': 'Corriger',
    'uk-ua': 'Виправити',
    'de-ch': 'Korrektur',
  },
  chooseFile: {
    'en-us': 'Choose file',
    'ru-ru': 'Выберите файл',
    'es-es': 'Elejir archivo',
    'fr-fr': 'Sélectionner un fichier',
    'uk-ua': 'Виберіть файл',
    'de-ch': 'Datei auswählen',
  },
  reportParameters: {
    'en-us': 'Report Parameters',
    'ru-ru': 'Параметры отчета',
    'es-es': 'Parámetros del informe',
    'fr-fr': 'Paramètres du rapport',
    'uk-ua': 'Параметри звіту',
    'de-ch': 'Parameter des Berichts',
  },
  runReport: {
    'en-us': 'Run Report',
    'ru-ru': 'Запустить репорт',
    'es-es': 'Ejecutar el Informe',
    'fr-fr': 'Effectuer le rapport',
    'uk-ua': 'Запустити звіт',
    'de-ch': 'Bericht ausführen',
  },
  missingReportQuery: {
    'en-us': 'Missing Report Query',
    'ru-ru': 'Отсутствует запрос отчета',
    'es-es': 'Consulta de informe ausente',
    'fr-fr': 'Requête de rapport manquante',
    'uk-ua': 'Відсутній запит звіту',
    'de-ch': 'Fehlende Berichtsabfrage',
  },
  missingReportQueryDescription: {
    'en-us': 'This report does not have an associated query',
    'ru-ru': 'Этот отчет не имеет связанного запроса',
    'es-es': 'Este informe no tiene una consulta asociada',
    'fr-fr': "Ce rapport n'a pas de requête associée",
    'uk-ua': 'Цей звіт не має прив’язаного запиту',
    'de-ch': 'Dieser Bericht hat keine zugehörige Abfrage',
  },
  missingReport: {
    'en-us': 'Missing report',
    'ru-ru': 'Отсутствует отчет',
    'es-es': 'Informe ausente',
    'fr-fr': 'Rapport manquant',
    'uk-ua': 'Відсутній звіт',
    'de-ch': 'Fehlender Bericht',
  },
  missingReportDescription: {
    'en-us': 'Unable to find an SpReport record for this App Resource',
    'ru-ru': 'Не удалось найти запись SpReport для этого ресурса приложения',
    'es-es': `
      No se puede encontrar un registro SpReport para este recurso de aplicación
    `,
    'fr-fr': `
      Impossible de trouver un enregistrement SpReport pour cette ressource
      d'application
    `,
    'uk-ua':
      'Не вдалося знайти запис таблиці SpReport для цього ресурсу програми',
    'de-ch': 'Es kann kein SpReport für diese App-Ressource gefunden werden',
  },
  generateLabel: {
    'en-us': 'Generate label',
    'ru-ru': 'Сгенерировать метку',
    'es-es': 'Generar etiqueta',
    'fr-fr': 'Générer une étiquette',
    'uk-ua': 'Створити етикетку',
    'de-ch': 'Etikett generieren',
  },
  generateLabelOnSave: {
    'en-us': 'Generate label on save',
    'ru-ru': 'Генерировать метку при сохранении',
    'es-es': 'Generar etiqueta al guardar',
    'fr-fr': "Générer une étiquette lors de l'enregistrement",
    'uk-ua': 'Створити етикетку під час збереження',
    'de-ch': 'Etikett beim Speichern generieren',
  },
  generateReport: {
    'en-us': 'Generate report',
    'ru-ru': 'Сгенерировать отчет',
    'es-es': 'Generar informe',
    'fr-fr': 'Générer un rapport',
    'uk-ua': 'Створити звіт',
    'de-ch': 'Bericht generieren',
  },
  generateReportOnSave: {
    'en-us': 'Generate report on save',
    'ru-ru': 'Генерировать отчет при сохранении',
    'es-es': 'Generar informe al guardar',
    'fr-fr': "Générer un rapport lors de l'enregistrement",
    'uk-ua': 'Створити звіт при збереженні',
    'de-ch': 'Bericht beim Speichern generieren',
  },
} as const);
