/**
 * Localization strings used for displaying Attachments
 *
 * @module
 */

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

export const attachmentsText = createDictionary({
  attachments: {
    'en-us': 'Attachments',
    'ru-ru': 'Вложения',
    'es-es': 'Archivos adjuntos',
    'fr-fr': 'Pièces jointes',
    'uk-ua': 'Прикріплення',
    'de-ch': 'Anhänge',
  },
  scale: {
    'en-us': 'Scale',
    'ru-ru': 'Масштаб',
    'es-es': 'Escala',
    'fr-fr': 'Échelle',
    'uk-ua': 'масштаб',
    'de-ch': 'Massstab',
  },
  attachmentServerUnavailable: {
    'en-us': 'Attachment server unavailable',
    'ru-ru': 'Сервер прикрепленных файлов недоступен',
    'es-es': 'Servidor de adjuntos no disponible.',
    'fr-fr': 'Serveur de pièces jointes indisponible',
    'uk-ua': 'Сервер прикріплень недоступний',
    'de-ch': 'Attachment-Server nicht verfügbar',
  },
  attachmentServerUnavailableDescription: {
    'en-us': 'Setup your attachment server',
    'es-es': 'Configura tu servidor de archivos adjuntos',
    'fr-fr': 'Configurez votre serveur de pièces jointes',
    'ru-ru': 'Настройте свой сервер вложений',
    'uk-ua': 'Налаштуйте сервер прикріплень',
    'de-ch': 'Richten Sie Ihren Attachment-Server ein',
  },
  orderBy: {
    'en-us': 'Order By',
    'ru-ru': 'Сортировать по',
    'es-es': 'ordenar por',
    'fr-fr': 'Trier par',
    'uk-ua': 'Сортувати по',
    'de-ch': 'Sortiere nach',
  },
  uploadingInline: {
    'en-us': 'Uploading…',
    'ru-ru': 'Закачивание…',
    'es-es': 'Cargando…',
    'fr-fr': 'Envoi en cours…',
    'uk-ua': 'Завантаження…',
    'de-ch': 'Am Hochladen…',
  },
  noAttachments: {
    'en-us': 'There are no attachments',
    'ru-ru': 'В вашей коллекции нет вложений',
    'es-es': 'No hay adjuntos',
    'fr-fr': "Il n'y a pas de pièces jointes",
    'uk-ua': 'Прикріплень нема',
    'de-ch': 'Es gibt keine Anhänge',
  },
  unableToFindRelatedRecord: {
    'en-us': 'Unable to find related record',
    'es-es': 'No se puede encontrar el registro relacionado',
    'fr-fr': "Impossible de trouver l'enregistrement associé",
    'ru-ru': 'Не удалось найти связанную запись',
    'uk-ua': 'Неможливо знайти відповідний запис',
    'de-ch': 'Verknüpfter Datensatz kann nicht gefunden werden',
  },
  unableToFindRelatedRecordDescription: {
    'en-us': 'Unable to find a record that this attachment is related to.',
    'es-es': `
      No se ha podido encontrar un registro con el que esté relacionado este
      adjunto.
    `,
    'fr-fr': `
      Impossible de trouver un enregistrement auquel cette pièce jointe est
      liée.
    `,
    'ru-ru': 'Не удалось найти запись, к которой относится это вложение.',
    'uk-ua': 'Не вдалося знайти запис, до якого відноситься це вкладення.',
    'de-ch': `
      Es konnte kein Datensatz gefunden werden, auf den sich dieser Anhang
      bezieht.
    `,
  },
  showForm: {
    'en-us': 'Show Form',
    'es-es': 'Mostrar el formulario',
    'fr-fr': 'Afficher le formulaire',
    'ru-ru': 'Показать форму',
    'uk-ua': 'Показати форму',
    'de-ch': 'Formular anzeigen',
  },
  attachmentHaltLimit: {
    'en-us':
      'No attachments have been found in the first {halt:number} records.',
    'de-ch':
      'In den ersten {halt:number}-Datensätzen wurden keine Anhänge gefunden.',
    'es-es': `
      No se han encontrado archivos adjuntos en los primeros registros
      {halt:number}.
    `,
    'fr-fr': `
      Aucune pièce jointe n'a été trouvée dans les premiers enregistrements
      {halt:number}.
    `,
    'ru-ru': 'В первых записях {halt:number} вложений не обнаружено.',
    'uk-ua': 'У перших записах {halt:number} вкладень не знайдено.',
  },
  fetchNextAttachments: {
    'en-us': 'Look for more attachments',
    'de-ch': 'Suchen Sie nach weiteren Anhängen',
    'es-es': 'Busque más archivos adjuntos',
    'fr-fr': 'Rechercher plus de pièces jointes',
    'ru-ru': 'Ищите больше вложений',
    'uk-ua': 'Шукайте більше вкладень',
  },
  hideForm: {
    'en-us': 'Hide Form',
    'de-ch': 'Formular ausblenden',
    'es-es': 'Ocultar formulario',
    'fr-fr': 'Masquer le formulaire',
    'ru-ru': 'Скрыть форму',
    'uk-ua': 'Сховати форму',
  },
} as const);
