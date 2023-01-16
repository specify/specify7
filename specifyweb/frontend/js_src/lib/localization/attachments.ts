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
    'uk-ua': 'Налаштуйте сервер вкладень',
  },
  orderBy: {
    'en-us': 'Order By',
    'ru-ru': 'Сортировать по',
    'es-es': 'ordenar por',
    'fr-fr': 'Commandé par',
    'uk-ua': 'Сортувати по',
  },
  uploadingInline: {
    'en-us': 'Uploading…',
    'ru-ru': 'Закачивание…',
    'es-es': 'Subiendo…',
    'fr-fr': 'Téléchargement…',
    'uk-ua': 'Завантаження…',
  },
  noAttachments: {
    'en-us': 'There are no attachments',
    'ru-ru': 'В вашей коллекции нет вложений',
    'es-es': 'No hay archivos adjuntos',
    'fr-fr': "Il n'y a pas de pièces jointes",
    'uk-ua': 'Прикріплень нема',
  },
} as const);
