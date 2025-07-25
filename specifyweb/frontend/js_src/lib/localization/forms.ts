/**
 * Localization strings used on Forms (don't confuse this with schema
 * localization strings)
 *
 * @module
 */

import { createDictionary } from "./utils";

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

export const formsText = createDictionary({
  forms: {
    "en-us": "Forms",
    "ru-ru": "Формы",
    "es-es": "Formularios",
    "fr-fr": "Formulaires",
    "uk-ua": "Форми",
    "de-ch": "Formulare",
    "pt-br": "Formulários",
  },
  clone: {
    "en-us": "Clone",
    "ru-ru": "Клон",
    "es-es": "Clon",
    "fr-fr": "Cloner",
    "uk-ua": "Клон",
    "de-ch": "Klone",
    "pt-br": "Clone",
  },
  cloneDescription: {
    "en-us": "Create a full copy of current record",
    "ru-ru": "Создать полную копию текущей записи",
    "es-es": "Crear una copia completa del registro actual",
    "fr-fr": "Créer une copie complète de l'enregistrement actuel",
    "uk-ua": "Створити повну копію поточного запису",
    "de-ch": "Erstellen einer kompletten Kopie des aktuellen Datensatzes",
    "pt-br": "Crie uma cópia completa do registro atual",
  },
  valueMustBeUniqueToField: {
    "en-us": "Value must be unique to {fieldName:string}",
    "ru-ru": "Значение должно быть уникальным для {fieldName:string}",
    "es-es": "El valor debe ser exclusivo de {fieldName:string}",
    "fr-fr": "La valeur doit être unique à {fieldName:string}",
    "uk-ua": "Значення має бути унікальним для {fieldName:string}",
    "de-ch": "Der Wert muss für {fieldName:string} eindeutig sein",
    "pt-br": "O valor deve ser exclusivo para {fieldName:string}",
  },
  valueMustBeUniqueToDatabase: {
    "en-us": "Value must be unique to database",
    "ru-ru": "Значение должно быть уникальным в базе данных.",
    "es-es": "El valor debe ser exclusivo de la base de datos.",
    "fr-fr": "La valeur doit être unique dans la base de données",
    "uk-ua": "Значення має бути унікальним для бази даних",
    "de-ch": "Der Wert muss in der Datenbank eindeutig sein",
    "pt-br": "O valor deve ser exclusivo para o banco de dados",
  },
  valuesOfMustBeUniqueToField: {
    "en-us": "Values of {values:string} must be unique to {fieldName:string}",
    "ru-ru":
      "Значения {values:string} должны быть уникальными для {fieldName:string}",
    "es-es":
      "Los valores de {values:string} deben ser únicos para {fieldName:string}",
    "fr-fr":
      "Les valeurs de {values:string} doivent être uniques à {fieldName:string}",
    "uk-ua":
      "Значення {values:string} мають бути унікальними для {fieldName:string}",
    "de-ch":
      "Werte von {values:string} müssen für {fieldName:string} eindeutig sein.",
    "pt-br":
      "Os valores de {values:string} devem ser exclusivos de {fieldName:string}",
  },
  valuesOfMustBeUniqueToDatabase: {
    "en-us": "Values of {values:string} must be unique to database",
    "ru-ru": "Значения {values:string} должны быть уникальными в базе данных.",
    "es-es":
      "Los valores de {values:string} deben ser únicos para la base de datos.",
    "fr-fr":
      "Les valeurs de {values:string} doivent être uniques à la base de données",
    "uk-ua": "Значення {values:string} мають бути унікальними для бази даних",
    "de-ch": "Werte von {values:string} müssen in der Datenbank eindeutig sein",
    "pt-br":
      "Os valores de {values:string} devem ser exclusivos do banco de dados",
  },
  checkingIfResourceCanBeDeleted: {
    "en-us": "Checking if resource can be deleted…",
    "ru-ru": "Проверка возможности удаления ресурса…",
    "es-es": "Comprobando si el recurso se puede eliminar…",
    "fr-fr": "Vérification si la ressource peut être supprimée…",
    "uk-ua": "Перевірка можливості видалення ресурсу…",
    "de-ch": "Überprüfen, ob die Ressource gelöscht werden kann …",
    "pt-br": "Verificando se o recurso pode ser excluído…",
  },
  deleteBlocked: {
    "en-us": "Delete blocked",
    "ru-ru": "Удалить заблокированный",
    "es-es": "Eliminar bloqueado",
    "fr-fr": "Supprimer bloqué",
    "uk-ua": "Видалити заблоковано",
    "de-ch": "Gesperrte löschen",
    "pt-br": "Excluir bloqueado",
  },
  deleteBlockedDescription: {
    "en-us":
      "The resource cannot be deleted because it is referenced by the following resources:",
    "de-ch":
      "Die Ressource kann nicht gelöscht werden, da sie von den folgenden Ressourcen referenziert wird:",
    "es-es": "encontrar usos",
    "fr-fr":
      "La ressource ne peut pas être supprimée car elle est référencée par les ressources suivantes :",
    "ru-ru":
      "Ресурс не может быть удален, поскольку на него ссылаются следующие ресурсы:",
    "uk-ua":
      "Ресурс не можна видалити, оскільки на нього посилаються такі ресурси:",
    "pt-br":
      "O recurso não pode ser excluído porque é referenciado pelos seguintes recursos:",
  },
  relationship: {
    "en-us": "Relationship",
    "ru-ru": "Отношение",
    "es-es": "Relación",
    "fr-fr": "Relation",
    "uk-ua": "Стосунків",
    "de-ch": "Beziehung",
    "pt-br": "Relação",
  },
  paleoMap: {
    "en-us": "Paleo Map",
    "ru-ru": "Палеокарта",
    "es-es": "Mapa Paleo",
    "fr-fr": "Carte paléo",
    "uk-ua": "Палео-мапа",
    "de-ch": "Paläo-Karte",
    "pt-br": "Mapa Paleo",
  },
  paleoRequiresGeography: {
    comment: "Example: Geography Required",
    "en-us": "{geographyTable:string} Required",
    "ru-ru": "{geographyTable:string} Требуется",
    "es-es": "{geographyTable:string} Requerido",
    "fr-fr": "{geographyTable:string} Obligatoire",
    "uk-ua": "{geographyTable:string} Обов'язково",
    "de-ch": "{geographyTable:string} Erforderlich",
    "pt-br": "{geographyTable:string} Obrigatório",
  },
  paleoRequiresGeographyDescription: {
    "en-us":
      "The Paleo Map plugin requires that the {localityTable:string} have geographic coordinates and that the paleo context have a geographic age with at least a start time or and end time populated.",
    "de-ch":
      "Das Paleo Map-Plugin erfordert, dass {localityTable:string} geografische Koordinaten hat und dass der Paläo-Kontext ein geografisches Alter mit mindestens einer ausgefüllten Start- oder Endzeit hat.",
    "es-es": "Seleccionar fuente de tablas",
    "fr-fr":
      "Le plugin Paleo Map nécessite que les {localityTable:string} aient des coordonnées géographiques et que le contexte paléo ait un âge géographique avec au moins une heure de début ou une heure de fin renseignée.",
    "ru-ru":
      "Для работы плагина Paleo Map требуется, чтобы {localityTable:string} имел географические координаты, а палеоконтекст имел географический возраст с указанием как минимум начального и конечного времени.",
    "uk-ua":
      "Плагін Paleo Map вимагає, щоб {localityTable:string} мав географічні координати, а палеодієнтний контекст мав географічний вік із зазначенням принаймні часу початку або часу завершення.",
    "pt-br":
      "O plugin Paleo Map requer que o {localityTable:string} tenha coordenadas geográficas e que o contexto paleo tenha uma idade geográfica com pelo menos um horário de início ou término preenchidos.",
  },
  invalidDate: {
    "en-us": "Invalid Date",
    "ru-ru": "Неверная дата",
    "es-es": "Fecha invalida",
    "fr-fr": "Date invalide",
    "uk-ua": "Недійсна дата",
    "de-ch": "Ungültiges Datum",
    "pt-br": "Data inválida",
  },
  deleteConfirmation: {
    "en-us":
      "Are you sure you want to permanently delete this {tableName:string} from the database?",
    "de-ch":
      "Sind Sie sicher, dass Sie diesen {tableName:string} dauerhaft aus der Datenbank löschen möchten?",
    "es-es": "El valor debe ser exclusivo de la base de datos.",
    "fr-fr":
      "Êtes-vous sûr de vouloir supprimer définitivement ce {tableName:string} de la base de données ?",
    "ru-ru":
      "Вы уверены, что хотите навсегда удалить {tableName:string} из базы данных?",
    "uk-ua":
      "Ви впевнені, що хочете остаточно видалити цей {tableName:string} з бази даних?",
    "pt-br":
      "Tem certeza de que deseja excluir permanentemente este {tableName:string} do banco de dados?",
  },
  deleteConfirmationDescription: {
    "en-us": "This action cannot be undone.",
    "ru-ru": "Это действие не может быть отменено.",
    "es-es": "Esta acción no se puede deshacer.",
    "fr-fr": "Cette action ne peut pas être annulée.",
    "uk-ua": "Цю дію не можна скасувати.",
    "de-ch": "Diese Aktion kann nicht rückgängig gemacht werden.",
    "pt-br": "Esta ação não pode ser desfeita.",
  },
  datePrecision: {
    "en-us": "Date Precision",
    "ru-ru": "Точность даты",
    "es-es": "Precisión de fecha",
    "fr-fr": "Précision de la date",
    "uk-ua": "Точність дати",
    "de-ch": "Datumsgenauigkeit",
    "pt-br": "Precisão de data",
  },
  monthYear: {
    comment: `
      A placeholder for partial date field when "month /year" type is selected.
      Visible only in browsers that don\'t support the "month" input type.
    `,
    "en-us": "Mon / Year",
    "ru-ru": "Пн / Год",
    "es-es": "Usar configuraciones personalizadas",
    "fr-fr": "Lun / Année",
    "uk-ua": "Пн / Рік",
    "de-ch": "Mo / Jahr",
    "pt-br": "Seg / Ano",
  },
  yearPlaceholder: {
    comment:
      'A placeholder for partial date field when "year" type is selected',
    "en-us": "YYYY",
    "ru-ru": "ГГГГ",
    "es-es": "AAAA",
    "fr-fr": "AAAA",
    "uk-ua": "РРРР",
    "de-ch": "JJJJ",
    "pt-br": "AAAA",
  },
  today: {
    "en-us": "Today",
    "ru-ru": "Сегодня",
    "es-es": "Hoy",
    "fr-fr": "Aujourd'hui",
    "uk-ua": "Сьогодні",
    "de-ch": "Heute",
    "pt-br": "Hoje",
  },
  todayButtonDescription: {
    "en-us": "Set to current date",
    "ru-ru": "Установить на текущую дату",
    "es-es": "Establecer en fecha actual",
    "fr-fr": "Définir sur la date du jour",
    "uk-ua": "Встановити на поточну дату",
    "de-ch": "Auf aktuelles Datum einstellen",
    "pt-br": "Definir para a data atual",
  },
  addToPickListConfirmation: {
    "en-us": "Add to {pickListTable:string}?",
    "ru-ru": "Добавить в {pickListTable:string}?",
    "es-es": "¿Añadir a {pickListTable:string}?",
    "fr-fr": "Ajouter à {pickListTable:string} ?",
    "uk-ua": "Додати до {pickListTable:string}?",
    "de-ch": "Zu {pickListTable:string} hinzufügen?",
    "pt-br": "Adicionar a {pickListTable:string}?",
  },
  addToPickListConfirmationDescription: {
    "en-us":
      'Add value "{value:string}" to the {pickListTable:string} named "{pickListName:string}"?',
    "de-ch":
      "Wert „{value:string}“ zum {pickListTable:string} mit dem Namen „{pickListName:string}“ hinzufügen?",
    "es-es":
      '¿Agregar valor "{value:string}" al {pickListTable:string} llamado "{pickListName:string}"?',
    "fr-fr":
      "Ajouter la valeur « {value:string} » au {pickListTable:string} nommé « {pickListName:string} » ?",
    "ru-ru":
      "Добавить значение «{value:string}» к {pickListTable:string} с именем «{pickListName:string}»?",
    "uk-ua":
      'Додати значення "{value:string}" до {pickListTable:string} з назвою "{pickListName:string}"?',
    "pt-br":
      'Adicionar valor "{value:string}" ao {pickListTable:string} chamado "{pickListName:string}"?',
  },
  invalidType: {
    "en-us": "Invalid Type",
    "ru-ru": "Неверный тип",
    "es-es": "Tipo inválido",
    "fr-fr": "Type invalide",
    "uk-ua": "Недійсний тип",
    "de-ch": "Ungültiger Typ",
    "pt-br": "Tipo inválido",
  },
  invalidNumericPicklistValue: {
    "en-us": "Only numeric values are supported in this {pickListTable:string}",
    "de-ch":
      "Es werden nur numerische Werte unterstützt {pickListTable:string}",
    "es-es": "En este {pickListTable:string} solo se admiten valores numéricos",
    "fr-fr":
      "Seules les valeurs numériques sont prises en charge dans ce {pickListTable:string}",
    "ru-ru":
      "В этом {pickListTable:string} поддерживаются только числовые значения.",
    "uk-ua":
      "У цьому {pickListTable:string} підтримуються лише числові значення",
    "pt-br":
      "Somente valores numéricos são suportados neste {pickListTable:string}",
  },
  noData: {
    "en-us": "No Data.",
    "ru-ru": "Нет данных.",
    "es-es": "Sin datos.",
    "fr-fr": "Aucune donnée.",
    "uk-ua": "Немає даних.",
    "de-ch": "Keine Daten.",
    "pt-br": "Nenhum dado.",
  },
  recordSetDeletionWarning: {
    "en-us":
      'The {recordSetTable:string} "{recordSetName:string}" will be deleted. The referenced records will NOT be deleted from the database.',
    "ru-ru":
      '{recordSetTable:string} "{recordSetName:string}" будет удалён. Связанные с этим записи НЕ будут удалены из базы данных.',
    "es-es":
      'Se eliminará el {recordSetTable:string} "{recordSetName:string}". Los registros referenciados no se eliminarán de la base de datos.',
    "fr-fr":
      "Le {recordSetTable:string} « {recordSetName:string} » sera supprimé. Les enregistrements référencés ne seront PAS supprimés de la base de données.",
    "uk-ua":
      '{recordSetTable:string} "{recordSetName:string}" буде видалено. Записи, на які посилаються, НЕ будуть видалені з бази даних.',
    "de-ch":
      'Der {recordSetTable:string} "{recordSetName:string}" wird gelöscht. Die referenzierten Datensätze werden NICHT aus der Datenbank gelöscht.',
    "pt-br":
      'O {recordSetTable:string} "{recordSetName:string}" será excluído. Os registros referenciados NÃO serão excluídos do banco de dados.',
  },
  saveRecordFirst: {
    "en-us": "Save record first",
    "ru-ru": "Сначала сохраните запись",
    "es-es": "Guardar el registro primero",
    "fr-fr": "Enregistrer d'abord l'enregistrement",
    "uk-ua": "Спочатку збережіть запис",
    "de-ch": "Datensatz zuerst speichern",
    "pt-br": "Salvar registro primeiro",
  },
  firstRecord: {
    "en-us": "First Record",
    "ru-ru": "Первая запись",
    "es-es": "Primer disco",
    "fr-fr": "Premier enregistrement",
    "uk-ua": "Перший запис",
    "de-ch": "Erster Eintrag",
    "pt-br": "Primeiro Registro",
  },
  lastRecord: {
    "en-us": "Last Record",
    "ru-ru": "Последняя запись",
    "es-es": "Último registro",
    "fr-fr": "Dernier enregistrement",
    "uk-ua": "Останній запис",
    "de-ch": "Letzter Datensatz",
    "pt-br": "Último registro",
  },
  previousRecord: {
    "en-us": "Previous Record",
    "ru-ru": "Предыдущая запись",
    "es-es": "Registro anterior",
    "fr-fr": "Record précédent",
    "uk-ua": "Попередній запис",
    "de-ch": "Vorheriger Datensatz",
    "pt-br": "Registro anterior",
  },
  nextRecord: {
    "en-us": "Next Record",
    "ru-ru": "Следующая запись",
    "es-es": "Próximo récord",
    "fr-fr": "Prochain enregistrement",
    "uk-ua": "Наступний запис",
    "de-ch": "Nächster Datensatz",
    "pt-br": "Próximo registro",
  },
  currentRecord: {
    "en-us": "Current object (out of {total:number|formatted})",
    "ru-ru": "Текущий объект (из {total:number|formatted})",
    "es-es": "Objeto actual (de {total:number|formatted})",
    "fr-fr": "Objet actuel (sur {total:number|formatted})",
    "uk-ua": "Поточний об'єкт (з {total:number|formatted})",
    "de-ch": "Aktuelles Objekt (aus {total:number|formatted})",
    "pt-br": "Objeto atual (de {total:number|formatted})",
  },
  unsavedFormUnloadProtect: {
    "en-us": "This form has not been saved.",
    "ru-ru": "Эта форма не была сохранена.",
    "es-es": "Este formulario no ha sido guardado.",
    "fr-fr": "Ce formulaire n'a pas été enregistré.",
    "uk-ua": "Цю форму не збережено.",
    "de-ch": "Dieses Formular wurde nicht gespeichert.",
    "pt-br": "Este formulário não foi salvo.",
  },
  saveConflict: {
    comment: "Meaning a conflict occurred when saving",
    "en-us": "Save conflict",
    "ru-ru": "Сохранить конфликт",
    "es-es": "Guardar conflicto",
    "fr-fr": "Enregistrer le conflit",
    "uk-ua": "Зберегти конфлікт",
    "de-ch": "Konflikt speichern",
    "pt-br": "Salvar conflito",
  },
  saveConflictDescription: {
    "en-us":
      "The data shown on this page has been changed by another user or in another browser tab and is out of date. The page must be reloaded to prevent inconsistent data from being saved.",
    "ru-ru":
      "Данные на этой странице были изменены другим пользователем или на другой вкладке браузера и устарели. Для предотвращения сохранения несоответствующих данных необходимо перезагрузить страницу.",
    "es-es":
      "Los datos que se muestran en esta página han sido modificados por otro usuario o en otra pestaña del navegador y están desactualizados. Es necesario recargar la página para evitar que se guarden datos incoherentes.",
    "fr-fr":
      "Les données affichées sur cette page ont été modifiées par un autre utilisateur ou dans un autre onglet du navigateur et sont obsolètes. La page doit être rechargée pour éviter l'enregistrement de données incohérentes.",
    "uk-ua":
      "Дані, що відображаються на цій сторінці, були змінені іншим користувачем або в іншій вкладці браузера та застарілі. Сторінку необхідно перезавантажити, щоб запобігти збереженню невідповідних даних.",
    "de-ch":
      "Die auf dieser Seite angezeigten Daten wurden von einem anderen Benutzer oder in einem anderen Browser-Tab geändert und sind veraltet. Um die Speicherung inkonsistenter Daten zu verhindern, muss die Seite neu geladen werden.",
    "pt-br":
      "Os dados exibidos nesta página foram alterados por outro usuário ou em outra aba do navegador e estão desatualizados. A página deve ser recarregada para evitar que dados inconsistentes sejam salvos.",
  },
  saveBlocked: {
    "en-us": "Save blocked",
    "de-ch": "Speichern blockiert",
    "es-es": "Guardar bloqueado",
    "fr-fr": "Enregistrer bloqué",
    "ru-ru": "Сохранить заблокировано",
    "uk-ua": "Зберегти заблоковано",
    "pt-br": "Salvar bloqueado",
  },
  saveBlockedDescription: {
    "en-us": "Form cannot be saved because of the following error:",
    "ru-ru": "Форму невозможно сохранить из-за следующей ошибки:",
    "es-es": "No se puede guardar el formulario debido al siguiente error:",
    "fr-fr":
      "Le formulaire ne peut pas être enregistré en raison de l'erreur suivante :",
    "uk-ua": "Форму неможливо зберегти через таку помилку:",
    "de-ch":
      "Das Formular kann aufgrund des folgenden Fehlers nicht gespeichert werden:",
    "pt-br": "O formulário não pode ser salvo devido ao seguinte erro:",
  },
  unavailableCommandButton: {
    "en-us": "Command N/A",
    "ru-ru": "Команда N/A",
    "es-es": "Comando N/A",
    "fr-fr": "Commande N/A",
    "uk-ua": "Команда Немає",
    "de-ch": "Befehl N/A",
    "pt-br": "Comando N/A",
  },
  commandUnavailable: {
    "en-us": "Command Not Available",
    "ru-ru": "Команда недоступна",
    "es-es": "Comando no disponible",
    "fr-fr": "Commande non disponible",
    "uk-ua": "Команда недоступна",
    "de-ch": "Befehl nicht verfügbar",
    "pt-br": "Comando não disponível",
  },
  commandUnavailableDescription: {
    "en-us": "This command is currently unavailable for Specify 7.",
    "ru-ru": "Эта команда в настоящее время недоступна для Specify 7.",
    "es-es": "Este comando no está disponible actualmente para Specify 7.",
    "uk-ua": "Ця команда наразі недоступна для Specify 7.",
    "de-ch": "Dieser Befehl ist derzeit für Specify 7 nicht verfügbar.",
    "fr-fr": "Cette commande n'est actuellement pas disponible pour Specify 7.",
    "pt-br": "Este comando não está disponível no momento para o Specify 7.",
  },
  commandUnavailableSecondDescription: {
    "en-us":
      "It was probably included on this form from Specify 6 and may be supported in the future.",
    "ru-ru":
      "Вероятно, он был включен в эту форму из Specify 6 и может поддерживаться в будущем.",
    "es-es":
      "Probablemente se incluyó en este formulario de la Especificación 6 y es posible que se admita en el futuro.",
    "fr-fr":
      "Il a probablement été inclus dans ce formulaire à partir de Specify 6 et peut être pris en charge à l'avenir.",
    "uk-ua":
      "Ймовірно, це було включено до цієї форми з Specify 6 і може бути підтримано в майбутньому.",
    "de-ch":
      "Es war wahrscheinlich in diesem Formular von Specify 6 enthalten und wird möglicherweise in Zukunft unterstützt.",
    "pt-br":
      "Provavelmente foi incluído neste formulário do Specify 6 e pode ser suportado no futuro.",
  },
  commandName: {
    "en-us": "Command name",
    "ru-ru": "Имя команды",
    "es-es": "Nombre del comando",
    "fr-fr": "Nom de la commande",
    "uk-ua": "Назва команди",
    "de-ch": "Befehlsname",
    "pt-br": "Nome do comando",
  },
  unavailablePluginButton: {
    "en-us": "Plugin N/A",
    "ru-ru": "Плагин N/A",
    "es-es": "Complemento N/A",
    "fr-fr": "Plugin N/A",
    "uk-ua": "Плагін Немає",
    "de-ch": "Plugin N/A",
    "pt-br": "Plugin N/A",
  },
  pluginNotAvailable: {
    "en-us": "Plugin Not Available",
    "ru-ru": "Плагин недоступен",
    "es-es": "Complemento no disponible",
    "fr-fr": "Plugin non disponible",
    "uk-ua": "Плагін недоступний",
    "de-ch": "Plugin nicht verfügbar",
    "pt-br": "Plugin não disponível",
  },
  pluginNotAvailableDescription: {
    "en-us": "This plugin is currently unavailable for Specify 7",
    "ru-ru": "Этот плагин в настоящее время недоступен для Specify 7.",
    "es-es": "Este complemento no está disponible actualmente para Specify 7",
    "fr-fr": "Ce plugin n'est actuellement pas disponible pour Specify 7",
    "uk-ua": "Цей плагін наразі недоступний для Specify 7",
    "de-ch": "Dieses Plugin ist derzeit für Specify 7 nicht verfügbar",
    "pt-br": "Este plugin não está disponível no momento para o Specify 7",
  },
  wrongTableForPlugin: {
    comment:
      "Example: ... Locality, Collecting Event or Collection Object forms.",
    "en-us":
      "This plugin cannot be used on the {currentTable:string} form. Try moving it to the {supportedTables:string} forms.",
    "ru-ru":
      "Этот плагин нельзя использовать на форме {currentTable:string}. Попробуйте перенести его на формы {supportedTables:string}.",
    "es-es":
      "Este complemento no se puede utilizar en el formulario {currentTable:string}. Intente moverlo a los formularios {supportedTables:string}.",
    "fr-fr":
      "Ce plugin ne peut pas être utilisé sur le formulaire {currentTable:string}. Essayez de le déplacer vers les formulaires {supportedTables:string}.",
    "uk-ua":
      "Цей плагін не можна використовувати на формі {currentTable:string}. Спробуйте перемістити його на форми {supportedTables:string}.",
    "de-ch":
      "Dieses Plugin kann nicht im Formular {currentTable:string} verwendet werden. Versuchen Sie, es in die Formulare {supportedTables:string} zu verschieben.",
    "pt-br":
      "Este plugin não pode ser usado no formulário {currentTable:string}. Tente movê-lo para os formulários {supportedTables:string}.",
  },
  wrongTableForCommand: {
    "en-us":
      "The command cannot be used on the {currentTable:string} form. It can only be used on the {correctTable:string} form.",
    "ru-ru":
      "Эту команду нельзя использовать в форме {currentTable:string}. Её можно использовать только в форме {correctTable:string}.",
    "es-es":
      "El comando no se puede utilizar en el formulario {currentTable:string}. Sólo se puede utilizar en el formulario {correctTable:string}.",
    "fr-fr":
      "La commande ne peut pas être utilisée sur le formulaire {currentTable:string}. Elle ne peut être utilisée que sur le formulaire {correctTable:string}.",
    "uk-ua":
      "Команду не можна використовувати у формі {currentTable:string}. Її можна використовувати лише у формі {correctTable:string}.",
    "de-ch":
      "Der Befehl kann nicht auf dem Formular {currentTable:string} verwendet werden. Er kann nur auf dem Formular {correctTable:string} verwendet werden.",
    "pt-br":
      "O comando não pode ser usado no formato {currentTable:string}. Ele só pode ser usado no formato {correctTable:string}.",
  },
  pluginName: {
    "en-us": "Plugin name",
    "ru-ru": "Имя плагина",
    "es-es": "Nombre del complemento",
    "fr-fr": "Nom du plugin",
    "uk-ua": "Назва плагіна",
    "de-ch": "Plugin-Name",
    "pt-br": "Nome do plugin",
  },
  illegalBool: {
    comment: `
      Yes/No probably shouldn't be translated as Specify 7 does not support
      changing which values are recognized as Yes/No in a given language
    `,
    "en-us": "Illegal value for a Yes/No field",
    "ru-ru": "Недопустимое значение для поля «Да/Нет»",
    "es-es": "Valor ilegal para un campo Sí/No",
    "fr-fr": "Valeur illégale pour un champ Oui/Non",
    "uk-ua": "Неприпустиме значення для поля «Так/Ні»",
    "de-ch": "Unzulässiger Wert für ein Ja/Nein-Feld",
    "pt-br": "Valor ilegal para um campo Sim/Não",
  },
  requiredField: {
    "en-us": "Field is required.",
    "ru-ru": "Поле обязательно для заполнения.",
    "es-es": "Se requiere campo.",
    "fr-fr": "Le champ est obligatoire.",
    "uk-ua": "Поле обов'язкове для заповнення.",
    "de-ch": "Pflichtfeld.",
    "pt-br": "Campo obrigatório.",
  },
  invalidValue: {
    "en-us": "Invalid value",
    "ru-ru": "Недопустимое значение",
    "es-es": "Hoy",
    "fr-fr": "Valeur invalide",
    "uk-ua": "Недійсне значення",
    "de-ch": "Ungültiger Wert",
    "pt-br": "Valor inválido",
  },
  requiredFormat: {
    comment: "Used in field validation messages on the form",
    "en-us": "Required Format: {format:string}.",
    "ru-ru": "Требуемый формат: {format:string}.",
    "es-es": "Formato requerido: {format:string}.",
    "fr-fr": "Format requis : {format:string}.",
    "uk-ua": "Необхідний формат: {format:string}.",
    "de-ch": "Erforderliches Format: {format:string}.",
    "pt-br": "Formato necessário: {format:string}.",
  },
  inputTypeNumber: {
    "en-us": "Value must be a number",
    "ru-ru": "Значение должно быть числом.",
    "es-es": "El valor debe ser un número.",
    "uk-ua": "Значення має бути числом",
    "de-ch": "Der Wert muss eine Zahl sein",
    "fr-fr": "La valeur doit être un nombre",
    "pt-br": "O valor deve ser um número",
  },
  organization: {
    "en-us": "Organization",
    "ru-ru": "Организация",
    "es-es": "Organización",
    "fr-fr": "Organisation",
    "uk-ua": "Організація",
    "de-ch": "Organisation",
    "pt-br": "Organização",
  },
  person: {
    "en-us": "Person",
    "ru-ru": "Человек",
    "es-es": "Persona",
    "fr-fr": "Personne",
    "uk-ua": "Людина",
    "de-ch": "Person",
    "pt-br": "Pessoa",
  },
  other: {
    "en-us": "Other",
    "ru-ru": "Другой",
    "es-es": "Otro",
    "fr-fr": "Autre",
    "uk-ua": "Інше",
    "de-ch": "Andere",
    "pt-br": "Outro",
  },
  group: {
    "en-us": "Group",
    "ru-ru": "Группа",
    "es-es": "Grupo",
    "fr-fr": "Groupe",
    "uk-ua": "Група",
    "de-ch": "Gruppe",
    "pt-br": "Grupo",
  },
  userDefinedItems: {
    "en-us": "User Defined Items",
    "ru-ru": "Элементы, определяемые пользователем",
    "es-es": "Elementos definidos por el usuario",
    "fr-fr": "Éléments définis par l'utilisateur",
    "uk-ua": "Елементи, визначені користувачем",
    "de-ch": "Benutzerdefinierte Elemente",
    "pt-br": "Itens definidos pelo usuário",
  },
  entireTable: {
    "en-us": "Entire Table",
    "ru-ru": "Вся таблица",
    "es-es": "Tabla entera",
    "fr-fr": "Tableau entier",
    "uk-ua": "Вся таблиця",
    "de-ch": "Gesamte Tabelle",
    "pt-br": "Mesa inteira",
  },
  fieldFromTable: {
    "en-us": "Field From Table",
    "ru-ru": "Поле из таблицы",
    "es-es": "Campo de la tabla",
    "fr-fr": "Champ de la table",
    "uk-ua": "Поле з таблиці",
    "de-ch": "Feld aus Tabelle",
    "pt-br": "Campo da Tabela",
  },
  unsupportedCellType: {
    "en-us": "Unsupported cell type",
    "ru-ru": "Неподдерживаемый тип ячейки",
    "es-es": "Tipo de celda no compatible",
    "fr-fr": "Type de cellule non pris en charge",
    "uk-ua": "Непідтримуваний тип клітинки",
    "de-ch": "Nicht unterstützter Zelltyp",
    "pt-br": "Tipo de célula não suportado",
  },
  additionalResultsOmitted: {
    comment: `
      Represents truncated search dialog output (when lots of results returned)
    `,
    "en-us": "Additional results omitted",
    "ru-ru": "Дополнительные результаты пропущены",
    "es-es": "Resultados adicionales omitidos",
    "fr-fr": "Résultats supplémentaires omis",
    "uk-ua": "Додаткові результати пропущені",
    "de-ch": "Weitere Ergebnisse ausgelassen",
    "pt-br": "Resultados adicionais omitidos",
  },
  recordSelectorUnloadProtect: {
    "en-us": "Proceed without saving?",
    "ru-ru": "Продолжить без сохранения?",
    "es-es": "¿Continuar sin guardar?",
    "fr-fr": "Continuer sans enregistrer ?",
    "uk-ua": "Продовжити без збереження?",
    "de-ch": "Ohne Speichern fortfahren?",
    "pt-br": "Continuar sem salvar?",
  },
  recordSelectorUnloadProtectDescription: {
    comment: `
      When in record set and current record is unsaved and try to navigate to
      another record
    `,
    "en-us": "You might want to save this record before navigating away.",
    "ru-ru": "Возможно, вы захотите сохранить эту запись, прежде чем уйти.",
    "es-es": "Es posible que desees guardar este registro antes de navegar.",
    "fr-fr":
      "Vous souhaiterez peut-être sauvegarder cet enregistrement avant de partir.",
    "uk-ua":
      "Можливо, ви захочете зберегти цей запис, перш ніж залишати сторінку.",
    "de-ch":
      "Möglicherweise möchten Sie diesen Datensatz speichern, bevor Sie wegnavigieren.",
    "pt-br": "Talvez você queira salvar este registro antes de sair navegando.",
  },
  creatingNewRecord: {
    "en-us": "Creating new record",
    "ru-ru": "Создание новой записи",
    "es-es": "Creando nuevo registro",
    "fr-fr": "Création d'un nouvel enregistrement",
    "uk-ua": "Створення нового запису",
    "de-ch": "Neuen Datensatz erstellen",
    "pt-br": "Criando novo registro",
  },
  createNewRecordSet: {
    "en-us": "Create a new record set",
    "ru-ru": "Создать новый набор записей",
    "es-es": "Crear un nuevo conjunto de registros",
    "fr-fr": "Créer un nouvel ensemble d'enregistrements",
    "uk-ua": "Створити новий набір записів",
    "de-ch": "Erstellen Sie einen neuen Datensatz",
    "pt-br": "Criar um novo conjunto de registros",
  },
  forward: {
    "en-us": "Forward",
    "ru-ru": "Вперед",
    "es-es": "Adelante",
    "fr-fr": "Avant",
    "uk-ua": "Вперед",
    "de-ch": "Nach vorne",
    "pt-br": "Avançar",
  },
  reverse: {
    "en-us": "Reverse",
    "ru-ru": "Обеспечить регресс",
    "es-es": "Contrarrestar",
    "fr-fr": "Inverse",
    "uk-ua": "Зворотний",
    "de-ch": "Umkehren",
    "pt-br": "Reverter",
  },
  deletedInline: {
    "en-us": "(deleted)",
    "ru-ru": "(удалено)",
    "es-es": "(eliminado)",
    "fr-fr": "(supprimé)",
    "uk-ua": "(видалено)",
    "de-ch": "(gestrichen)",
    "pt-br": "(apagado)",
  },
  duplicateRecordSetItem: {
    comment: "Example: Duplicate Record Set Item",
    "en-us": "Duplicate {recordSetItemTable:string}",
    "ru-ru": "Дубликат {recordSetItemTable:string}",
    "es-es": "Duplicado {recordSetItemTable:string}",
    "uk-ua": "Дублікат {recordSetItemTable:string}",
    "de-ch": "Duplikat {recordSetItemTable:string}",
    "fr-fr": "Dupliquer {recordSetItemTable:string}",
    "pt-br": "Duplicado {recordSetItemTable:string}",
  },
  duplicateRecordSetItemDescription: {
    "en-us":
      "This record is already present in the current {recordSetTable:string}",
    "ru-ru": "Эта запись уже присутствует в текущем {recordSetTable:string}",
    "es-es":
      "Este registro ya está presente en el actual {recordSetTable:string}",
    "fr-fr":
      "Cet enregistrement est déjà présent dans le {recordSetTable:string} actuel",
    "uk-ua": "Цей запис вже присутній у поточному {recordSetTable:string}",
    "de-ch":
      "Dieser Datensatz ist bereits im aktuellen {recordSetTable:string} vorhanden.",
    "pt-br": "Este registro já está presente no atual {recordSetTable:string}",
  },
  addToRecordSet: {
    "en-us": "Add to {recordSetTable:string}",
    "ru-ru": "Добавить в {recordSetTable:string}",
    "es-es": "Añadir a {recordSetTable:string}",
    "fr-fr": "Ajouter à {recordSetTable:string}",
    "uk-ua": "Додати до {recordSetTable:string}",
    "de-ch": "Hinzufügen zu {recordSetTable:string}",
    "pt-br": "Adicionar a {recordSetTable:string}",
  },
  removeFromRecordSet: {
    "en-us": "Remove from {recordSetTable:string}",
    "ru-ru": "Удалить из {recordSetTable:string}",
    "es-es": "Eliminar de {recordSetTable:string}",
    "fr-fr": "Supprimer de {recordSetTable:string}",
    "uk-ua": "Видалити з {recordSetTable:string}",
    "de-ch": "Entfernen aus {recordSetTable:string}",
    "pt-br": "Remover de {recordSetTable:string}",
  },
  nothingFound: {
    "en-us": "Nothing found",
    "ru-ru": "Ничего не найдено",
    "es-es": "No se encontró nada",
    "fr-fr": "Rien trouvé",
    "uk-ua": "Нічого не знайдено",
    "de-ch": "Nichts gefunden",
    "pt-br": "Nada encontrado",
  },
  carryForward: {
    comment: "Verb. Button label",
    "en-us": "Carry Forward",
    "ru-ru": "Перенести вперед",
    "es-es": "Llevar adelante",
    "fr-fr": "Reporter",
    "uk-ua": "Перенести далі",
    "de-ch": "Übertrag",
    "pt-br": "Levar adiante",
  },
  carryForwardEnabled: {
    "en-us": "Show Carry Forward button",
    "ru-ru": "Показать кнопку «Перенести вперед»",
    "es-es": "Mostrar el botón Llevar adelante",
    "fr-fr": "Afficher le bouton de report",
    "uk-ua": "Показати кнопку «Перенести вперед»",
    "de-ch": "Schaltfläche „Übertrag anzeigen“",
    "pt-br": "Mostrar botão Transferir para frente",
  },
  bulkCarryForwardEnabled: {
    "en-us": "Show Bulk Carry Forward count",
    "de-ch": "Anzahl der Massenüberträge anzeigen",
    "es-es": "Mostrar recuento de transferencia masiva",
    "fr-fr": "Afficher le nombre de reports en masse",
    "pt-br": "Mostrar contagem de transporte em massa",
    "ru-ru": "Показать счетчик массового переноса данных",
    "uk-ua": "Показати кількість групового перенесення",
  },
  bulkCarryForwardCount: {
    "en-us": "Bulk Carry Forward count",
    "de-ch": "Anzahl der Massenüberträge",
    "es-es": "Recuento de transferencia masiva",
    "fr-fr": "Nombre de reports en masse",
    "pt-br": "Contagem de transporte de carga a granel",
    "ru-ru": "Подсчет массового переноса данных",
    "uk-ua": "Кількість перенесених даних",
  },
  carryForwardDescription: {
    "en-us": "Create a new record with certain fields carried over",
    "ru-ru": "Создайте новую запись с перенесенными определенными полями",
    "es-es": "Crear un nuevo registro con ciertos campos transferidos",
    "fr-fr": "Créer un nouvel enregistrement avec certains champs reportés",
    "uk-ua": "Створити новий запис із перенесенням певних полів",
    "de-ch":
      "Erstellen Sie einen neuen Datensatz mit bestimmten übernommenen Feldern",
    "pt-br": "Crie um novo registro com determinados campos transferidos",
  },
  carryForwardSettingsDescription: {
    "en-us": "Configure fields to carry forward",
    "ru-ru": "Настройте поля для переноса",
    "es-es": "Configurar campos para transferir",
    "fr-fr": "Configurer les champs à reporter",
    "uk-ua": "Налаштуйте поля для перенесення",
    "de-ch": "Konfigurieren der zu übertragenden Felder",
    "pt-br": "Configurar campos para levar adiante",
  },
  bulkCarryForwardSettingsDescription: {
    "en-us": "Configure fields to bulk carry forward",
    "de-ch": "Konfigurieren von Feldern für die Massenübertragung",
    "es-es": "Configurar campos para transferirlos en masa",
    "fr-fr": "Configurer les champs pour un report en masse",
    "pt-br": "Configurar campos para transporte em massa",
    "ru-ru": "Настройте поля для массового переноса",
    "uk-ua": "Налаштуйте поля для масового перенесення",
  },
  carryForwardTableSettingsDescription: {
    "en-us": "Configure fields to carry forward ({tableName:string})",
    "ru-ru": "Настройте поля для переноса ({tableName:string})",
    "es-es": "Configurar campos para transferir ({tableName:string})",
    "fr-fr": "Configurer les champs à reporter ({tableName:string})",
    "uk-ua": "Налаштуйте поля для перенесення ({tableName:string})",
    "de-ch":
      "Konfigurieren Sie die zu übertragenden Felder ({tableName:string})",
    "pt-br": "Configurar campos para levar adiante ({tableName:string})",
  },
  bulkCarryForwardTableSettingsDescription: {
    "en-us": "Configure fields to bulk carry forward ({tableName:string})",
    "de-ch":
      "Konfigurieren Sie Felder für den Massenübertrag ({tableName:string})",
    "es-es":
      "Configurar campos para transferirlos en masa ({tableName:string})",
    "fr-fr":
      "Configurer les champs pour un report en masse ({tableName:string})",
    "pt-br": "Configurar campos para transporte em massa ({tableName:string})",
    "ru-ru": "Настройте поля для массового переноса ({tableName:string})",
    "uk-ua": "Налаштуйте поля для масового перенесення ({tableName:string})",
  },
  carryForwardUniqueField: {
    "en-us": "This field must be unique. It can not be carried over",
    "ru-ru": "Это поле должно быть уникальным. Оно не может быть перенесено.",
    "es-es": "Este campo debe ser único. No se puede transferir.",
    "fr-fr": "Ce champ doit être unique. Il ne peut pas être reporté.",
    "uk-ua": "Це поле має бути унікальним. Його не можна переносити",
    "de-ch": "Dieses Feld muss eindeutig sein. Es kann nicht übertragen werden",
    "pt-br": "Este campo deve ser único. Não pode ser transferido",
  },
  carryForwardRequiredField: {
    "en-us": "This field is required. It must be carried forward",
    "ru-ru": "Это поле обязательно для заполнения. Его необходимо перенести.",
    "es-es": "Este campo es obligatorio. Debe ser transferido",
    "fr-fr": "Ce champ est obligatoire. Il doit être reporté",
    "uk-ua": "Це поле обов'язкове. Його потрібно перенести",
    "de-ch": "Dieses Feld ist erforderlich. Es muss übertragen werden",
    "pt-br": "Este campo é obrigatório. Deve ser levado adiante",
  },
  bulkCarryForwardRangeEnabled: {
    "en-us": "Show Bulk Carry Forward range",
    "de-ch": "Bereich für Massenüberträge anzeigen",
    "es-es": "Mostrar rango de transferencia masiva",
    "fr-fr": "Afficher la plage de report en masse",
    "pt-br": "Mostrar intervalo de transporte em massa",
    "ru-ru": "Показать диапазон массового переноса данных",
    "uk-ua": "Показати діапазон масового перенесення",
  },
  bulkCarryForwardRangeErrorDescription: {
    "en-us":
      "Cannot carry forward record through the specified {field:string} range.",
    "de-ch":
      "Der Datensatz kann nicht über den angegebenen Bereich {field:string} übertragen werden.",
    "es-es":
      "No se puede trasladar la grabación al rango {field:string} especificado.",
    "fr-fr":
      "Impossible de reporter l'enregistrement sur la plage {field:string} spécifiée.",
    "pt-br":
      "Não é possível levar o registro adiante através do intervalo especificado {field:string}.",
    "ru-ru":
      "Невозможно перенести запись через указанный диапазон {field:string}.",
    "uk-ua": "Неможливо перенести запис у вказаний діапазон {field:string}.",
  },
  bulkCarryForwardRangeLimitExceeded: {
    "en-us": "Range exceeds record limit of {limit:number}.",
    "de-ch":
      "Der Bereich überschreitet das Aufzeichnungslimit von {limit:number}.",
    "es-es": "El rango excede el límite de registro de {limit:number}.",
    "fr-fr": "La plage dépasse la limite d'enregistrement de {limit:number}.",
    "pt-br": "O alcance excede o limite recorde de {limit:number}.",
    "ru-ru": "Диапазон превышает предел записи {limit:number}.",
    "uk-ua": "Діапазон перевищує ліміт записів {limit:number}.",
  },
  bulkCarryForwardRangeUnsupportedRelationships: {
    "en-us":
      "Some relationships with more than one record are not currently supported by Bulk Carry Forward:",
    "de-ch":
      "Einige Beziehungen mit mehr als einem Datensatz werden derzeit von Bulk Carry Forward nicht unterstützt:",
    "es-es":
      "Algunas relaciones con más de un registro actualmente no son compatibles con Bulk Carry Forward:",
    "fr-fr":
      "Certaines relations avec plusieurs enregistrements ne sont actuellement pas prises en charge par le report en bloc :",
    "pt-br":
      "Alguns relacionamentos com mais de um registro não são suportados atualmente pelo Bulk Carry Forward:",
    "ru-ru":
      "Некоторые связи с более чем одной записью в настоящее время не поддерживаются функцией массового переноса данных:",
    "uk-ua":
      "Деякі зв'язки з кількома записами наразі не підтримуються груповим перенесенням:",
  },
  bulkCarryForwardRangeExistingRecords: {
    "en-us": "The following numbers for {field:string} are already being used:",
    "de-ch": "Folgende Nummern für {field:string} werden bereits verwendet:",
    "es-es":
      "Los siguientes números para {field:string} ya se están utilizando:",
    "fr-fr": "Les numéros suivants pour {field:string} sont déjà utilisés :",
    "pt-br": "Os seguintes números para {field:string} já estão sendo usados:",
    "ru-ru": "Следующие номера для {field:string} уже используются:",
    "uk-ua": "Наступні номери для {field:string} вже використовуються:",
  },
  bulkCarryForwardRangeStart: {
    "en-us": "Carry Forward Range Start",
    "de-ch": "Übertragsbereichsanfang",
    "es-es": "Arranque del rango de transferencia hacia adelante",
    "fr-fr": "Début de la plage de report",
    "pt-br": "Início do intervalo de transporte",
    "ru-ru": "Начало диапазона переноса вперед",
    "uk-ua": "Початок діапазону перенесення вперед",
  },
  bulkCarryForwardRangeEnd: {
    "en-us": "Carry Forward Range End",
    "de-ch": "Übertragsbereichsende",
    "es-es": "Fin del rango de arrastre",
    "fr-fr": "Fin de la plage de report",
    "pt-br": "Fim do intervalo de transporte para frente",
    "ru-ru": "Конец диапазона переноса вперед",
    "uk-ua": "Кінець діапазону перенесення вперед",
  },
  createRecordSetOnBulkCarryForward: {
    "en-us": "Create record set on Bulk Carry Forward",
    "de-ch": "Datensatz für Massenübertrag erstellen",
    "es-es": "Crear un conjunto de registros en la transferencia masiva",
    "fr-fr": "Créer un ensemble d'enregistrements sur le report en masse",
    "pt-br": "Criar conjunto de registros em Bulk Carry Forward",
    "ru-ru": "Создать набор записей для массового переноса данных",
    "uk-ua": "Створення набору записів для групового перенесення",
  },
  cloneButtonEnabled: {
    "en-us": "Show Clone button",
    "ru-ru": "Показать кнопку «Клонировать»",
    "es-es": "Mostrar botón Clonar",
    "fr-fr": "Afficher le bouton Cloner",
    "uk-ua": "Кнопка «Показати клон»",
    "de-ch": "Schaltfläche „Klonen“ anzeigen",
    "pt-br": "Mostrar botão Clonar",
  },
  addButtonEnabled: {
    "en-us": "Show Add button",
    "ru-ru": "Показать кнопку «Добавить»",
    "es-es": "Mostrar el botón Agregar",
    "fr-fr": "Afficher le bouton Ajouter",
    "uk-ua": "Показати кнопку «Додати»",
    "de-ch": "Schaltfläche „Hinzufügen“ anzeigen",
    "pt-br": "Mostrar botão Adicionar",
  },
  addButtonDescription: {
    "en-us": "Create a new blank record",
    "ru-ru": "Создать новую пустую запись",
    "es-es": "Crear un nuevo registro en blanco",
    "fr-fr": "Créer un nouvel enregistrement vierge",
    "uk-ua": "Створити новий пустий запис",
    "de-ch": "Erstellen Sie einen neuen leeren Datensatz",
    "pt-br": "Criar um novo registro em branco",
  },
  autoNumbering: {
    "en-us": "Auto Numbering",
    "ru-ru": "Автоматическая нумерация",
    "es-es": "Numeración automática",
    "fr-fr": "Numérotation automatique",
    "uk-ua": "Автоматична нумерація",
    "de-ch": "Automatische Nummerierung",
    "pt-br": "Numeração automática",
  },
  editFormDefinition: {
    "en-us": "Edit Form Definition",
    "ru-ru": "Редактировать определение формы",
    "es-es": "Editar definición de formulario",
    "fr-fr": "Modifier la définition du formulaire",
    "uk-ua": "Редагувати визначення форми",
    "de-ch": "Formulardefinition bearbeiten",
    "pt-br": "Editar definição de formulário",
  },
  useAutoGeneratedForm: {
    "en-us": "Use Auto Generated Form",
    "ru-ru": "Использовать автоматически сгенерированную форму",
    "es-es": "Utilice el formulario generado automáticamente",
    "fr-fr": "Utiliser le formulaire généré automatiquement",
    "uk-ua": "Використати автоматично згенеровану форму",
    "de-ch": "Automatisch generiertes Formular verwenden",
    "pt-br": "Usar formulário gerado automaticamente",
  },
  useFieldLabels: {
    "en-us": "Use Localized Field Labels",
    "ru-ru": "Используйте локализованные метки полей",
    "es-es": "Utilice etiquetas de campo localizadas",
    "fr-fr": "Utiliser des étiquettes de champ localisées",
    "uk-ua": "Використовуйте локалізовані мітки полів",
    "de-ch": "Lokalisierte Feldbezeichnungen verwenden",
    "pt-br": "Use rótulos de campo localizados",
  },
  showFieldLabels: {
    "en-us": "Show Localized Field Labels",
    "de-ch": "Lokalisierte Feldbezeichnungen anzeigen",
    "es-es": "Mostrar etiquetas de campos localizados",
    "fr-fr": "Afficher les étiquettes de champ localisées",
    "ru-ru": "Показать локализованные метки полей",
    "uk-ua": "Показати локалізовані підписи полів",
    "pt-br": "Mostrar rótulos de campos localizados",
  },
  showDataModelLabels: {
    "en-us": "Show Data Model Field Names",
    "de-ch": "Datenmodell-Feldnamen anzeigen",
    "es-es": "Mostrar nombres de campos del modelo de datos",
    "fr-fr": "Afficher les noms des champs du modèle de données",
    "ru-ru": "Показать имена полей модели данных",
    "uk-ua": "Показати назви полів моделі даних",
    "pt-br": "Mostrar nomes de campos do modelo de dados",
  },
  editHistory: {
    "en-us": "Edit history",
    "ru-ru": "История редактирования",
    "es-es": "Historial de edición",
    "fr-fr": "Modifier l'historique",
    "uk-ua": "Історія редагування",
    "de-ch": "Bearbeitungsgeschichte",
    "pt-br": "Editar histórico",
  },
  editHistoryQueryName: {
    "en-us": 'Edit history for "{formattedRecord:string}"',
    "ru-ru": "История изменений для «{formattedRecord:string}»",
    "es-es": 'Historial de edición de "{formattedRecord:string}"',
    "fr-fr": "Historique des modifications pour « {formattedRecord:string} »",
    "uk-ua": 'Історія редагувань для "{formattedRecord:string}"',
    "de-ch": "Bearbeitungsverlauf für „{formattedRecord:string}“",
    "pt-br": 'Histórico de edição para "{formattedRecord:string}"',
  },
  formConfiguration: {
    "en-us": "Form Configuration",
    "ru-ru": "Конфигурация формы",
    "es-es": "Configuración del formulario",
    "fr-fr": "Configuration du formulaire",
    "uk-ua": "Конфігурація форми",
    "de-ch": "Formularkonfiguration",
    "pt-br": "Configuração do formulário",
  },
  formState: {
    "en-us": "Form State",
    "ru-ru": "Форма государства",
    "es-es": "Estado del formulario",
    "fr-fr": "État du formulaire",
    "uk-ua": "Стан форми",
    "de-ch": "Formularstatus",
    "pt-br": "Estado do formulário",
  },
  recordInformation: {
    "en-us": "Record Information",
    "ru-ru": "Запись информации",
    "es-es": "Información de registro",
    "fr-fr": "Informations sur le dossier",
    "uk-ua": "Інформація про запис",
    "de-ch": "Datensatzinformationen",
    "pt-br": "Informações do registro",
  },
  shareRecord: {
    "en-us": "Share Record",
    "ru-ru": "Поделиться записью",
    "es-es": "Compartir registro",
    "fr-fr": "Partager l'enregistrement",
    "uk-ua": "Поділитися записом",
    "de-ch": "Datensatz teilen",
    "pt-br": "Compartilhar registro",
  },
  findUsages: {
    "en-us": "Find usages",
    "ru-ru": "Найти случаи использования",
    "es-es": "Encuentra usos",
    "fr-fr": "Trouver des utilisations",
    "uk-ua": "Знайти вживання",
    "de-ch": "Verwendungen finden",
    "pt-br": "Encontre usos",
  },
  usagesOfPickList: {
    "en-us": 'Usages of "{pickList:string}" pick list',
    "ru-ru": "Использование списка выбора «{pickList:string}»",
    "es-es": 'Usos de la lista de selección "{pickList:string}"',
    "fr-fr": "Utilisations de la liste de sélection « {pickList:string} »",
    "uk-ua": 'Використання списку вибору "{pickList:string}"',
    "de-ch": "Verwendung der Auswahlliste „{pickList:string}“",
    "pt-br": 'Usos da lista de seleção "{pickList:string}"',
  },
  subForm: {
    "en-us": "Subform",
    "ru-ru": "Подчиненная форма",
    "es-es": "Subform",
    "fr-fr": "Sous-formulaire",
    "uk-ua": "Підформа",
    "de-ch": "Unterformular",
    "pt-br": "Subform",
  },
  formTable: {
    "en-us": "Grid",
    "ru-ru": "Сетка",
    "es-es": "Red",
    "fr-fr": "Grille",
    "uk-ua": "Сітка",
    "de-ch": "Netz",
    "pt-br": "Grade",
  },
  subviewConfiguration: {
    "en-us": "Subview",
    "ru-ru": "Подвид",
    "es-es": "Subvista",
    "uk-ua": "Підвид",
    "de-ch": "Unteransicht",
    "fr-fr": "Sous-vue",
    "pt-br": "Subvisualização",
  },
  disableReadOnly: {
    "en-us": "Disable read-only mode",
    "ru-ru": "Отключить режим только для чтения",
    "es-es": "Deshabilitar el modo de solo lectura",
    "fr-fr": "Désactiver le mode lecture seule",
    "uk-ua": "Вимкнути режим лише для читання",
    "de-ch": "Deaktivieren Sie den Nur-Lese-Modus",
    "pt-br": "Desativar modo somente leitura",
  },
  enableReadOnly: {
    "en-us": "Enable read-only mode",
    "ru-ru": "Включить режим только для чтения",
    "es-es": "Habilitar el modo de solo lectura",
    "fr-fr": "Activer le mode lecture seule",
    "uk-ua": "Увімкнути режим лише для читання",
    "de-ch": "Aktivieren Sie den Nur-Lese-Modus",
    "pt-br": "Habilitar modo somente leitura",
  },
  configureDataEntryTables: {
    "en-us": "Configure data entry tables",
    "ru-ru": "Настройте таблицы ввода данных",
    "es-es": "Configurar tablas de entrada de datos",
    "fr-fr": "Configurer les tables de saisie de données",
    "uk-ua": "Налаштування таблиць для введення даних",
    "de-ch": "Konfigurieren von Dateneingabetabellen",
    "pt-br": "Configurar tabelas de entrada de dados",
  },
  configureInteractionTables: {
    "en-us": "Configure interaction tables",
    "ru-ru": "Настроить таблицы взаимодействия",
    "es-es": "Configurar tablas de interacción",
    "fr-fr": "Configurer les tables d'interaction",
    "uk-ua": "Налаштування таблиць взаємодії",
    "de-ch": "Konfigurieren von Interaktionstabellen",
    "pt-br": "Configurar tabelas de interação",
  },
  formMeta: {
    "en-us": "Form Meta",
    "ru-ru": "Форма Мета",
    "es-es": "Meta del formulario",
    "fr-fr": "Formulaire Méta",
    "uk-ua": "Метадані форми",
    "de-ch": "Formular-Metadaten",
    "pt-br": "Formulário Meta",
  },
  newResourceTitle: {
    "en-us": "New {tableName:string}",
    "ru-ru": "Новый {tableName:string}",
    "es-es": "Nuevo {tableName:string}",
    "fr-fr": "Nouveau {tableName:string}",
    "uk-ua": "Новий {tableName:string}",
    "de-ch": "Neu {tableName:string}",
    "pt-br": "Novo {tableName:string}",
  },
  resourceFormatter: {
    comment: `
      When resource does not have a formatter defined, this formatter is used
    `,
    "en-us": "{tableName:string} #{id:number}",
    "ru-ru": "{tableName:string} #{id:number}",
    "es-es": "{tableName:string} #{id:number}",
    "fr-fr": "{tableName:string} #{id:number}",
    "uk-ua": "{tableName:string} '#{id:number}",
    "de-ch": "{tableName:string} #{id:number}",
    "pt-br": "{tableName:string} #{id:number}",
  },
  resourceDeleted: {
    "en-us": "Resource deleted",
    "ru-ru": "Ресурс удален",
    "es-es": "Recurso eliminado",
    "fr-fr": "Ressource supprimée",
    "uk-ua": "Ресурс видалено",
    "de-ch": "Ressource gelöscht",
    "pt-br": "Recurso excluído",
  },
  resourceDeletedDescription: {
    "en-us": "Item was deleted successfully.",
    "ru-ru": "Элемент был успешно удален.",
    "es-es": "El artículo fue eliminado exitosamente",
    "fr-fr": "L'élément a été supprimé avec succès.",
    "uk-ua": "Елемент успішно видалено.",
    "de-ch": "Element wurde erfolgreich gelöscht.",
    "pt-br": "O item foi excluído com sucesso.",
  },
  dateRange: {
    "en-us": "(Range: {from:string} - {to:string})",
    "ru-ru": "(Диапазон: {from:string} - {to:string})",
    "es-es": "(Rango: {from:string} - {to:string})",
    "fr-fr": "(Plage : {from:string} - {to:string})",
    "uk-ua": "(Діапазон: {from:string} - {to:string})",
    "de-ch": "(Bereich: {from:string} – {to:string})",
    "pt-br": "(Intervalo: {from:string} - {to:string})",
  },
  catalogNumberNumericFormatter: {
    comment: 'Meaning "Catalog Number Numeric formatter"',
    "en-us": "Catalog Number Numeric",
    "de-ch": "Katalognummer Numerisch",
    "es-es": "Número de catálogo numérico",
    "fr-fr": "Numéro de catalogue numérique",
    "ru-ru": "Номер каталога Цифровой",
    "uk-ua": "Номер у каталозі (числовий)",
    "pt-br": "Número de catálogo Numérico",
  },
  addCOGChildren: {
    "en-us": "Add COG Children",
    "de-ch": "COG-Kinder hinzufügen",
    "es-es": "Agregar niños COG",
    "fr-fr": "Ajouter des enfants COG",
    "pt-br": "Adicionar crianças COG",
    "ru-ru": "Добавить детей COG",
    "uk-ua": "Додати дочірні елементи COG",
  },
} as const);
