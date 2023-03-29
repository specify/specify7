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
  },
  scale: {
    'en-us': 'Scale',
    'ru-ru': 'Масштаб',
    'es-es': 'Escala',
    'fr-fr': 'Échelle',
    'uk-ua': 'масштаб',
  },
  attachmentServerUnavailable: {
    'en-us': 'Attachment server unavailable',
    'ru-ru': 'Сервер прикрепленных файлов недоступен',
    'es-es': 'Servidor de archivos adjuntos no disponible',
    'fr-fr': 'Serveur de pièces jointes indisponible',
    'uk-ua': 'Сервер прикріплень недоступний',
  },
  attachmentServerUnavailableDescription: {
    'en-us': 'Setup your attachment server',
    'es-es': 'Configura tu servidor de archivos adjuntos',
    'fr-fr': 'Configurez votre serveur de pièces jointes',
    'ru-ru': 'Настройте свой сервер вложений',
    'uk-ua': 'Налаштуйте сервер прикріплень',
  },
  orderBy: {
    'en-us': 'Order By',
    'ru-ru': 'Сортировать по',
    'es-es': 'ordenar por',
    'fr-fr': 'Trier par',
    'uk-ua': 'Сортувати по',
  },
  uploadingInline: {
    'en-us': 'Uploading…',
    'ru-ru': 'Закачивание…',
    'es-es': 'Subiendo…',
    'fr-fr': 'Envoi en cours…',
    'uk-ua': 'Завантаження…',
  },
  noAttachments: {
    'en-us': 'There are no attachments',
    'ru-ru': 'В вашей коллекции нет вложений',
    'es-es': 'No hay archivos adjuntos',
    'fr-fr': "Il n'y a pas de pièces jointes",
    'uk-ua': 'Прикріплень нема',
  },
  unableToFindRelatedRecord: {
    'en-us': 'Unable to find related record',
    'es-es': 'No se puede encontrar el registro relacionado',
    'fr-fr': "Impossible de trouver l'enregistrement associé",
    'ru-ru': 'Не удалось найти связанную запись',
    'uk-ua': 'Неможливо знайти відповідний запис',
  },
  unableToFindRelatedRecordDescription: {
    'en-us': 'Unable to find a record that this attachment is related to.',
    'es-es': `
      No se puede encontrar un registro relacionado con este archivo adjunto.
    `,
    'fr-fr': `
      Impossible de trouver un enregistrement auquel cette pièce jointe est
      associée.
    `,
    'ru-ru': 'Не удалось найти запись, к которой относится это вложение.',
    'uk-ua': 'Не вдалося знайти запис, до якого відноситься це вкладення.',
  },
  showForm: {
    'en-us': 'Show Form',
    'es-es': 'Mostrar formulario',
    'fr-fr': 'Afficher le formulaire',
    'ru-ru': 'Показать форму',
    'uk-ua': 'Показати форму',
  },
} as const);
