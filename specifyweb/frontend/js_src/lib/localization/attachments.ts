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
    'pt-br': 'Anexos',
  },
  scale: {
    'en-us': 'Scale',
    'ru-ru': 'Масштаб',
    'es-es': 'Escala',
    'fr-fr': 'Échelle',
    'uk-ua': 'масштаб',
    'de-ch': 'Massstab',
    'pt-br': 'Escala',
  },
  attachmentServerUnavailable: {
    'en-us': 'Attachment server unavailable',
    'ru-ru': 'Сервер прикрепленных файлов недоступен',
    'es-es': 'Servidor de adjuntos no disponible',
    'fr-fr': 'Serveur de pièces jointes indisponible',
    'uk-ua': 'Сервер прикріплень недоступний',
    'de-ch': 'Attachment-Server nicht verfügbar',
    'pt-br': 'Servidor de anexos indisponível',
  },
  attachmentServerUnavailableDescription: {
    'en-us': 'Setup your attachment server',
    'es-es': 'Configura tu servidor de adjuntos',
    'fr-fr': 'Configurez votre serveur de pièces jointes',
    'ru-ru': 'Настройте сервер вложений',
    'uk-ua': 'Налаштуйте сервер прикріплень',
    'de-ch': 'Richten Sie Ihren Attachment-Server ein',
    'pt-br': 'Configure seu servidor de anexos.',
  },
  orderBy: {
    'en-us': 'Order By',
    'ru-ru': 'Сортировать по',
    'es-es': 'Ordenar por',
    'fr-fr': 'Trier par',
    'uk-ua': 'Сортувати по',
    'de-ch': 'Sortiere nach',
    'pt-br': 'Ordem por',
  },
  uploadingInline: {
    'en-us': 'Uploading…',
    'ru-ru': 'Закачивание…',
    'es-es': 'Subiendo…',
    'fr-fr': 'Envoi en cours…',
    'uk-ua': 'Завантаження…',
    'de-ch': 'Am Hochladen…',
    'pt-br': 'Carregando…',
  },
  noAttachments: {
    'en-us': 'There are no attachments',
    'ru-ru': 'В вашей коллекции нет вложений',
    'es-es': 'No hay adjuntos',
    'fr-fr': "Il n'y a pas de pièces jointes",
    'uk-ua': 'Прикріплень нема',
    'de-ch': 'Es gibt keine Anhänge',
    'pt-br': 'Não há anexos.',
  },
  unableToFindRelatedRecord: {
    'en-us': 'Unable to find related record',
    'es-es': 'No se puede encontrar el registro relacionado',
    'fr-fr': "Impossible de trouver l'enregistrement lié",
    'ru-ru': 'Не удалось найти связанную запись',
    'uk-ua': 'Неможливо знайти відповідний запис',
    'de-ch': 'Verknüpfter Datensatz kann nicht gefunden werden',
    'pt-br': 'Não foi possível encontrar o registro relacionado.',
  },
  unableToFindRelatedRecordDescription: {
    'en-us': 'Unable to find a record that this attachment is related to.',
    'es-es':
      'No se puede encontrar un registro con el que esté relacionado este adjunto.',
    'fr-fr':
      'Impossible de trouver un enregistrement auquel cette pièce jointe est liée.',
    'ru-ru': 'Не удалось найти запись, к которой относится это вложение.',
    'uk-ua': 'Не вдалося знайти запис, до якого відноситься це вкладення.',
    'de-ch':
      'Es konnte kein Datensatz gefunden werden, auf den sich dieser Anhang bezieht.',
    'pt-br':
      'Não foi possível encontrar nenhum registro ao qual este anexo esteja relacionado.',
  },
  showForm: {
    'en-us': 'Show Form',
    'es-es': 'Mostrar formulario',
    'fr-fr': 'Afficher le formulaire',
    'ru-ru': 'Показать форму',
    'uk-ua': 'Показати форму',
    'de-ch': 'Formular anzeigen',
    'pt-br': 'Mostrar formulário',
  },
  multipleFilesSelected: {
    'en-us': 'Multiple files selected',
    'de-ch': 'Mehrere Dateien ausgewählt',
    'es-es': 'Varios archivos seleccionados',
    'fr-fr': 'Plusieurs fichiers sélectionnés',
    'ru-ru': 'Выбрано несколько файлов',
    'uk-ua': 'Вибрано декілька файлів',
    'pt-br': 'Vários arquivos selecionados',
  },
  fileSize: {
    'en-us': 'File Size',
    'de-ch': 'Dateigröße',
    'es-es': 'Tamaño del archivo',
    'fr-fr': 'Taille du fichier',
    'ru-ru': 'Размер файла',
    'uk-ua': 'Розмір файлу',
    'pt-br': 'Tamanho do arquivo',
  },
  deleted: {
    'en-us': 'Deleted',
    'de-ch': 'Gelöscht',
    'es-es': 'Eliminado',
    'fr-fr': 'Supprimé',
    'ru-ru': 'Удалено',
    'uk-ua': 'Видалено',
    'pt-br': 'Excluído',
  },
  noFile: {
    'en-us': 'No File',
    'de-ch': 'Keine Datei',
    'es-es': 'Ningún archivo',
    'fr-fr': 'Pas de fichier',
    'uk-ua': 'Немає файлу',
    'ru-ru': 'Нет файла',
    'pt-br': 'Nenhum arquivo',
  },
  pleaseReselectAllFiles: {
    'en-us': 'Please reselect all files before uploading.',
    'de-ch': 'Bitte wählen Sie alle Dateien vor dem Hochladen erneut aus.',
    'es-es':
      'Por favor, vuelva a seleccionar todos los archivos antes de cargarlos.',
    'fr-fr':
      'Veuillez resélectionner tous les fichiers avant de les télécharger.',
    'ru-ru': 'Пожалуйста, повторно выберите все файлы перед загрузкой.',
    'uk-ua': 'Перед завантаженням повторно виберіть усі файли.',
    'pt-br':
      'Por favor, selecione todos os arquivos novamente antes de fazer o upload.',
  },
  incorrectFormatter: {
    'en-us': 'Incorrectly Formatted',
    'de-ch': 'Falsch formatiert',
    'es-es': 'Formateado incorrectamente',
    'fr-fr': 'Incorrectement formaté',
    'ru-ru': 'Неправильно отформатировано',
    'uk-ua': 'Неправильно відформатований',
    'pt-br': 'Formatação incorreta',
  },
  alreadyUploaded: {
    'en-us': 'Already Uploaded',
    'de-ch': 'Bereits hochgeladen',
    'es-es': 'Ya se ha cargado',
    'fr-fr': 'Déjà téléchargé',
    'ru-ru': 'Уже загружено',
    'uk-ua': 'Вже завантажено',
    'pt-br': 'Já foi carregado',
  },
  skipped: {
    'en-us': 'Skipped',
    'de-ch': 'Übersprungen',
    'es-es': 'Omitido',
    'fr-fr': 'Omission',
    'ru-ru': 'Пропущено',
    'uk-ua': 'Пропущено',
    'pt-br': 'Ignorado',
  },
  cancelled: {
    'en-us': 'Cancelled',
    'de-ch': 'Abgesagt',
    'es-es': 'Anulado',
    'fr-fr': 'Annulé',
    'ru-ru': 'Отменено',
    'uk-ua': 'Скасовано',
    'pt-br': 'Cancelado',
  },
  frontEndInterruption: {
    'en-us': '{action:string} was in progress when interruption occurred',
    'de-ch': '{action:string} war im Gange, als es zu einer Unterbrechung kam.',
    'es-es':
      '{action:string} estaba en curso cuando se produjo la interrupción',
    'fr-fr':
      "{action:string} était en cours lorsque l'interruption s'est produite",
    'ru-ru':
      '{action:string} был в процессе выполнения, когда произошло прерывание',
    'uk-ua': 'Виконувався {action:string}, коли сталася перерва',
    'pt-br':
      '{action:string} estava em andamento quando ocorreu a interrupção.',
  },
  matchError: {
    'en-us': 'Match Error',
    'de-ch': 'Übereinstimmungsfehler',
    'es-es': 'Error de coincidencia',
    'fr-fr': 'Erreur de correspondance',
    'ru-ru': 'Ошибка соответствия',
    'uk-ua': 'Помилка збігу',
    'pt-br': 'Erro de correspondência',
  },
  errorReadingFile: {
    'en-us': 'Error reading file',
    'es-es': 'Error al leer el archivo',
    'fr-fr': 'Erreur de lecture du fichier',
    'ru-ru': 'Ошибка чтения файла',
    'de-ch': 'Fehler beim Lesen der Datei',
    'uk-ua': 'Помилка читання файлу',
    'pt-br': 'Erro ao ler o arquivo',
  },
  unhandledFatalResourceError: {
    'en-us': 'Unhandled fatal resource error:',
    'de-ch': 'Unbehandelter schwerwiegender Ressourcenfehler:',
    'es-es': 'Error de recurso fatal no controlado:',
    'fr-fr': 'Erreur fatale de ressource non gérée :',
    'ru-ru': 'Необработанная фатальная ошибка ресурса:',
    'uk-ua': 'Необроблена критична помилка ресурсу:',
    'pt-br': 'Erro fatal de recurso não tratado:',
  },
  attachmentImportDatasetsCount: {
    'en-us': 'Attachment Import Data Sets ({count:number})',
    'de-ch': 'Anhänge-Importdatensätze ({count:number})',
    'es-es': 'Adjuntar el conjuntos de datos de importación ({count:number})',
    'fr-fr': "Import d'un jeu de données de pièces jointes ({count:number})",
    'ru-ru': 'Наборы данных импорта вложений ({count:number})',
    'uk-ua': 'Набори даних імпорту вкладених файлів ({count:number})',
    'pt-br': 'Conjuntos de dados de importação de anexos ({count:number})',
  },
  newAttachmentDataset: {
    'en-us': 'New Attachment Data Set {date: string}',
    'de-ch': 'Neuer Anhangsdatensatz {date: string}',
    'es-es': 'Nuevo conjunto de datos adjuntos {date: string}',
    'fr-fr': 'Nouveau jeu de données de pièces jointes {date: string}',
    'ru-ru': 'Новый набор данных о вложениях {дата: строка}',
    'uk-ua': 'Новий набір даних вкладень {date: string}',
    'pt-br': 'Novo conjunto de dados de anexos {date: string}',
  },
  newAttachmentDatasetBase: {
    'en-us': 'New Attachment Data Set',
    'de-ch': 'Neuer Anhangsdatensatz',
    'es-es': 'Nuevo conjunto de datos adjuntos',
    'uk-ua': 'Новий набір даних вкладення',
    'fr-fr': 'Nouveau jeu de données de pièces jointes',
    'ru-ru': 'Новый набор данных о вложениях',
    'pt-br': 'Novo conjunto de dados de anexos',
  },
  uploadInterrupted: {
    'en-us': 'Upload Interrupted',
    'de-ch': 'Upload unterbrochen',
    'es-es': 'Carga interrumpida',
    'fr-fr': 'Téléchargement interrompu',
    'ru-ru': 'Загрузка прервана',
    'uk-ua': 'Завантаження перервано',
    'pt-br': 'Upload interrompido',
  },
  uploadInterruptedDescription: {
    'en-us':
      'The upload was in progress when an interruption occurred. Some files may have been uploaded.',
    'de-ch':
      'Der Upload war im Gange, als es zu einer Unterbrechung kam. Möglicherweise wurden einige Dateien bereits hochgeladen.',
    'es-es':
      'La carga estaba en curso cuando se produjo una interrupción. Es posible que se hayan cargado algunos archivos.',
    'fr-fr':
      "Le téléchargement était en cours lorsqu'une interruption s'est produite. Certains fichiers peuvent avoir été téléchargés.",
    'ru-ru':
      'Загрузка была прервана. Возможно, некоторые файлы уже были загружены.',
    'uk-ua':
      'Під час завантаження виникла перерва. Можливо, деякі файли було завантажено.',
    'pt-br':
      'O carregamento estava em andamento quando ocorreu uma interrupção. Alguns arquivos podem ter sido carregados.',
  },
  rollbackInterrupted: {
    'en-us': 'Rollback Interrupted',
    'de-ch': 'Rollback unterbrochen',
    'es-es': 'Reversión interrumpida',
    'fr-fr': 'Retour en arrière interrompu',
    'ru-ru': 'Откат прерван',
    'uk-ua': 'Відкат перервано',
    'pt-br': 'Reversão interrompida',
  },
  rollbackInterruptedDescription: {
    'en-us':
      'The rollback was in progress when an interruption occurred. Some files may have been deleted',
    'de-ch':
      'Der Rollback war im Gange, als es zu einer Unterbrechung kam. Einige Dateien wurden möglicherweise gelöscht.',
    'fr-fr':
      "Le retour en arrière était en cours lorsqu'une interruption s'est produite. Certains fichiers peuvent avoir été supprimés",
    'ru-ru':
      'Откат выполнялся, когда произошло прерывание. Некоторые файлы могли быть удалены.',
    'uk-ua':
      'Тривав відкат, коли сталася перерва. Деякі файли могли бути видалені',
    'es-es':
      'La reversión estaba en curso cuando se produjo una interrupción. Es posible que se hayan eliminado algunos archivos.',
    'pt-br':
      'O processo de reversão estava em andamento quando ocorreu uma interrupção. Alguns arquivos podem ter sido excluídos.',
  },
  attachmentId: {
    'en-us': 'Attachment ID',
    'de-ch': 'Anhangs-ID',
    'es-es': 'ID del archivo adjunto',
    'fr-fr': 'ID de la pièce jointe',
    'ru-ru': 'Идентификатор вложения',
    'uk-ua': 'ID вкладення',
    'pt-br': 'ID do anexo',
  },
  choosePath: {
    'en-us': 'Choose Path',
    'de-ch': 'Wähle den Weg',
    'es-es': 'Seleccione la ruta',
    'fr-fr': 'Choisir le chemin',
    'ru-ru': 'Выбрать путь',
    'uk-ua': 'Виберіть шлях',
    'pt-br': 'Escolha o caminho',
  },
  beginAttachmentUpload: {
    'en-us': 'Begin Attachment Upload?',
    'de-ch': 'Anhang hochladen?',
    'es-es': '¿Comenzar a cargar archivos adjuntos?',
    'fr-fr': 'Commencer le téléchargement des pièces jointes ?',
    'ru-ru': 'Начать загрузку вложения?',
    'uk-ua': 'Почати завантаження вкладених файлів?',
    'pt-br': 'Iniciar o envio do anexo?',
  },
  beginUploadDescription: {
    'en-us':
      'Uploading the attachments will make attachments in the asset server and in the Specify database',
    'de-ch':
      'Durch das Hochladen der Anhänge werden diese auf dem Asset-Server und in der Specify-Datenbank erstellt.',
    'es-es': 'Interrumpido. Reintentando en [X25X]',
    'fr-fr':
      'Le chargement des pièces jointes les ajoutera au serveur de ressources et à la base de données Specification.',
    'ru-ru':
      'Загрузка вложений создаст вложения на сервере активов и в базе данных Specify.',
    'uk-ua':
      'Завантаження вкладень призведе до створення вкладень на сервері активів і в базі даних Specify',
    'pt-br':
      'O envio dos anexos os criará no servidor de ativos e no banco de dados especificado.',
  },
  interrupted: {
    'en-us': 'Interrupted',
    'de-ch': 'Unterbrochen',
    'es-es': 'interrumpido',
    'fr-fr': 'Interrompu',
    'ru-ru': 'Прерванный',
    'uk-ua': 'Перерваний',
    'pt-br': 'Interrompido',
  },
  tryNow: {
    'en-us': 'Try Now',
    'de-ch': 'Jetzt ausprobieren',
    'es-es': 'Probar ahora',
    'fr-fr': 'Essayez maintenant',
    'ru-ru': 'Попробуйте сейчас',
    'uk-ua': 'Спробуйте зараз',
    'pt-br': 'Experimente agora',
  },
  interruptedTime: {
    'en-us': 'Interrupted. Retrying in {remainingTime:string}',
    'de-ch': 'Unterbrechung. Wiederholungsversuch in {remainingTime:string}',
    'es-es': 'Interrumpido. Reintentando en {remainingTime:string}',
    'fr-fr': 'Interrompu. Réessayer dans {remainingTime:string}',
    'ru-ru': 'Прервано. Повторная попытка через {remainingTime:string}',
    'uk-ua': 'Перерваний. Повторна спроба через {remainingTime:string}',
    'pt-br': 'Interrompido. Tentando novamente em {remainingTime:string}',
  },
  rollbackDescription: {
    'en-us':
      'Rollback will delete the attachments from the Specify database and Asset Server',
    'de-ch':
      'Durch das Rollback werden die Anhänge aus der Specify-Datenbank und dem Asset-Server gelöscht.',
    'es-es':
      'La reversión eliminará los archivos adjuntos de la base de datos Specify y del servidor de activos.',
    'fr-fr':
      "La restauration supprimera les pièces jointes de la base de données Specification et du serveur d'actifs.",
    'ru-ru':
      'Откат приведет к удалению вложений из базы данных Specify и сервера Asset.',
    'uk-ua':
      'Відкат видалить вкладення з бази даних Specify і сервера ресурсів',
    'pt-br':
      'A reversão excluirá os anexos do banco de dados especificado e do servidor de ativos.',
  },
  noMatch: {
    'en-us': 'No match',
    'de-ch': 'Kein Spiel',
    'es-es': 'Sin coincidencia',
    'fr-fr': 'Aucune correspondance',
    'ru-ru': 'Нет совпадений',
    'uk-ua': 'Немає відповідності',
    'pt-br': 'Nenhuma correspondência',
  },
  attachmentHaltLimit: {
    'en-us':
      'No attachments have been found in the first {halt:number} records.',
    'de-ch':
      'In den ersten {halt:number}-Datensätzen wurden keine Anhänge gefunden.',
    'es-es':
      'No se han encontrado adjuntos en los primeros {halt:number} registros.',
    'fr-fr':
      "Aucune pièce jointe n'a été trouvée dans les premiers enregistrements {halt:number}.",
    'ru-ru': 'В первых записях {halt:number} вложений не обнаружено.',
    'uk-ua': 'У перших записах {halt:number} вкладень не знайдено.',
    'pt-br':
      'Nenhum anexo foi encontrado nos primeiros registros {halt:number}.',
  },
  fetchNextAttachments: {
    'en-us': 'Look for more attachments',
    'de-ch': 'Suchen Sie nach weiteren Anhängen.',
    'es-es': 'Buscar más adjuntos',
    'fr-fr': 'Rechercher plus de pièces jointes',
    'ru-ru': 'Найдите больше вложений',
    'uk-ua': 'Шукайте більше вкладень',
    'pt-br': 'Procure mais anexos',
  },
  hideForm: {
    'en-us': 'Hide Form',
    'de-ch': 'Formular ausblenden',
    'es-es': 'Ocultar formulario',
    'fr-fr': 'Masquer le formulaire',
    'ru-ru': 'Скрыть форму',
    'uk-ua': 'Сховати форму',
    'pt-br': 'Ocultar formulário',
  },
  collapseFormByDefault: {
    'en-us': 'Collapse form by default',
    'de-ch': 'Formular standardmäßig einklappen',
    'es-es': 'Contraer el formulario de forma predeterminada',
    'fr-fr': 'Réduire le formulaire par défaut',
    'ru-ru': 'Сворачивать форму по умолчанию',
    'uk-ua': 'Згортати форму за замовчуванням',
    'pt-br': 'Recolher formulário por padrão',
  },
  collapseFormByDefaultDescription: {
    'en-us':
      'Whether or not to collapse the attachment form by default when viewing existing attachments. If attachment controls are hidden, this setting has no effect.',
    'de-ch':
      'Ob das Anhangsformular standardmäßig eingeklappt werden soll oder nicht, wenn vorhandene Anhänge angezeigt werden.',
    'es-es':
      'Indica si se debe contraer o no el formulario de adjuntos de forma predeterminada al ver los adjuntos existentes.',
    'fr-fr':
      "Indique si le formulaire de pièce jointe doit être réduit par défaut lors de l'affichage des pièces jointes existantes.",
    'ru-ru':
      'Сворачивать или не сворачивать форму вложения по умолчанию при просмотре существующих вложений.',
    'uk-ua':
      'Згортати чи не згортати форму вкладення за замовчуванням під час перегляду існуючих вкладень.',
    'pt-br':
      'Se deve ou não recolher o formulário de anexos por padrão ao visualizar anexos existentes.',
  },
  showControls: {
    'en-us': 'Show attachment controls',
    'de-ch': 'Anhangssteuerungen anzeigen',
    'es-es': 'Mostrar controles de adjuntos',
    'fr-fr': 'Afficher les contrôles des pièces jointes',
    'ru-ru': 'Показывать элементы управления вложениями',
    'uk-ua': 'Показувати елементи керування вкладеннями',
    'pt-br': 'Mostrar controles de anexos',
  },
  showControlsDescription: {
    'en-us':
      'Show or hide the attachment zoom in, zoom out, reset, and hide/show form buttons when viewing an attachment.',
    'de-ch':
      'Zeigen oder verbergen Sie die Schaltflächen Vergrößern, Verkleinern, Zurücksetzen und Formular ein-/ausblenden im Anhangsbetrachter.',
    'es-es':
      'Mostrar u ocultar los botones de acercar, alejar, restablecer y ocultar/mostrar formulario en el visor de archivos adjuntos.',
    'fr-fr':
      "Afficher ou masquer les boutons d'agrandissement, de réduction, de réinitialisation et d'affichage/masquage du formulaire dans le visualiseur de pièces jointes.",
    'ru-ru':
      'Показать или скрыть кнопки увеличения, уменьшения, сброса и скрытия/показа формы в просмотрщике вложений.',
    'uk-ua':
      'Показати або приховати кнопки збільшення, зменшення, скидання та приховування/показу форми у переглядачі вкладень.',
    'pt-br':
      'Mostrar ou ocultar os botões de zoom, zoom out, reset e ocultar/mostrar formulário no visualizador de anexos.',
  },
  multipleMatches: {
    'en-us': 'Multiple matches',
    'de-ch': 'Mehrere Übereinstimmungen',
    'es-es': 'Múltiples coincidencias',
    'fr-fr': 'Plusieurs correspondances',
    'ru-ru': 'Несколько совпадений',
    'uk-ua': 'Кілька збігів',
    'pt-br': 'Vários confrontos',
  },
  multipleMatchesClick: {
    'en-us': 'Multiple Matches. Click To Disambiguate',
    'de-ch':
      'Mehrere Treffer. Klicken Sie hier, um die Begriffsbestimmungen aufzulösen.',
    'es-es': 'Múltiples coincidencias. Haga clic para eliminar la ambigüedad',
    'fr-fr': 'Plusieurs correspondances. Cliquez pour clarifier',
    'ru-ru': 'Несколько совпадений. Нажмите, чтобы устранить неоднозначность.',
    'uk-ua': 'Кілька збігів. Натисніть, щоб усунути неоднозначність',
    'pt-br': 'Vários resultados. Clique para desambiguar.',
  },
  totalFiles: {
    'en-us': 'Total files',
    'de-ch': 'Gesamtdateien',
    'es-es': 'Archivos totales',
    'fr-fr': 'Total des fichiers',
    'ru-ru': 'Всего файлов',
    'uk-ua': 'Всього файлів',
    'pt-br': 'Total de arquivos',
  },
  correctlyFormatted: {
    'en-us': 'Correctly Formatted',
    'de-ch': 'Korrekt formatiert',
    'es-es': 'Formateado correctamente',
    'fr-fr': 'Correctement formaté',
    'ru-ru': 'Правильно отформатировано',
    'uk-ua': 'Правильно відформатований',
    'pt-br': 'Formatação correta',
  },
  stoppedByUser: {
    'en-us': 'Stopped By User',
    'de-ch': 'Vom Benutzer gestoppt',
    'es-es': 'Detenido por el usuario',
    'fr-fr': "Arrêté par l'utilisateur",
    'ru-ru': 'Остановлено пользователем',
    'uk-ua': 'Зупинено користувачем',
    'pt-br': 'Interrompido pelo usuário',
  },
  importAttachments: {
    'en-us': 'Import Attachments',
    'de-ch': 'Anhänge importieren',
    'es-es': 'Importar archivos adjuntos',
    'fr-fr': 'Importer des pièces jointes',
    'ru-ru': 'Импорт вложений',
    'uk-ua': 'Імпорт вкладень',
    'pt-br': 'Importar anexos',
  },
  onFile: {
    'en-us': 'On File',
    'de-ch': 'In der Akte',
    'es-es': 'En archivo',
    'ru-ru': 'В деле',
    'uk-ua': 'У файлі',
    'fr-fr': 'Dans le fichier',
    'pt-br': 'Em arquivo',
  },
  duplicateFilesFound: {
    'en-us': 'Duplicate Files Found',
    'de-ch': 'Doppelte Dateien gefunden',
    'es-es': 'Archivos duplicados encontrados',
    'fr-fr': 'Fichiers en double trouvés',
    'ru-ru': 'Найдены дубликаты файлов',
    'uk-ua': 'Знайдено дублікати файлів',
    'pt-br': 'Arquivos duplicados encontrados',
  },
  duplicateFilesDescription: {
    'en-us':
      'The following files are not selected because they already exist in this data set.',
    'es-es':
      'Los siguientes archivos no están seleccionados porque ya existen en este conjunto de datos.',
    'fr-fr':
      'Les fichiers suivants ne sont pas sélectionnés car ils existent déjà dans cet ensemble de données.',
    'ru-ru':
      'Следующие файлы не выбраны, поскольку они уже существуют в этом наборе данных.',
    'de-ch':
      'Die folgenden Dateien wurden nicht ausgewählt, da sie bereits in diesem Datensatz vorhanden sind.',
    'uk-ua':
      'Наступні файли не вибрано, оскільки вони вже існують у цьому наборі даних.',
    'pt-br':
      'Os seguintes arquivos não foram selecionados porque já existem neste conjunto de dados.',
  },
  errorFetchingRecord: {
    'en-us': 'Error fetching record',
    'de-ch': 'Fehler beim Abrufen des Datensatzes',
    'es-es': 'Error al obtener el registro',
    'fr-fr': "Erreur lors de la récupération de l'enregistrement",
    'ru-ru': 'Ошибка при извлечении записи',
    'uk-ua': 'Помилка отримання запису',
    'pt-br': 'Erro ao buscar registro',
  },
  errorSavingRecord: {
    'en-us': 'Error saving record',
    'de-ch': 'Fehler beim Speichern des Datensatzes',
    'es-es': 'Error al guardar el registro',
    'fr-fr': "Erreur lors de la sauvegarde de l'enregistrement",
    'ru-ru': 'Ошибка сохранения записи',
    'uk-ua': 'Помилка збереження запису',
    'pt-br': 'Erro ao salvar o registro',
  },
  interruptionStopped: {
    'en-us': 'Stopped because of error uploading a previous file',
    'de-ch':
      'Der Vorgang wurde aufgrund eines Fehlers beim Hochladen einer vorherigen Datei abgebrochen.',
    'es-es': 'Se detuvo debido a un error al cargar un archivo anterior.',
    'fr-fr':
      "Arrêté à cause d'une erreur de téléchargement du précédent fichier",
    'ru-ru': 'Остановлено из-за ошибки при загрузке предыдущего файла',
    'uk-ua': 'Зупинено через помилку завантаження попереднього файлу',
    'pt-br': 'Interrompido devido a erro ao carregar um arquivo anterior.',
  },
  chooseFilesToGetStarted: {
    'en-us': 'Choose files or drag them here to get started.',
    'de-ch':
      'Wählen Sie Dateien aus oder ziehen Sie sie hierher, um zu beginnen.',
    'es-es': 'Elija archivos o arrástrelos aquí para comenzar.',
    'fr-fr':
      'Choisissez des fichiers ou faites-les glisser ici pour commencer.',
    'ru-ru': 'Чтобы начать, выберите файлы или перетащите их сюда.',
    'uk-ua': 'Щоб почати, виберіть файли або перетягніть їх сюди.',
    'pt-br': 'Selecione os arquivos ou arraste-os para cá para começar.',
  },
  selectIdentifier: {
    'en-us': 'Select an identifier to match the files name against.',
    'de-ch':
      'Wählen Sie eine Kennung aus, mit der der Dateiname abgeglichen werden soll.',
    'es-es':
      'Seleccione un identificador para hacer coincidir el nombre de los archivos.',
    'fr-fr':
      'Sélectionnez un identifiant pour faire correspondre le nom des fichiers.',
    'ru-ru':
      'Выберите идентификатор, с которым будет сопоставляться имя файла.',
    'uk-ua': 'Виберіть ідентифікатор для відповідності імені файлу.',
    'pt-br': 'Selecione um identificador para comparar com o nome do arquivo.',
  },
  progress: {
    'en-us': 'Progress',
    'de-ch': 'Fortschritt',
    'es-es': 'Progreso',
    'fr-fr': 'En cours',
    'ru-ru': 'Прогресс',
    'uk-ua': 'Прогрес',
    'pt-br': 'Progresso',
  },
  rollbackResults: {
    'en-us': 'Rollback Results',
    'de-ch': 'Rollback-Ergebnisse',
    'es-es': 'Resultados de reversión',
    'fr-fr': 'Résultats du retour en arrière',
    'ru-ru': 'Результаты отката',
    'uk-ua': 'Результати відкату',
    'pt-br': 'Resultados da reversão',
  },
  resultValue: {
    'en-us':
      '{success: number} out of the {total: number} attachments in the data set have been {action: string}.',
    'de-ch':
      '{success: number} von den {total: number} Anhängen im Datensatz wurden {action: string} ausgeführt.',
    'es-es':
      '{éxito: número} de los {total: número} archivos adjuntos en el conjunto de datos han sido {acción: cadena}.',
    'fr-fr':
      '{success : number} sur les {total : number} pièces jointes du jeu de données étaient {action : string}.',
    'ru-ru':
      '{success: number} из {total: number} вложений в наборе данных были {action: string}.',
    'uk-ua':
      '{success: number} із {total: number} вкладень у наборі даних було {action: string}.',
    'pt-br':
      '{success: number} dos {total: number} anexos no conjunto de dados foram {action: string}.',
  },
  deleteAttachmentDataSetDescription: {
    'en-us':
      'Deleting a Data Set permanently removes it and its Upload Path. Also after deleting, Rollback will no longer be an option for an uploaded Data Set.',
    'de-ch':
      'Durch das Löschen eines Datensatzes werden dieser und sein Upload-Pfad endgültig entfernt. Nach dem Löschen ist die Option „Rollback“ für einen hochgeladenen Datensatz nicht mehr verfügbar.',
    'es-es':
      'Al eliminar un conjunto de datos, se elimina permanentemente este y su ruta de carga. Además, después de la eliminación, la Reversión ya no será una opción para un conjunto de datos cargado.',
    'fr-fr':
      'Supprimer un jeu de données le retire définitivement ainsi que son chemin de téléchargement. De plus, après la suppression, le retour en arrière ne sera plus possible pour un jeu de données téléchargé.',
    'ru-ru':
      'Удаление набора данных приводит к его безвозвратному удалению вместе с путём загрузки. Кроме того, после удаления откат загруженного набора данных больше не будет доступен.',
    'uk-ua':
      'Видалення набору даних остаточно видаляє його та його шлях завантаження. Крім того, після видалення відкат більше не буде доступним для завантаженого набору даних.',
    'pt-br':
      'A exclusão de um conjunto de dados remove permanentemente o conjunto e seu caminho de upload. Além disso, após a exclusão, a opção de reversão (rollback) não estará mais disponível para o conjunto de dados carregado.',
  },
  attachmentUploadError: {
    'en-us':
      'Error Uploading Attachment. Attachment server maybe unavailable or there was an error reading the file.',
    'de-ch':
      'Fehler beim Hochladen des Anhangs. Der Server für den Anhang ist möglicherweise nicht verfügbar oder es ist ein Fehler beim Lesen der Datei aufgetreten.',
    'es-es':
      'Error al cargar el archivo adjunto. Es posible que el servidor de archivos adjuntos no esté disponible o hubo un error al leer el archivo.',
    'fr-fr':
      "Erreur lors du téléchargement de la pièce jointe. Le serveur de pièces jointes est peut-être indisponible ou une erreur s'est produite lors de la lecture du fichier.",
    'ru-ru':
      'Ошибка загрузки вложения. Возможно, сервер вложения недоступен или произошла ошибка при чтении файла.',
    'uk-ua':
      'Помилка завантаження вкладення. Можливо, сервер вкладень недоступний або під час читання файлу сталася помилка.',
    'pt-br':
      'Erro ao enviar o anexo. O servidor de anexos pode estar indisponível ou ocorreu um erro ao ler o arquivo.',
  },
  downloadAll: {
    'en-us': 'Download All',
    'de-ch': 'Alle herunterladen',
    'es-es': 'Descargar todo',
    'fr-fr': 'Tout télécharger',
    'pt-br': 'Baixar tudo',
    'ru-ru': 'Скачать все',
    'uk-ua': 'Завантажити все',
  },
  downloadAllDescription: {
    'en-us': 'Download all found attachments',
    'de-ch': 'Alle gefundenen Anhänge herunterladen',
    'es-es': 'Descargar todos los archivos adjuntos encontrados',
    'fr-fr': 'Télécharger toutes les pièces jointes trouvées',
    'pt-br': 'Baixar todos os anexos encontrados',
    'ru-ru': 'Загрузить все найденные вложения',
    'uk-ua': 'Завантажити всі знайдені вкладення',
  },
  createRecordSetToDownloadAll: {
    'en-us':
      'Not all attachments have been loaded. Please create a record set of the query results to download all the attachments.',
    'de-ch':
      'Es wurden nicht alle Anhänge geladen. Bitte erstellen Sie einen Datensatz der Abfrageergebnisse, um alle Anhänge herunterzuladen.',
    'es-es':
      'No se han cargado todos los archivos adjuntos. Cree un conjunto de registros con los resultados de la consulta para descargar todos los archivos adjuntos.',
    'fr-fr':
      "Toutes les pièces jointes n'ont pas été chargées. Veuillez créer un enregistrement des résultats de la requête pour télécharger toutes les pièces jointes.",
    'pt-br':
      'Nem todos os anexos foram carregados. Crie um conjunto de registros com os resultados da consulta para baixar todos os anexos.',
    'ru-ru':
      'Не все вложения загружены. Создайте набор записей результатов запроса, чтобы загрузить все вложения.',
    'uk-ua':
      'Не всі вкладення завантажено. Будь ласка, створіть набір записів результатів запиту, щоб завантажити всі вкладення.',
  },
  deleteAttachmentWarning: {
    'en-us': 'Are you sure you want to delete this attachment?',
    'de-ch': 'Möchten Sie diesen Anhang wirklich löschen?',
    'es-es': '¿Seguro que quieres eliminar este archivo adjunto?',
    'fr-fr': 'Êtes-vous sûr de vouloir supprimer cette pièce jointe ?',
    'pt-br': 'Tem certeza de que deseja excluir este anexo?',
    'ru-ru': 'Вы уверены, что хотите удалить это вложение?',
    'uk-ua': 'Ви впевнені, що хочете видалити цей вкладений файл?',
  },
  attachmentDelition: {
    'en-us': 'Attachment deletion',
    'de-ch': 'Anhang löschen',
    'es-es': 'Eliminación de archivos adjuntos',
    'fr-fr': 'Suppression de la pièce jointe',
    'pt-br': 'Exclusão de anexos',
    'ru-ru': 'Удаление вложения',
    'uk-ua': 'Видалення вкладень',
  },
} as const);
