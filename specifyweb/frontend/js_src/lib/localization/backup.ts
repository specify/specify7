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
    "de-ch": "Sicherung erfolgreich abgeschlossen.",
    "es-es": "Copia de seguridad completada exitosamente.",
    "fr-fr": "La sauvegarde a été effectuée avec succès.",
    "pt-br": "Backup concluído com sucesso.",
    "ru-ru": "Резервное копирование успешно завершено.",
    "uk-ua": "Резервне копіювання успішно завершено.",
  },
  failed: {
    "en-us": "Backup failed.",
    "de-ch": "Sicherung fehlgeschlagen.",
    "es-es": "La copia de seguridad falló.",
    "fr-fr": "La sauvegarde a échoué.",
    "pt-br": "Falha no backup.",
    "ru-ru": "Резервное копирование не удалось.",
    "uk-ua": "Не вдалося створити резервну копію.",
  },
  previousFound: {
    "en-us": "A previous backup was found:",
    "de-ch": "Es wurde eine vorherige Sicherung gefunden:",
    "es-es": "Se encontró una copia de seguridad anterior:",
    "fr-fr": "Une sauvegarde précédente a été trouvée :",
    "pt-br": "Um backup anterior foi encontrado:",
    "ru-ru": "Найдена предыдущая резервная копия:",
    "uk-ua": "Знайдено попередню резервну копію:",
  },
  previousNone: {
    "en-us": "No previous backup was found. Start a new one?",
    "de-ch": "Es wurde kein vorheriges Backup gefunden. Ein neues starten?",
    "es-es":
      "No se encontró ninguna copia de seguridad anterior. ¿Quieres iniciar una nueva?",
    "fr-fr":
      "Aucune sauvegarde précédente n'a été trouvée. Voulez-vous en créer une nouvelle ?",
    "pt-br": "Nenhum backup anterior foi encontrado. Iniciar um novo?",
    "ru-ru": "Предыдущая резервная копия не найдена. Создать новую?",
    "uk-ua": "Попередньої резервної копії не знайдено. Розпочати нову?",
  },
  previousSizeMB: {
    "en-us": "({size:string} MB)",
    "de-ch": "({size:string} MB)",
    "es-es": "({size:string} MB)",
    "fr-fr": "({size:string} Mo)",
    "pt-br": "({size:string} MB)",
    "ru-ru": "({size:string} МБ)",
    "uk-ua": "({size:string} МБ)",
  },
  lastBackupOn: {
    "en-us": "This backup was created on {date:string}",
    "de-ch": "Dieses Backup wurde erstellt auf {date:string}",
    "es-es": "Esta copia de seguridad se creó el {date:string}",
    "fr-fr": "Cette sauvegarde a été créée le {date:string}",
    "pt-br": "Este backup foi criado em {date:string}",
    "ru-ru": "Эта резервная копия была создана {date:string}",
    "uk-ua": "Цю резервну копію було створено {date:string}",
  },
  checkPreviousFailed: {
    "en-us": "Failed to check previous backup.",
    "de-ch": "Die vorherige Sicherung konnte nicht überprüft werden.",
    "es-es": "No se pudo comprobar la copia de seguridad anterior.",
    "fr-fr": "Échec de la vérification de la sauvegarde précédente.",
    "pt-br": "Falha ao verificar o backup anterior.",
    "ru-ru": "Не удалось проверить предыдущую резервную копию.",
    "uk-ua": "Не вдалося перевірити попередню резервну копію.",
  },
  startFailed: {
    "en-us": "Backup start failed.",
    "de-ch": "Der Start der Sicherung ist fehlgeschlagen.",
    "es-es": "Error al iniciar la copia de seguridad.",
    "fr-fr": "Le démarrage de la sauvegarde a échoué.",
    "pt-br": "Falha ao iniciar o backup.",
    "ru-ru": "Резервный запуск не удался.",
    "uk-ua": "Не вдалося запустити резервне копіювання.",
  },
  databaseBackupCompleted: {
    "en-us": "Database backup completed.",
    "de-ch": "Datenbanksicherung abgeschlossen.",
    "es-es": "Copia de seguridad de la base de datos completada.",
    "fr-fr": "Sauvegarde de la base de données terminée.",
    "pt-br": "Backup do banco de dados concluído.",
    "ru-ru": "Резервное копирование базы данных завершено.",
    "uk-ua": "Резервне копіювання бази даних завершено.",
  },
  databaseBackupFailed: {
    "en-us": "Database backup failed.",
    "de-ch": "Datenbanksicherung fehlgeschlagen.",
    "es-es": "Error en la copia de seguridad de la base de datos.",
    "fr-fr": "La sauvegarde de la base de données a échoué.",
    "pt-br": "Falha no backup do banco de dados.",
    "ru-ru": "Сбой резервного копирования базы данных.",
    "uk-ua": "Не вдалося створити резервну копію бази даних.",
  },
  compressing: {
    "en-us": "Compressing...",
    "de-ch": "Komprimieren...",
    "es-es": "Apresamiento...",
    "fr-fr": "Compression...",
    "pt-br": "Comprimindo...",
    "ru-ru": "Сжатие...",
    "uk-ua": "Стиснення...",
  },
} as const);
