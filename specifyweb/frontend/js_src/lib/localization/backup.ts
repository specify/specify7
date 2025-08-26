/**
 * Localization strings used by Backup UI and notifications
 *
 * @module
 */

import { createDictionary } from "./utils";

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

export const backupText = createDictionary({
  completed: {
    "en-us": "Backup completed successfully.",
    "de-ch": "",
    "es-es": "",
    "fr-fr": "",
    "pt-br": "",
    "ru-ru": "",
    "uk-ua": "Резервне копіювання успішно завершено.",
  },
  failed: {
    "en-us": "Backup failed.",
    "de-ch": "",
    "es-es": "",
    "fr-fr": "",
    "pt-br": "",
    "ru-ru": "",
    "uk-ua": "Не вдалося створити резервну копію.",
  },
  previousFound: {
    "en-us": "A previous backup was found:",
    "de-ch": "",
    "es-es": "",
    "fr-fr": "",
    "pt-br": "",
    "ru-ru": "",
    "uk-ua": "Знайдено попередню резервну копію:",
  },
  previousNone: {
    "en-us": "No previous backup was found. Start a new one?",
    "de-ch": "",
    "es-es": "",
    "fr-fr": "",
    "pt-br": "",
    "ru-ru": "",
    "uk-ua": "Попередньої резервної копії не знайдено. Розпочати нову?",
  },
  previousSizeMB: {
    "en-us": "({size:string} MB)",
    "de-ch": "",
    "es-es": "",
    "fr-fr": "",
    "pt-br": "",
    "ru-ru": "",
    "uk-ua": "({size:string} МБ)",
  },
  lastBackupOn: {
    "en-us": "This backup was created on {date:string}",
    "de-ch": "",
    "es-es": "",
    "fr-fr": "",
    "pt-br": "",
    "ru-ru": "",
    "uk-ua": "Цю резервну копію було створено {date:string}",
  },
  checkPreviousFailed: {
    "en-us": "Failed to check previous backup.",
    "de-ch": "",
    "es-es": "",
    "fr-fr": "",
    "pt-br": "",
    "ru-ru": "",
    "uk-ua": "Не вдалося перевірити попередню резервну копію.",
  },
  startFailed: {
    "en-us": "Backup start failed.",
    "de-ch": "",
    "es-es": "",
    "fr-fr": "",
    "pt-br": "",
    "ru-ru": "",
    "uk-ua": "Не вдалося запустити резервне копіювання.",
  },
  databaseBackupCompleted: {
    "en-us": "Database backup completed.",
    "de-ch": "",
    "es-es": "",
    "fr-fr": "",
    "pt-br": "",
    "ru-ru": "",
    "uk-ua": "Резервне копіювання бази даних завершено.",
  },
  databaseBackupFailed: {
    "en-us": "Database backup failed.",
    "de-ch": "",
    "es-es": "",
    "fr-fr": "",
    "pt-br": "",
    "ru-ru": "",
    "uk-ua": "Не вдалося створити резервну копію бази даних.",
  },
  compressing: {
    "en-us": "Compressing...",
    "de-ch": "",
    "es-es": "",
    "fr-fr": "",
    "pt-br": "",
    "ru-ru": "",
    "uk-ua": "Стиснення...",
  },
} as const);
