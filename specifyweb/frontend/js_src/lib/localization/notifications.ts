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
    'de-ch': 'Mitteilungen',
    'pt-br': 'Notificações',
  },
  notificationsCount: {
    comment: 'Used for button label in the top menu',
    'en-us': 'Notifications: {count:number|formatted}',
    'ru-ru': 'Уведомлений: {count:number|formatted}',
    'es-es': 'Notificaciones: {count:number|formatted}',
    'fr-fr': 'Notifications : {count:number|formatted}',
    'uk-ua': 'Сповіщення: {count:number|formatted}',
    'de-ch': 'Mitteilungen: {count:number|formatted}',
    'pt-br': 'Notificações: {count:number|formatted}',
  },
  notificationsLoading: {
    comment: `
      Used for button label in the top menu when notification count is loading
    `,
    'en-us': 'Notifications: …',
    'ru-ru': 'Уведомлений: …',
    'es-es': 'Notificaciones: …',
    'fr-fr': 'Notifications : …',
    'uk-ua': 'Сповіщення: …',
    'de-ch': 'Mitteilungen: …',
    'pt-br': 'Notificações: …',
  },
  mostRecentNotificationsTop: {
    'en-us': '(Ordered from most recent to the oldest.)',
    'ru-ru': '(В порядке от самого последнего к самому старому.)',
    'es-es': '(Ordenados del más reciente al más antiguo.)',
    'fr-fr': '(Classé du plus récent au plus ancien.)',
    'uk-ua': '(У порядку від останнього до найстарішого.)',
    'de-ch': '(Geordnet von neu zu alt)',
    'pt-br': '(Ordenados do mais recente para o mais antigo.)',
  },
  exception: {
    comment: 'Used as a label for a button that downloads the error message',
    'en-us': 'Error',
    'ru-ru': 'Ошибка',
    'es-es': 'Excepción',
    'fr-fr': 'Notifications : …',
    'uk-ua': 'Помилка',
    'de-ch': 'Fehler',
    'pt-br': 'Erro',
  },
  download: {
    'en-us': 'Download',
    'ru-ru': 'Скачать',
    'es-es': 'Descarga',
    'fr-fr': 'Télécharger',
    'uk-ua': 'Завантажити',
    'de-ch': 'Herunterladen',
    'pt-br': 'Download',
  },
  feedItemUpdated: {
    'en-us': 'RSS Export feed has been updated.',
    'ru-ru': 'Элемент фида экспорта обновлен.',
    'es-es': 'Elemento de fuente de datos para exportación actualizado.',
    'fr-fr': "Le flux d'exportation RSS a été mis à jour.",
    'uk-ua': 'Стрічку експорту RSS оновлено.',
    'de-ch': 'Der RSS-Export-Feed wurde aktualisiert.',
    'pt-br': 'O feed de exportação RSS foi atualizado.',
  },
  updateFeedFailed: {
    'en-us': 'Export feed update failed.',
    'ru-ru': 'Не удалось обновить экспортный канал.',
    'es-es': 'Actualización de fuente de datos para exportación fallida.',
    'fr-fr': "La mise à jour du flux d'exportation a échoué.",
    'uk-ua': 'Не вдалося експортувати оновлення каналу.',
    'de-ch': 'Die Aktualisierung des Export-Feeds ist fehlgeschlagen.',
    'pt-br': 'Falha na atualização do feed de exportação.',
  },
  dwcaExportCompleted: {
    'en-us': 'DwCA export completed.',
    'ru-ru': 'Экспорт в DwCA завершен.',
    'es-es': 'Se ha completado la exportación de DwCA.',
    'fr-fr': 'Exportation DwCA terminée.',
    'uk-ua': 'Експорт DwCA завершено.',
    'de-ch': 'Der DwCA-Export wurde abgeschlossen.',
    'pt-br': 'Exportação do DwCA concluída.',
  },
  dwcaExportFailed: {
    'en-us': 'DwCA export failed.',
    'ru-ru': 'Не удалось экспортировать DwCA.',
    'es-es': 'Falló la exportación de DwCA.',
    'fr-fr': "L'exportation DwCA a échoué.",
    'uk-ua': 'Помилка експорту DwCA.',
    'de-ch': 'Der DwCA-Export ist fehlgeschlagen.',
    'pt-br': 'Falha na exportação do DwCA.',
  },
  queryExportToCsvCompleted: {
    'en-us': 'Query export to CSV completed.',
    'ru-ru': 'Экспорт запроса в CSV завершен.',
    'es-es': 'Se ha completado la Exportación de la consulta a un CSV.',
    'fr-fr': 'Exportation de la requête au format CSV terminée.',
    'uk-ua': 'Експорт запиту в CSV завершено.',
    'de-ch': 'Der Abfrageexport nach CSV wurde abgeschlossen.',
    'pt-br': 'Exportação de consulta para CSV concluída.',
  },
  queryExportToKmlCompleted: {
    'en-us': 'Query export to KML completed.',
    'ru-ru': 'Экспорт запроса в KML завершен.',
    'es-es': 'Se ha completado la Exportación de la consulta a un KML.',
    'fr-fr': 'Exportation de la requête vers KML terminée.',
    'uk-ua': 'Експорт запиту в KML завершено.',
    'de-ch': 'Der Abfrageexport nach KML wurde abgeschlossen.',
    'pt-br': 'Exportação de consulta para KML concluída.',
  },
  dataSetOwnershipTransferred: {
    'en-us':
      '<userName /> transferred the ownership of the <dataSetName /> dataset to you.',
    'ru-ru':
      '<userName /> передал вам право собственности на набор данных <dataSetName />.',
    'es-es':
      '<userName /> te transfirió la propiedad del conjunto de datos <dataSetName />.',
    'fr-fr':
      "<userName /> vous a transféré la propriété de l'ensemble de données <dataSetName />.",
    'uk-ua':
      '<userName /> передав вам право власності на набір даних <dataSetName />.',
    'de-ch':
      '<userName /> hat Ihnen die Eigentümerschaft des Datensatzes <dataSetName /> übertragen.',
    'pt-br':
      '<userName /> transferiu a propriedade do conjunto de dados <dataSetName /> para você.',
  },
} as const);
