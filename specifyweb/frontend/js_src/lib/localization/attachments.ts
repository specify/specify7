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
      No se puede encontrar un registro relacionado con este archivo adjunto.
    `,
    'fr-fr': `
      Impossible de trouver un enregistrement auquel cette pièce jointe est
      associée.
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
    'es-es': 'Mostrar formulario',
    'fr-fr': 'Afficher le formulaire',
    'ru-ru': 'Показать форму',
    'uk-ua': 'Показати форму',
    'de-ch': 'Formular anzeigen',
  },
  multipleFilesSelected: {
    'en-us': 'Multiple files selected',
  },
  fileSize: {
    'en-us': 'File Size',
  },
  deleted: {
    'en-us': 'Deleted',
  },
  noFile: {
    'en-us': 'No File',
  },
  incorrectFormatter: {
    'en-us': 'Incorrectly Formatted',
  },
  alreadyUploaded: {
    'en-us': 'Already Uploaded',
  },
  alreadyDeleted: {
    'en-us': 'Already Deleted',
  },
  skipped: {
    'en-us': 'Skipped',
  },
  cancelled: {
    'en-us': 'Cancelled',
  },
  frontEndInterruption: {
    'en-us': '{action:string} was in progress when interruption occured',
  },

  matchError: {
    'en-us': 'Match Error',
  },
  errorReadingFile: {
    'en-us': 'Error reading file',
  },

  unhandledFatalResourceError: {
    'en-us': 'Unhandled fatal resource error:',
  },
  attachmentImportDatasetsCount: {
    'en-us': 'Attachment Import Datasets ({count:number})',
  },
  newAttachmentDataset: {
    'en-us': 'Attachment Import Dataset: New',
  },
  uploadInterrupted: {
    'en-us': 'Upload Interrupted',
  },
  uploadInterruptedDescription: {
    'en-us':
      'The upload was in progress when a system error occurred. Some files may have been uploaded.',
  },
  rollbackInterrupted: {
    'en-us': 'Rollback Interrupted',
  },
  rollbackInterruptedDescription: {
    'en-us':
      'The rollback was in progress when a system error occured. Some files may have been deleted',
  },
  deleteAttachmentDatasetWarning: {
    'en-us': 'Deleting attachment dataset is not recoverable',
  },
  status: {
    'en-us': 'Status',
  },
  attachmentId: {
    'en-us': 'Attachment ID',
  },
  choosePath: {
    'en-us': 'Choose Path',
  },
  beginAttachmentUpload: {
    'en-us': 'Begin Attachment Upload?',
  },
  beginUploadDescription: {
    'en-us':
      'Uploading the attachments will make attachments in the asset server, and in the Specify database',
  },
  interrupted: {
    'en-us': 'Interrupted',
  },
  tryNow: {
    'en-us': 'Try Now',
  },
  interruptedTime: {
    'en-us': 'Interrupted. Retrying in {remainingTime:string}',
  },
  rollbackDescription: {
    'en-us':
      'Rollback will delete the attachments from the Specify DB and Asset Server',
  },
  noMatch: {
    'en-us': 'No match',
  },
  hideForm: {
    'en-us': 'Hide Form',
    'de-ch': 'Formular ausblenden',
    'es-es': 'Ocultar formulario',
    'fr-fr': 'Masquer le formulaire',
    'ru-ru': 'Скрыть форму',
    'uk-ua': 'Сховати форму',
  },
  multipleMatches: {
    'en-us': 'Multiple matches',
  },
  totalFiles: {
    'en-us': 'Total files',
  },
  correctlyFormatted: {
    'en-us': 'Correctly Formatted',
  },
  stoppedByUser: {
    'en-us': 'Stopped By User',
  },
  importAttachments: {
    'en-us': 'Import Attachments',
  },
  bulkImport: {
    'en-us': 'Bulk Import',
  },
  onFile: {
    'en-us': 'On File: {onFile: number} / {total: number}',
  },
} as const);
