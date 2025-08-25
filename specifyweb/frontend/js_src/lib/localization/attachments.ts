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
    'pt-br': 'Configure seu servidor de anexos',
  },
  orderBy: {
    'en-us': 'Order By',
    'ru-ru': 'Сортировать по',
    'es-es': 'Ordenar por',
    'fr-fr': 'Trier par',
    'uk-ua': 'Сортувати по',
    'de-ch': 'Sortiere nach',
    'pt-br': 'Ordenar por',
  },
  uploadingInline: {
    'en-us': 'Uploading…',
    'ru-ru': 'Закачивание…',
    'es-es': 'Subiendo…',
    'fr-fr': 'Envoi en cours…',
    'uk-ua': 'Завантаження…',
    'de-ch': 'Am Hochladen…',
    'pt-br': 'Enviando…',
  },
  noAttachments: {
    'en-us': 'There are no attachments',
    'ru-ru': 'В вашей коллекции нет вложений',
    'es-es': 'No hay adjuntos',
    'fr-fr': "Il n'y a pas de pièces jointes",
    'uk-ua': 'Прикріплень нема',
    'de-ch': 'Es gibt keine Anhänge',
    'pt-br': 'Não há anexos',
  },
  unableToFindRelatedRecord: {
    'en-us': 'Unable to find related record',
    'es-es': 'No se puede encontrar el registro relacionado',
    'fr-fr': "Impossible de trouver l'enregistrement lié",
    'ru-ru': 'Не удалось найти связанную запись',
    'uk-ua': 'Неможливо знайти відповідний запис',
    'de-ch': 'Verknüpfter Datensatz kann nicht gefunden werden',
    'pt-br': 'Não foi possível encontrar o registro relacionado',
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
      'Não é possível encontrar um registro ao qual este anexo esteja relacionado.',
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
    'de-ch': 'Bitte wählen Sie vor dem Hochladen alle Dateien erneut aus.',
    'es-es':
      'Por favor, vuelva a seleccionar todos los archivos antes de cargarlos.',
    'fr-fr':
      'Veuillez resélectionner tous les fichiers avant de les télécharger.',
    'ru-ru': 'Пожалуйста, повторно выберите все файлы перед загрузкой.',
    'uk-ua': 'Перед завантаженням повторно виберіть усі файли.',
    'pt-br': 'Selecione novamente todos os arquivos antes de fazer o upload.',
  },
  incorrectFormatter: {
    'en-us': 'Incorrectly Formatted',
    'de-ch': 'Falsch formatiert',
    'es-es': 'Formateado incorrectamente',
    'fr-fr': 'Incorrectement formaté',
    'ru-ru': 'Неправильно отформатировано',
    'uk-ua': 'Неправильно відформатований',
    'pt-br': 'Formatado incorretamente',
  },
  alreadyUploaded: {
    'en-us': 'Already Uploaded',
    'de-ch': 'Bereits hochgeladen',
    'es-es': 'Ya se ha cargado',
    'fr-fr': 'Déjà téléchargé',
    'ru-ru': 'Уже загружено',
    'uk-ua': 'Вже завантажено',
    'pt-br': 'Já Enviado',
  },
  skipped: {
    'en-us': 'Skipped',
    'de-ch': 'Übersprungen',
    'es-es': 'Omitido',
    'fr-fr': 'Sauté',
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
    'de-ch': '{action:string} war im Gange, als die Unterbrechung auftrat',
    'es-es':
      '{action:string} estaba en curso cuando se produjo la interrupción',
    'fr-fr':
      "{action:string} était en cours lorsque l'interruption s'est produite",
    'ru-ru':
      '{action:string} был в процессе выполнения, когда произошло прерывание',
    'uk-ua': 'Виконувався {action:string}, коли сталася перерва',
    'pt-br': '{action:string} estava em andamento quando ocorreu a interrupção',
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
    'de-ch': 'Nicht behandelter schwerwiegender Ressourcenfehler:',
    'es-es': 'Error de recurso fatal no controlado:',
    'fr-fr': 'Erreur de ressource fatale non gérée :',
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
    'pt-br': 'Novo conjunto de dados de anexo {data: string}',
  },
  newAttachmentDatasetBase: {
    'en-us': 'New Attachment Data Set',
    'de-ch': 'Neuer Anhangsdatensatz',
    'es-es': 'Nuevo conjunto de datos adjuntos',
    'uk-ua': 'Новий набір даних вкладення',
    'fr-fr': 'Nouveau jeu de données de pièces jointes',
    'ru-ru': 'Новый набор данных о вложениях',
    'pt-br': 'Novo conjunto de dados de anexo',
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
      'Der Upload war im Gange, als es zu einer Unterbrechung kam. Möglicherweise wurden einige Dateien hochgeladen.',
    'es-es':
      'La carga estaba en curso cuando se produjo una interrupción. Es posible que se hayan cargado algunos archivos.',
    'fr-fr':
      "Le téléchargement était en cours lorsqu'une interruption s'est produite. Certains fichiers peuvent avoir été téléchargés.",
    'ru-ru':
      'Загрузка была прервана. Возможно, некоторые файлы уже были загружены.',
    'uk-ua':
      'Під час завантаження виникла перерва. Можливо, деякі файли було завантажено.',
    'pt-br':
      'O upload estava em andamento quando ocorreu uma interrupção. Alguns arquivos podem ter sido enviados.',
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
      'Das Rollback war im Gange, als eine Unterbrechung auftrat. Einige Dateien wurden möglicherweise gelöscht',
    'fr-fr':
      "Le retour en arrière était en cours lorsqu'une interruption s'est produite. Certains fichiers peuvent avoir été supprimés",
    'ru-ru':
      'Откат выполнялся, когда произошло прерывание. Некоторые файлы могли быть удалены.',
    'uk-ua':
      'Тривав відкат, коли сталася перерва. Деякі файли могли бути видалені',
    'es-es':
      'La reversión estaba en curso cuando se produjo una interrupción. Es posible que se hayan eliminado algunos archivos.',
    'pt-br':
      'A reversão estava em andamento quando ocorreu uma interrupção. Alguns arquivos podem ter sido excluídos',
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
    'de-ch': 'Pfad wählen',
    'es-es': 'Seleccione la ruta',
    'fr-fr': 'Choisir le chemin',
    'ru-ru': 'Выбрать путь',
    'uk-ua': 'Виберіть шлях',
    'pt-br': 'Escolha o caminho',
  },
  beginAttachmentUpload: {
    'en-us': 'Begin Attachment Upload?',
    'de-ch': 'Mit dem Hochladen des Anhangs beginnen?',
    'es-es': '¿Comenzar a cargar archivos adjuntos?',
    'fr-fr': 'Commencer le téléchargement des pièces jointes ?',
    'ru-ru': 'Начать загрузку вложения?',
    'uk-ua': 'Почати завантаження вкладених файлів?',
    'pt-br': 'Iniciar upload de anexo?',
  },
  beginUploadDescription: {
    'en-us':
      'Uploading the attachments will make attachments in the asset server and in the Specify database',
    'de-ch':
      'Durch das Hochladen der Anhänge werden Anhänge im Asset-Server und in der Specify-Datenbank erstellt.',
    'es-es': 'Interrumpido. Reintentando en [X25X]',
    'fr-fr':
      "Le téléchargement des pièces jointes créera des pièces jointes dans le serveur d'actifs et dans la base de données de spécification",
    'ru-ru':
      'Загрузка вложений создаст вложения на сервере активов и в базе данных Specify.',
    'uk-ua':
      'Завантаження вкладень призведе до створення вкладень на сервері активів і в базі даних Specify',
    'pt-br':
      'O upload dos anexos fará com que os anexos sejam criados no servidor de ativos e no banco de dados do Specify',
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
    'de-ch': 'Jetzt testen',
    'es-es': 'Probar ahora',
    'fr-fr': 'Essayez maintenant',
    'ru-ru': 'Попробуйте сейчас',
    'uk-ua': 'Спробуйте зараз',
    'pt-br': 'Experimente agora',
  },
  interruptedTime: {
    'en-us': 'Interrupted. Retrying in {remainingTime:string}',
    'de-ch': 'Unterbrochen. Erneuter Versuch in {remainingTime:string}',
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
      'Rollback löscht die Anhänge aus der Datenbank und dem Asset Server.',
    'es-es':
      'La reversión eliminará los archivos adjuntos de la base de datos Specify y del servidor de activos.',
    'fr-fr':
      "La restauration supprimera les pièces jointes de la base de données spécifiée et du serveur d'actifs.",
    'ru-ru':
      'Откат приведет к удалению вложений из базы данных Specify и сервера Asset.',
    'uk-ua':
      'Відкат видалить вкладення з бази даних Specify і сервера ресурсів',
    'pt-br':
      'A reversão excluirá os anexos do banco de dados Especificar e do Asset Server',
  },
  noMatch: {
    'en-us': 'No match',
    'de-ch': 'Keine Übereinstimmung',
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
    'de-ch': 'Suchen Sie nach weiteren Anhängen',
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
  multipleMatches: {
    'en-us': 'Multiple matches',
    'de-ch': 'Mehrere Übereinstimmungen',
    'es-es': 'Múltiples coincidencias',
    'fr-fr': 'Plusieurs correspondances',
    'ru-ru': 'Несколько совпадений',
    'uk-ua': 'Кілька збігів',
    'pt-br': 'Várias correspondências',
  },
  multipleMatchesClick: {
    'en-us': 'Multiple Matches. Click To Disambiguate',
    'de-ch':
      'Mehrere Übereinstimmungen. Klicken Sie hier, um die Mehrdeutigkeit aufzuheben.',
    'es-es': 'Múltiples coincidencias. Haga clic para eliminar la ambigüedad',
    'fr-fr': 'Plusieurs correspondances. Cliquez pour clarifier',
    'ru-ru': 'Несколько совпадений. Нажмите, чтобы устранить неоднозначность.',
    'uk-ua': 'Кілька збігів. Натисніть, щоб усунути неоднозначність',
    'pt-br': 'Várias correspondências. Clique para desambiguar',
  },
  totalFiles: {
    'en-us': 'Total files',
    'de-ch': 'Gesamtzahl der Dateien',
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
    'pt-br': 'Formatado corretamente',
  },
  stoppedByUser: {
    'en-us': 'Stopped By User',
    'de-ch': 'Vom Benutzer gestoppt',
    'es-es': 'Detenido por el usuario',
    'fr-fr': "Arrêté par l'utilisateur",
    'ru-ru': 'Остановлено пользователем',
    'uk-ua': 'Зупинено користувачем',
    'pt-br': 'Parado pelo usuário',
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
    'de-ch': 'In Datei',
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
      'Die folgenden Dateien werden nicht ausgewählt, da sie in diesem Datensatz bereits vorhanden sind.',
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
    'pt-br': 'Erro ao salvar registro',
  },
  interruptionStopped: {
    'en-us': 'Stopped because of error uploading a previous file',
    'de-ch':
      'Wegen eines Fehlers beim Hochladen einer vorherigen Datei angehalten',
    'es-es': 'Detenido debido a un error al cargar un archivo anterior',
    'fr-fr':
      "Arrêté à cause d'une erreur de téléchargement du précédent fichier",
    'ru-ru': 'Остановлено из-за ошибки при загрузке предыдущего файла',
    'uk-ua': 'Зупинено через помилку завантаження попереднього файлу',
    'pt-br': 'Interrompido devido a erro ao carregar um arquivo anterior',
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
    'pt-br': 'Escolha os arquivos ou arraste-os aqui para começar.',
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
    'pt-br':
      'Selecione um identificador para comparar com o nome dos arquivos.',
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
      '{success: number} der {total: number} Anhänge im Datensatz waren {action: string}.',
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
      'Durch das Löschen eines Datensatzes werden dieser und sein Upload-Pfad dauerhaft entfernt. Nach dem Löschen ist für einen hochgeladenen Datensatz auch kein Rollback mehr möglich.',
    'es-es':
      'Al eliminar un conjunto de datos, se elimina permanentemente este y su ruta de carga. Además, después de la eliminación, la Reversión ya no será una opción para un conjunto de datos cargado.',
    'fr-fr':
      'Supprimer un jeu de données le retire définitivement ainsi que son chemin de téléchargement. De plus, après la suppression, le retour en arrière ne sera plus possible pour un jeu de données téléchargé.',
    'ru-ru':
      'Удаление набора данных приводит к его безвозвратному удалению вместе с путём загрузки. Кроме того, после удаления откат загруженного набора данных больше не будет доступен.',
    'uk-ua':
      'Видалення набору даних остаточно видаляє його та його шлях завантаження. Крім того, після видалення відкат більше не буде доступним для завантаженого набору даних.',
    'pt-br':
      'Excluir um Conjunto de Dados remove permanentemente o conjunto e seu Caminho de Upload. Além disso, após a exclusão, a opção de Reverter não será mais uma opção para um Conjunto de Dados carregado.',
  },
  attachmentUploadError: {
    'en-us':
      'Error Uploading Attachment. Attachment server maybe unavailable or there was an error reading the file.',
    'de-ch':
      'Fehler beim Hochladen des Anhangs. Der Anhangsserver ist möglicherweise nicht verfügbar oder beim Lesen der Datei ist ein Fehler aufgetreten.',
    'es-es':
      'Error al cargar el archivo adjunto. Es posible que el servidor de archivos adjuntos no esté disponible o hubo un error al leer el archivo.',
    'fr-fr':
      "Erreur lors du téléchargement de la pièce jointe. Le serveur de pièces jointes est peut-être indisponible ou une erreur s'est produite lors de la lecture du fichier.",
    'ru-ru':
      'Ошибка загрузки вложения. Возможно, сервер вложения недоступен или произошла ошибка при чтении файла.',
    'uk-ua':
      'Помилка завантаження вкладення. Можливо, сервер вкладень недоступний або під час читання файлу сталася помилка.',
    'pt-br':
      'Erro ao carregar anexo. O servidor de anexos pode estar indisponível ou ocorreu um erro ao ler o arquivo.',
  },
  downloadAll: {
    'en-us': 'Download All',
    'de-ch': 'Alles herunterladen',
    'es-es': 'Descargar todo',
    'fr-fr': 'Télécharger tout',
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
  },
  deleteAttachmentWarning: {
    'en-us': 'Are you sure you want to delete this attachment?',
    'de-ch': 'Möchten Sie diesen Anhang wirklich löschen?',
    'es-es': '¿Está seguro que desea eliminar este archivo adjunto?',
    'fr-fr': 'Êtes-vous sûr de vouloir supprimer cette pièce jointe ?',
    'pt-br': 'Tem certeza de que deseja excluir este anexo?',
    'ru-ru': 'Вы уверены, что хотите удалить это вложение?',
    'uk-ua': 'Ви впевнені, що хочете видалити цей вкладений файл?',
  },
  attachmentDelition: {
    'en-us': 'Attachment deletion',
    'de-ch': 'Löschen von Anhängen',
    'es-es': 'Eliminación de archivos adjuntos',
    'fr-fr': 'Suppression des pièces jointes',
    'pt-br': 'Exclusão de anexos',
    'ru-ru': 'Удаление вложения',
    'uk-ua': 'Видалення вкладень',
  },
} as const);
