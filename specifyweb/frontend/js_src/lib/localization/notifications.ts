/**
 * Localization strings used for notifications
 *
 * @module
 */

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

export const notificationsText = createDictionary({
  notifications: {
    'en-us': 'Notifications',
    'ru-ru': 'Уведомления',
    'es-es': 'Notificaciones',
    'fr-fr': 'Notifications',
    'uk-ua': 'Сповіщення',
  },
  notificationsCount: {
    comment: 'Used for button label in the top menu',
    'en-us': 'Notifications: {count:number|formatted}',
    'ru-ru': 'Уведомлений: {count:number|formatted}',
    'es-es': 'Notificaciones: {count:number|formatted}',
    'fr-fr': 'Notifications : {count:number|formatted}',
    'uk-ua': 'Сповіщення: {count:number|formatted}',
  },
  notificationsLoading: {
    comment: `
      Used for button label in the top menu when notification count is loading
    `,
    'en-us': 'Notifications: …',
    'ru-ru': 'Уведомлений: …',
    'es-es': 'Notificaciones: …',
    'fr-fr': 'Notifications : …',
    'uk-ua': 'Сповіщення: …',
  },
  mostRecentNotificationsTop: {
    'en-us': '(Ordered from most recent to the oldest.)',
    'ru-ru': '(В порядке от самого последнего к самому старому.)',
    'es-es': '(Ordenados del más reciente al más antiguo.)',
    'fr-fr': '(De la plus récente à la plus ancienne.)',
    'uk-ua': '(У порядку від останнього до найстарішого.)',
  },
  exception: {
    comment: 'Used as a label for a button that downloads the error message',
    'en-us': 'Error',
    'ru-ru': 'Ошибка',
    'es-es': 'Error',
    'fr-fr': 'Erreur',
    'uk-ua': 'Помилка',
  },
  download: {
    'en-us': 'Download',
    'ru-ru': 'Скачать',
    'es-es': 'Descargar',
    'fr-fr': 'Télécharger',
    'uk-ua': 'Завантажити',
  },
  feedItemUpdated: {
    'en-us': 'RSS Export feed has been updated.',
    'ru-ru': 'Элемент фида экспорта обновлен.',
    'es-es': 'Se ha actualizado el feed RSS Export.',
    'fr-fr': "Le flux d'export RSS a été mis à jour.",
    'uk-ua': 'Стрічку експорту RSS оновлено.',
  },
  updateFeedFailed: {
    'en-us': 'Export feed update failed.',
    'ru-ru': 'Не удалось обновить экспортный канал.',
    'es-es': 'Error al exportar actualizaciones de canales.',
    'fr-fr': "la mise à jour du flux d'export a échoué",
    'uk-ua': 'Не вдалося експортувати оновлення каналу.',
  },
  dwcaExportCompleted: {
    'en-us': 'DwCA export completed.',
    'ru-ru': 'Экспорт в DwCA завершен.',
    'es-es': 'Exportación de DwCA completada.',
    'fr-fr': 'Exportation DwCA terminée.',
    'uk-ua': 'Експорт DwCA завершено.',
  },
  dwcaExportFailed: {
    'en-us': 'DwCA export failed.',
    'ru-ru': 'Не удалось экспортировать DwCA.',
    'es-es': 'No se pudo exportar DwCA.',
    'fr-fr': "Échec de l'exportation DwCA.",
    'uk-ua': 'Помилка експорту DwCA.',
  },
  queryExportToCsvCompleted: {
    'en-us': 'Query export to CSV completed.',
    'ru-ru': 'Экспорт запроса в CSV завершен.',
    'es-es': 'La exportación de la solicitud a CSV está completa.',
    'fr-fr': 'Exportation de la requête vers CSV terminée.',
    'uk-ua': 'Експорт запиту в CSV завершено.',
  },
  queryExportToKmlCompleted: {
    'en-us': 'Query export to KML completed.',
    'ru-ru': 'Экспорт запроса в KML завершен.',
    'es-es': 'Exportación de consultas a KML completada.',
    'fr-fr': 'Exportation de la requête vers KML terminée.',
    'uk-ua': 'Експорт запиту в KML завершено.',
  },
  dataSetOwnershipTransferred: {
    'en-us': `
      <userName /> transferred the ownership of the <dataSetName /> dataset to
      you.
    `,
    'ru-ru': `
      <userName /> передал вам право собственности на набор данных <dataSetName
      />.
    `,
    'es-es': `
      <userName /> te transfirió la propiedad del conjunto de datos <dataSetName
      />.
    `,
    'fr-fr': `
      <userName /> vous a transféré la propriété du jeu de données <dataSetName
      />.
    `,
    'uk-ua': `
      <userName /> передав вам право власності на набір даних <dataSetName />.
    `,
  },
} as const);
