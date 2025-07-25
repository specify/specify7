/**
 * Strings used by developer tools and error messages. Low priority for
 * localization
 *
 * @module
 */

import { createDictionary } from "./utils";

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

export const developmentText = createDictionary({
  crashReportVisualizer: {
    "en-us": "Crash Report Visualizer",
    "es-es": "Visualizador los informes de errores",
    "fr-fr": "Visualiseur de rapport d'incident",
    "uk-ua": "Візуалізатор звітів про збої",
    "de-ch": "Crash Report Visualizer",
    "ru-ru": "Визуализатор отчетов о сбоях",
    "pt-br": "Visualizador de Relatório de Falhas",
  },
  downloadAsHtml: {
    "en-us": "Download as HTML",
    "es-es": "Descargar en formato HTML",
    "fr-fr": "Télécharger au format HTML",
    "ru-ru": "Загрузить как HTML",
    "uk-ua": "Завантажити як HTML",
    "de-ch": "Als HTML-Datei herunterladen",
    "pt-br": "Baixar como HTML",
  },
  details: {
    "en-us": "Details",
    "es-es": "Más información",
    "fr-fr": "Informations",
    "ru-ru": "Подробности",
    "uk-ua": "Подробиці",
    "de-ch": "Details",
    "pt-br": "Detalhes",
  },
} as const);
