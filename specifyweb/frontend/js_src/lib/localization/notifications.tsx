/**
 * Localization strings used for notifications
 *
 * @module
 */

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

export const notificationsText = createDictionary({
  notifications: {
    'en-us': 'Notifications: {count:string}',
    'ru-ru': 'Уведомлений: {count:string}',
  },
  notificationsLoading: {
    'en-us': 'Notifications: ...',
    'ru-ru': 'Уведомлений: ...',
  },
  mostRecentNotificationsTop: {
    'en-us': '(Ordered from most recent to the oldest.)',
    'ru-ru': '(В порядке от самого последнего к самому старому.)',
  },
  exception: {
    'en-us': 'Exception',
    'ru-ru': 'Трассировка стека',
  },
  download: {
    'en-us': 'Download',
    'ru-ru': 'Скачать',
  },
  notificationsDialogTitle: {
    'en-us': 'Notifications',
    'ru-ru': 'Уведомления',
  },
  feedItemUpdated: {
    'en-us': 'RSS Export feed has been updated.',
    'ru-ru': 'Элемент фида экспорта обновлен.',
  },
  updateFeedFailed: {
    'en-us': 'Export feed update failed.',
    'ru-ru': 'Не удалось обновить экспортный канал.',
  },
  dwcaExportCompleted: {
    'en-us': 'DwCA export completed.',
    'ru-ru': 'Экспорт в DwCA завершен.',
  },
  dwcaExportFailed: {
    'en-us': 'DwCA export failed.',
    'ru-ru': 'Не удалось экспортировать DwCA.',
  },
  queryExportToCsvCompleted: {
    'en-us': 'Query export to CSV completed.',
    'ru-ru': 'Экспорт запроса в CSV завершен.',
  },
  queryExportToKmlCompleted: {
    'en-us': 'Query export to KML completed.',
    'ru-ru': 'Экспорт запроса в KML завершен.',
  },
  dataSetOwnershipTransferred: {
    'en-us': `
      <userName /> transferred the ownership of the <dataSetName /> dataset to
      you.
    `,
    'ru-ru': `
      <userName /> передал вам право собственности на набор данных
      <dataSetName />.
    `,
  },
} as const);
