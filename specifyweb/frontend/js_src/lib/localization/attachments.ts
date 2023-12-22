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
    'es-es': 'Adjuntos',
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
    'es-es': 'Servidor de adjuntos no disponible',
    'fr-fr': 'Serveur de pièces jointes indisponible',
    'uk-ua': 'Сервер прикріплень недоступний',
    'de-ch': 'Attachment-Server nicht verfügbar',
  },
  attachmentServerUnavailableDescription: {
    'en-us': 'Setup your attachment server',
    'es-es': 'Configura tu servidor de adjuntos',
    'fr-fr': 'Configurez votre serveur de pièces jointes',
    'ru-ru': 'Настройте свой сервер вложений',
    'uk-ua': 'Налаштуйте сервер прикріплень',
    'de-ch': 'Richten Sie Ihren Attachment-Server ein',
  },
  orderBy: {
    'en-us': 'Order By',
    'ru-ru': 'Сортировать по',
    'es-es': 'Ordenar por',
    'fr-fr': 'Trier par',
    'uk-ua': 'Сортувати по',
    'de-ch': 'Sortiere nach',
  },
  uploadingInline: {
    'en-us': 'Uploading…',
    'ru-ru': 'Закачивание…',
    'es-es': 'Subiendo…',
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
      No se puede encontrar un registro con el que esté relacionado este
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
    'es-es': 'Mostrar formulario',
    'fr-fr': 'Afficher le formulaire',
    'ru-ru': 'Показать форму',
    'uk-ua': 'Показати форму',
    'de-ch': 'Formular anzeigen',
  },
  multipleFilesSelected: {
    'en-us': 'Multiple files selected',
    'de-ch': '',
    'es-es': '',
    'fr-fr': '',
    'ru-ru': '',
    'uk-ua': '',
  },
  fileSize: {
    'en-us': 'File Size',
    'de-ch': '',
    'es-es': '',
    'fr-fr': '',
    'ru-ru': '',
    'uk-ua': '',
  },
  deleted: {
    'en-us': 'Deleted',
    'de-ch': '',
    'es-es': '',
    'fr-fr': '',
    'ru-ru': '',
    'uk-ua': '',
  },
  noFile: {
    'en-us': 'No File',
    'de-ch': '',
    'es-es': '',
    'fr-fr': '',
    'ru-ru': '',
    'uk-ua': '',
  },
  pleaseReselectAllFiles: {
    'en-us': 'Please reselect all files before uploading.',
    'de-ch': '',
    'es-es': '',
    'fr-fr': '',
    'ru-ru': '',
    'uk-ua': '',
  },
  incorrectFormatter: {
    'en-us': 'Incorrectly Formatted',
    'de-ch': '',
    'es-es': '',
    'fr-fr': '',
    'ru-ru': '',
    'uk-ua': '',
  },
  alreadyUploaded: {
    'en-us': 'Already Uploaded',
    'de-ch': '',
    'es-es': '',
    'fr-fr': '',
    'ru-ru': '',
    'uk-ua': '',
  },
  skipped: {
    'en-us': 'Skipped',
    'de-ch': '',
    'es-es': '',
    'fr-fr': '',
    'ru-ru': '',
    'uk-ua': '',
  },
  cancelled: {
    'en-us': 'Cancelled',
    'de-ch': '',
    'es-es': '',
    'fr-fr': '',
    'ru-ru': '',
    'uk-ua': '',
  },
  frontEndInterruption: {
    'en-us': '{action:string} was in progress when interruption occurred',
    'de-ch': '',
    'es-es': '',
    'fr-fr': '',
    'ru-ru': '',
    'uk-ua': '',
  },
  matchError: {
    'en-us': 'Match Error',
    'de-ch': '',
    'es-es': '',
    'fr-fr': '',
    'ru-ru': '',
    'uk-ua': '',
  },
  errorReadingFile: {
    'en-us': 'Error reading file',
    'de-ch': '',
    'es-es': '',
    'fr-fr': '',
    'ru-ru': '',
    'uk-ua': '',
  },
  unhandledFatalResourceError: {
    'en-us': 'Unhandled fatal resource error:',
    'de-ch': '',
    'es-es': '',
    'fr-fr': '',
    'ru-ru': '',
    'uk-ua': '',
  },
  attachmentImportDatasetsCount: {
    'en-us': 'Attachment Import Data Sets ({count:number})',
    'de-ch': '',
    'es-es': '',
    'fr-fr': '',
    'ru-ru': '',
    'uk-ua': '',
  },
  newAttachmentDataset: {
    'en-us': 'New Attachment Data Set {date: string}',
    'de-ch': '',
    'es-es': '',
    'fr-fr': '',
    'ru-ru': '',
    'uk-ua': '',
  },
  newAttachmentDatasetBase: {
    'en-us': 'New Attachment Data Set',
    'de-ch': '',
    'es-es': '',
    'fr-fr': '',
    'ru-ru': '',
    'uk-ua': '',
  },
  uploadInterrupted: {
    'en-us': 'Upload Interrupted',
    'de-ch': '',
    'es-es': '',
    'fr-fr': '',
    'ru-ru': '',
    'uk-ua': '',
  },
  uploadInterruptedDescription: {
    'en-us': `
      The upload was in progress when an interruption occurred. Some files may
      have been uploaded.
    `,
    'de-ch': '',
    'es-es': '',
    'fr-fr': '',
    'ru-ru': '',
    'uk-ua': '',
  },
  rollbackInterrupted: {
    'en-us': 'Rollback Interrupted',
    'de-ch': '',
    'es-es': '',
    'fr-fr': '',
    'ru-ru': '',
    'uk-ua': '',
  },
  rollbackInterruptedDescription: {
    'en-us': `
      The rollback was in progress when an interruption occurred. Some files may
      have been deleted
    `,
    'de-ch': '',
    'es-es': '',
    'fr-fr': '',
    'ru-ru': '',
    'uk-ua': '',
  },
  attachmentId: {
    'en-us': 'Attachment ID',
    'de-ch': '',
    'es-es': '',
    'fr-fr': '',
    'ru-ru': '',
    'uk-ua': '',
  },
  choosePath: {
    'en-us': 'Choose Path',
    'de-ch': '',
    'es-es': '',
    'fr-fr': '',
    'ru-ru': '',
    'uk-ua': '',
  },
  beginAttachmentUpload: {
    'en-us': 'Begin Attachment Upload?',
    'de-ch': '',
    'es-es': '',
    'fr-fr': '',
    'ru-ru': '',
    'uk-ua': '',
  },
  beginUploadDescription: {
    'en-us': `
      Uploading the attachments will make attachments in the asset server and in
      the Specify database
    `,
    'de-ch': '',
    'es-es': '',
    'fr-fr': '',
    'ru-ru': '',
    'uk-ua': '',
  },
  interrupted: {
    'en-us': 'Interrupted',
    'de-ch': '',
    'es-es': '',
    'fr-fr': '',
    'ru-ru': '',
    'uk-ua': '',
  },
  tryNow: {
    'en-us': 'Try Now',
    'de-ch': '',
    'es-es': '',
    'fr-fr': '',
    'ru-ru': '',
    'uk-ua': '',
  },
  interruptedTime: {
    'en-us': 'Interrupted. Retrying in {remainingTime:string}',
    'de-ch': '',
    'es-es': '',
    'fr-fr': '',
    'ru-ru': '',
    'uk-ua': '',
  },
  rollbackDescription: {
    'en-us': `
      Rollback will delete the attachments from the Specify database and Asset
      Server
    `,
    'de-ch': '',
    'es-es': '',
    'fr-fr': '',
    'ru-ru': '',
    'uk-ua': '',
  },
  noMatch: {
    'en-us': 'No match',
    'de-ch': '',
    'es-es': '',
    'fr-fr': '',
    'ru-ru': '',
    'uk-ua': '',
  },
  attachmentHaltLimit: {
    'en-us':
      'No attachments have been found in the first {halt:number} records.',
    'de-ch':
      'In den ersten {halt:number}-Datensätzen wurden keine Anhänge gefunden.',
    'es-es':
      'No se han encontrado adjuntos en los primeros {halt:number} registros.',
    'fr-fr': `
      Aucune pièce jointe n'a été trouvée dans les premiers enregistrements
      {halt :number}.
    `,
    'ru-ru': 'В первых записях {halt:number} вложений не обнаружено.',
    'uk-ua': 'У перших записах {halt:number} вкладень не знайдено.',
  },
  fetchNextAttachments: {
    'en-us': 'Look for more attachments',
    'de-ch': 'Suchen Sie nach weiteren Anhängen',
    'es-es': 'Buscar más adjuntos',
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
  multipleMatches: {
    'en-us': 'Multiple matches',
    'de-ch': '',
    'es-es': '',
    'fr-fr': '',
    'ru-ru': '',
    'uk-ua': '',
  },
  multipleMatchesClick: {
    'en-us': 'Multiple Matches. Click To Disambiguate',
    'de-ch': '',
    'es-es': '',
    'fr-fr': '',
    'ru-ru': '',
    'uk-ua': '',
  },
  totalFiles: {
    'en-us': 'Total files',
    'de-ch': '',
    'es-es': '',
    'fr-fr': '',
    'ru-ru': '',
    'uk-ua': '',
  },
  correctlyFormatted: {
    'en-us': 'Correctly Formatted',
    'de-ch': '',
    'es-es': '',
    'fr-fr': '',
    'ru-ru': '',
    'uk-ua': '',
  },
  stoppedByUser: {
    'en-us': 'Stopped By User',
    'de-ch': '',
    'es-es': '',
    'fr-fr': '',
    'ru-ru': '',
    'uk-ua': '',
  },
  importAttachments: {
    'en-us': 'Import Attachments',
    'de-ch': '',
    'es-es': '',
    'fr-fr': '',
    'ru-ru': '',
    'uk-ua': '',
  },
  onFile: {
    'en-us': 'On File',
    'de-ch': '',
    'es-es': '',
    'fr-fr': '',
    'ru-ru': '',
    'uk-ua': '',
  },
  duplicateFilesFound: {
    'en-us': 'Duplicate Files Found',
    'de-ch': '',
    'es-es': '',
    'fr-fr': '',
    'ru-ru': '',
    'uk-ua': '',
  },
  duplicateFilesDescription: {
    'en-us': `
      The following files are not selected because they already exist in this
      data set.
    `,
    'de-ch': '',
    'es-es': '',
    'fr-fr': '',
    'ru-ru': '',
    'uk-ua': '',
  },
  errorFetchingRecord: {
    'en-us': 'Error fetching record',
    'de-ch': '',
    'es-es': '',
    'fr-fr': '',
    'ru-ru': '',
    'uk-ua': '',
  },
  errorSavingRecord: {
    'en-us': 'Error saving record',
    'de-ch': '',
    'es-es': '',
    'fr-fr': '',
    'ru-ru': '',
    'uk-ua': '',
  },
  interruptionStopped: {
    'en-us': 'Stopped because of error uploading a previous file',
    'de-ch': '',
    'es-es': '',
    'fr-fr': '',
    'ru-ru': '',
    'uk-ua': '',
  },
  chooseFilesToGetStarted: {
    'en-us': 'Choose files or drag them here to get started.',
    'de-ch': '',
    'es-es': '',
    'fr-fr': '',
    'ru-ru': '',
    'uk-ua': '',
  },
  selectIdentifier: {
    'en-us': 'Select an identifier to match the files name against.',
    'de-ch': '',
    'es-es': '',
    'fr-fr': '',
    'ru-ru': '',
    'uk-ua': '',
  },
  progress: {
    'en-us': 'Progress',
    'de-ch': '',
    'es-es': '',
    'fr-fr': '',
    'ru-ru': '',
    'uk-ua': '',
  },
  rollbackResults: {
    'en-us': 'Rollback Results',
    'de-ch': '',
    'es-es': '',
    'fr-fr': '',
    'ru-ru': '',
    'uk-ua': '',
  },
  resultValue: {
    'en-us': `
      {success: number} out of the {total: number} attachments in the data set
      have been {action: string}.
    `,
    'de-ch': '',
    'es-es': '',
    'fr-fr': '',
    'ru-ru': '',
    'uk-ua': '',
  },
  deleteAttachmentDataSetDescription: {
    'en-us': `
      Deleting a Data Set permanently removes it and its Upload Path. Also after
      deleting, Rollback will no longer be an option for an uploaded Data Set.
    `,
    'de-ch': '',
    'es-es': '',
    'fr-fr': '',
    'ru-ru': '',
    'uk-ua': '',
  },
  attachmentUploadError: {
    'en-us': `
      Error Uploading Attachment. Attachment server maybe unavailable or there
      was an error reading the file.
    `,
    'de-ch': '',
    'es-es': '',
    'fr-fr': '',
    'ru-ru': '',
    'uk-ua': '',
  },
} as const);
