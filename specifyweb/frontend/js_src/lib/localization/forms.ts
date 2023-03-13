/**
 * Localization strings used on Forms (don't confuse this with schema
 * localization strings)
 *
 * @module
 */

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

export const formsText = createDictionary({
  forms: {
    'en-us': 'Forms',
    'ru-ru': 'Формы',
    'es-es': 'Formularios',
    'fr-fr': 'Formes',
    'uk-ua': 'Форми',
  },
  clone: {
    'en-us': 'Clone',
    'ru-ru': 'Клонировать',
    'es-es': 'Clon',
    'fr-fr': 'Cloner',
    'uk-ua': 'Клон',
  },
  cloneDescription: {
    'en-us': 'Create a full copy of current record',
    'ru-ru': 'Создать полную копию текущей записи',
    'es-es': 'Crear una copia completa del registro actual',
    'fr-fr': "Créer une copie complète de l'enregistrement actuel",
    'uk-ua': 'Створіть повну копію поточного запису',
  },
  valueMustBeUniqueToField: {
    'en-us': 'Value must be unique to {fieldName:string}',
    'ru-ru': 'Значение {fieldName:string} должно быть уникальным',
    'es-es': 'El valor debe ser único para {fieldName:string}',
    'fr-fr': 'La valeur doit être unique pour {fieldName:string}',
    'uk-ua': 'Значення має бути унікальним для {fieldName:string}',
  },
  valueMustBeUniqueToDatabase: {
    'en-us': 'Value must be unique to database',
    'ru-ru': 'Значение должно быть уникальным в базе данных',
    'es-es': 'El valor debe ser único para la base de datos',
    'fr-fr': 'La valeur doit être unique à la base de données',
    'uk-ua': 'Значення має бути унікальним в базі даних',
  },
  valuesOfMustBeUniqueToField: {
    'en-us': 'Values of {values:string} must be unique to {fieldName:string}',
    'ru-ru':
      'Значения {values:string} в {fieldName:string} должны быть уникальным',
    'es-es': `
      Los valores de {values:string} deben ser únicos para {fieldName:string}
    `,
    'fr-fr': `
      Les valeurs de {values:string} doivent être uniques à {fieldName:string}
    `,
    'uk-ua':
      'Значення {values:string} мають бути унікальними для {fieldName:string}',
  },
  valuesOfMustBeUniqueToDatabase: {
    'en-us': 'Values of {values:string} must be unique to database',
    'ru-ru': 'Значения {values:string} должны быть уникальным в базе данных',
    'es-es':
      'Los valores de {values:string} deben ser únicos para la base de datos',
    'fr-fr': `
      Les valeurs de {values:string} doivent être uniques à la base de données
    `,
    'uk-ua': 'Значення {values:string} мають бути унікальними в базі даних',
  },
  checkingIfResourceCanBeDeleted: {
    'en-us': 'Checking if resource can be deleted…',
    'ru-ru': 'Проверка возможности удаления ресурса…',
    'es-es': 'Comprobando si el recurso se puede eliminar…',
    'fr-fr': 'Vérification si la ressource peut être supprimée…',
    'uk-ua': 'Перевірка можливості видалення ресурсу…',
  },
  deleteBlocked: {
    'en-us': 'Delete blocked',
    'ru-ru': 'Удаление заблокировано',
    'es-es': 'Eliminar bloqueado',
    'fr-fr': 'Supprimer bloqué',
    'uk-ua': 'Видалення заблоковане',
  },
  deleteBlockedDescription: {
    'en-us': `
      The resource cannot be deleted because it is referenced by the following
      resources:
    `,
    'ru-ru':
      'Ресурс нельзя удалить, так как на него ссылаются следующие ресурсы:',
    'es-es': `
      El recurso no se puede eliminar porque los siguientes recursos hacen
      referencia a él:
    `,
    'fr-fr': `
      La ressource ne peut pas être supprimée car elle est référencée par les
      ressources suivantes :
    `,
    'uk-ua':
      'Ресурс не можна видалити, оскільки на нього посилаються такі ресурси:',
  },
  record: {
    'en-us': 'Record',
    'ru-ru': 'Запись',
    'es-es': 'Registro',
    'fr-fr': 'Enregistrer',
    'uk-ua': 'Запис',
  },
  relationship: {
    'en-us': 'Relationship',
    'ru-ru': 'Связь',
    'es-es': 'Relación',
    'fr-fr': 'Relation',
    'uk-ua': "Зв'язок",
  },
  paleoMap: {
    'en-us': 'Paleo Map',
    'ru-ru': 'Карта Палео',
    'es-es': 'Mapa paleolítico',
    'fr-fr': 'Carte paléo',
    'uk-ua': 'Карта Палео',
  },
  paleoRequiresGeography: {
    comment: 'Example: Geography Required',
    'en-us': '{geographyTable:string} Required',
    'ru-ru': 'Требуется {geographyTable:string}',
    'es-es': '{geographyTable:string} requerida',
    'fr-fr': '{geographyTable:string} Obligatoire',
    'uk-ua': "{geographyTable:string} обов'язкова",
  },
  paleoRequiresGeographyDescription: {
    'en-us': `
      The Paleo Map plugin requires that the {localityTable:string} have
      geographic coordinates and that the paleo context have a geographic age
      with at least a start time or and end time populated.
    `,
    'ru-ru': `
      Плагин Карта Палео требует, чтобы у {localityTable:string} были координаты
      и что палеоконтекст имеет географический возраст с заполнено как минимум
      время начала или время окончания.
    `,
    'es-es': `
      El complemento Paleo Map requiere que la {localityTable:string} tenga
      coordenadas geográficas y que el contexto paleo tenga una edad geográfica
      con al menos una hora de inicio o una hora de finalización poblada.
    `,
    'fr-fr': `
      Le plugin Paleo Map nécessite que le {localityTable:string} ait des
      coordonnées géographiques et que le contexte paléo ait un âge géographique
      avec au moins une heure de début ou une heure de fin renseignées.
    `,
    'uk-ua': `
      Плагін Paleo Map вимагає, щоб {localityTable:string} мала географічні
      координати, а палеоконтекст мав географічний вік із заповненням принаймні
      початкового або кінцевого часу.
    `,
  },
  invalidDate: {
    'en-us': 'Invalid Date',
    'ru-ru': 'Недействительная дата',
    'es-es': 'Fecha invalida',
    'fr-fr': 'Date invalide',
    'uk-ua': 'Недійсна дата',
  },
  deleteConfirmation: {
    'en-us': `
      Are you sure you want to permanently delete this {tableName:string} from
      the database?
    `,
    'ru-ru': `
      Вы уверены, что хотите навсегда удалить этот {tableName:string} из базы
      данных?
    `,
    'es-es': `
      ¿Está seguro de que desea eliminar permanentemente este
      {tableName:string} de la base de datos?
    `,
    'fr-fr': `
      Êtes-vous sûr de vouloir supprimer définitivement ce {tableName:string} de
      la base de données ?
    `,
    'uk-ua': `
      Ви впевнені, що бажаєте остаточно видалити цей {tableName:string} запис з
      бази даних?
    `,
  },
  deleteConfirmationDescription: {
    'en-us': 'This action cannot be undone.',
    'ru-ru': 'Это действие не может быть отменено.',
    'es-es': 'Esta acción no se puede deshacer.',
    'fr-fr': 'Cette action ne peut pas être annulée.',
    'uk-ua': 'Цю дію не можна скасувати.',
  },
  datePrecision: {
    'en-us': 'Date Precision',
    'ru-ru': 'Точность даты',
    'es-es': 'Precisión de fecha',
    'fr-fr': 'Précision de la date',
    'uk-ua': 'Точність дати',
  },
  monthYear: {
    comment: `
      A placeholder for partial date field when "month /year" type is selected.
      Visible only in browsers that don\'t support the "month" input type.
    `,
    'en-us': 'Mon / Year',
    'ru-ru': 'Месяц / Год',
    'es-es': 'Lunes / Año',
    'fr-fr': 'Lun / Année',
    'uk-ua': 'Міс / Рік',
  },
  yearPlaceholder: {
    comment:
      'A placeholder for partial date field when "year" type is selected',
    'en-us': 'YYYY',
    'ru-ru': 'ГГГГ',
    'es-es': 'AAAA',
    'fr-fr': 'AAAA',
    'uk-ua': 'РРРР',
  },
  today: {
    'en-us': 'Today',
    'ru-ru': 'Сегодня',
    'es-es': 'Hoy',
    'fr-fr': "Aujourd'hui",
    'uk-ua': 'Сьогодні',
  },
  todayButtonDescription: {
    'en-us': 'Set to current date',
    'ru-ru': 'Установить на текущую дату',
    'es-es': 'Establecer en la fecha actual',
    'fr-fr': 'Définir à la date actuelle',
    'uk-ua': 'Встановити поточну дату',
  },
  addToPickListConfirmation: {
    'en-us': 'Add to {pickListTable:string}?',
    'ru-ru': 'Добавить в {pickListTable:string}?',
    'es-es': '¿Agregar a la {pickListTable:string}?',
    'fr-fr': 'Ajouter à {pickListTable:string} ?',
    'uk-ua': 'Додати до {pickListTable:string}?',
  },
  addToPickListConfirmationDescription: {
    'en-us': `
      Add value "{value:string}" to the {pickListTable:string} named
      "{pickListName:string}"?
    `,
    'ru-ru': `
      Добавить значение "{value:string}" в
      {pickListTable:string} "{pickListName:string}"?
    `,
    'es-es': `
      ¿Agregar el valor "{value:string}" a la {pickListTable:string} denominada
      "{pickListName:string}"?
    `,
    'uk-ua': `
      Додати значення "{value:string}" до {pickListTable:string} під назвою
      "{pickListName:string}"?
    `,
    'fr-fr': `
      Ajouter la valeur "{value:string}" au {pickListTable:string} nommé
      "{pickListName:string}" ?
    `,
  },
  invalidType: {
    'en-us': 'Invalid Type',
    'ru-ru': 'Недействительный тип',
    'es-es': 'Tipo no válido',
    'fr-fr': 'Type invalide',
    'uk-ua': 'Недійсний тип',
  },
  invalidNumericPicklistValue: {
    'en-us': 'Only numeric values are supported in this {pickListTable:string}',
    'ru-ru':
      'В этом {pickListTable:string} допускаются только числовые значения',
    'es-es': 'Solo se admiten valores numéricos en esta {pickListTable:string}',
    'fr-fr': `
      Seules les valeurs numériques sont prises en charge dans ce
      {pickListTable:string}
    `,
    'uk-ua':
      'У цьому {pickListTable:string} підтримуються лише числові значення',
  },
  noData: {
    'en-us': 'No Data.',
    'ru-ru': 'Нет данных.',
    'es-es': 'Sin datos.',
    'fr-fr': 'Pas de données.',
    'uk-ua': 'Немає даних.',
  },
  recordSetDeletionWarning: {
    'en-us': `
      The {recordSetTable:string} "{recordSetName:string}" will be deleted. The
      referenced records will NOT be deleted from the database.
    `,
    'ru-ru': `
      {recordSetTable:string} "{recordSetName:string}" будет удален. Связанные
      записи не будут удалены из базы данных.
    `,
    'es-es': `
      Se {recordSetTable:string} de registros "{recordSetName:string}". Los
      registros a los que se hace referencia NO se eliminarán de la base de
      datos.
    `,
    'fr-fr': `
      Le {recordSetTable:string} "{recordSetName:string}" sera supprimé. Les
      enregistrements référencés ne seront PAS supprimés de la base de données.
    `,
    'uk-ua': `
      {recordSetTable:string} "{recordSetName:string}" буде видалено. Записи в
      цьому наборі записів НЕ будуть видалені з бази даних.
    `,
  },
  saveRecordFirst: {
    'en-us': 'Save record first',
    'ru-ru': 'Сначала нужко сохранить запись',
    'es-es': 'Guardar registro primero',
    'fr-fr': "Enregistrer d'abord l'enregistrement",
    'uk-ua': 'Спочатку збережіть запис',
  },
  firstRecord: {
    'en-us': 'First Record',
    'ru-ru': 'Первый объект',
    'es-es': 'primer registro',
    'fr-fr': 'Premier enregistrement',
    'uk-ua': 'Перший запис',
  },
  lastRecord: {
    'en-us': 'Last Record',
    'ru-ru': 'Последний объект',
    'es-es': 'Último registro',
    'fr-fr': 'Dernier enregistrement',
    'uk-ua': 'Останній запис',
  },
  previousRecord: {
    'en-us': 'Previous Record',
    'ru-ru': 'Последняя запись',
    'es-es': 'Récord anterior',
    'fr-fr': 'Enregistrement précédent',
    'uk-ua': 'Попередній запис',
  },
  nextRecord: {
    'en-us': 'Next Record',
    'ru-ru': 'Следующий объект',
    'es-es': 'Siguiente registro',
    'fr-fr': 'Enregistrement suivant',
    'uk-ua': 'Наступний запис',
  },
  currentRecord: {
    'en-us': 'Current object (out of {total:number|formatted})',
    'ru-ru': 'Текущий объект (из {total:number|formatted})',
    'es-es': 'Objeto actual (de {total:number|formatted})',
    'fr-fr': 'Objet actuel (hors de {total:number|formatted})',
    'uk-ua': "Поточний об'єкт (з {total:number|formatted})",
  },
  unsavedFormUnloadProtect: {
    'en-us': 'This form has not been saved.',
    'ru-ru': 'Эта форма не была сохранена.',
    'es-es': 'Este formulario no ha sido guardado.',
    'fr-fr': "Ce formulaire n'a pas été enregistré.",
    'uk-ua': 'Ця форма не збережена.',
  },
  saveConflict: {
    comment: 'Meaning a conflict occurred when saving',
    'en-us': 'Save conflict',
    'ru-ru': 'Сохранить конфликт',
    'es-es': 'Guardar conflicto',
    'fr-fr': 'Enregistrer le conflit',
    'uk-ua': 'Під час збереження стався конфлікт',
  },
  saveConflictDescription: {
    'en-us': `
      The data shown on this page has been changed by another user or in another
      browser tab and is out of date. The page must be reloaded to prevent
      inconsistent data from being saved.
    `,
    'ru-ru': `
      Данные, отображаемые на этой странице, были изменены другим
      пользователем, или другоц вкладке браузера. Страницу необходимо
      перезагрузить чтобы предотвратить сохранение несогласованных данных.
    `,
    'es-es': `
      Los datos que se muestran en esta página han sido modificados por otro
      usuario o en otra pestaña del navegador y están desactualizados. La página
      debe volver a cargarse para evitar que se guarden datos incoherentes.
    `,
    'fr-fr': `
      Les données affichées sur cette page ont été modifiées par un autre
      utilisateur ou dans un autre onglet du navigateur et sont obsolètes. La
      page doit être rechargée pour éviter l'enregistrement de données
      incohérentes.
    `,
    'uk-ua': `
      Дані, показані на цій сторінці, були змінені іншим користувачем або на
      іншій вкладці браузера тому є застарілими. Сторінку необхідно
      перезавантажити, щоб запобігти збереженню суперечливих даних.
    `,
  },
  saveBlocked: {
    'en-us': 'Save blocked',
    'ru-ru': 'Сохранение заблокировано',
    'es-es': 'Guardar bloqueado',
    'fr-fr': 'Sauvegarde bloquée',
    'uk-ua': 'Збереження заблоковано',
  },
  saveBlockedDescription: {
    'en-us': 'Form cannot be saved because of the following errors:',
    'ru-ru': 'Форма не может быть сохранена, из-за следующих ошибок:',
    'es-es':
      'El formulario no se puede guardar debido a los siguientes errores:',
    'fr-fr': `
      Le formulaire ne peut pas être enregistré en raison des erreurs suivantes
      :
    `,
    'uk-ua': 'Форму неможливо зберегти через такі помилки:',
  },
  unavailableCommandButton: {
    'en-us': 'Command N/A',
    'ru-ru': 'Команда недоступна',
    'es-es': 'Comando N/A',
    'fr-fr': 'Commande N/A',
    'uk-ua': 'Команда Н/Д',
  },
  commandUnavailable: {
    'en-us': 'Command Not Available',
    'ru-ru': 'Команда недоступна',
    'es-es': 'Comando no disponible',
    'fr-fr': 'Commande non disponible',
    'uk-ua': 'Команда недоступна',
  },
  commandUnavailableDescription: {
    'en-us': 'This command is currently unavailable for Specify 7.',
    'ru-ru': 'Эта команда в настоящее время недоступна для Specify 7.',
    'es-es': 'Este comando no está disponible actualmente para Especificar 7.',
    'fr-fr':
      "Cette commande n'est actuellement pas disponible pour Spécifier 7.",
    'uk-ua': 'Ця команда наразі недоступна для Specify 7.',
  },
  commandUnavailableSecondDescription: {
    'en-us': `
      It was probably included on this form from Specify 6 and may be supported
      in the future.
    `,
    'ru-ru': `
      Вероятно, он был включен на етой форме в Specify 6> м может бить
      поддерживаним в будущем.
    `,
    'es-es': `
      Probablemente se incluyó en este formulario de Especificar 6 y es posible
      que se admita en el futuro.
    `,
    'fr-fr': `
      Il a probablement été inclus sur ce formulaire à partir de Spécifier 6 et
      peut être pris en charge à l'avenir.
    `,
    'uk-ua': `
      Ймовірно, вона існувала на цій формі в Specify 6. Можливо вона буде
      підтримуватися в Specify 7 в майбутньому.
    `,
  },
  commandName: {
    'en-us': 'Command name',
    'ru-ru': 'Имя команды',
    'es-es': 'Nombre del comando',
    'fr-fr': 'Nom de la commande',
    'uk-ua': 'Назва команди',
  },
  unavailablePluginButton: {
    'en-us': 'Plugin N/A',
    'ru-ru': 'Плагин недоступен',
    'es-es': 'Complemento N/A',
    'fr-fr': 'Plug-in N/A',
    'uk-ua': 'Плагін Н/Д',
  },
  pluginNotAvailable: {
    'en-us': 'Plugin Not Available',
    'ru-ru': 'Плагин недоступен',
    'es-es': 'Complemento no disponible',
    'fr-fr': 'Plug-in non disponible',
    'uk-ua': 'Плагін недоступний',
  },
  pluginNotAvailableDescription: {
    'en-us': 'This plugin is currently unavailable for Specify 7',
    'ru-ru': 'Этот плагин в настоящее время недоступна для Specify 7',
    'es-es': 'Este complemento no está disponible actualmente para Specific 7',
    'fr-fr': 'Ce plugin est actuellement indisponible pour Spécifier 7',
    'uk-ua': 'Цей плагін наразі недоступний для Specify 7',
  },
  pluginNotAvailableSecondDescription: {
    'en-us': `
      It was probably included on this form from Specify 6 and may be supported
      in the future.
    `,
    'ru-ru': `
      Вероятно, он был включен на етой форме в Specify 6 м может бить
      поддерживаним в будущем.
    `,
    'es-es': `
      Probablemente se incluyó en este formulario de Especificar 6 y es posible
      que se admita en el futuro.
    `,
    'fr-fr': `
      Il a probablement été inclus sur ce formulaire à partir de Spécifier 6 et
      peut être pris en charge à l'avenir.
    `,
    'uk-ua': `
      Ймовірно, він був на цій формі в Specify 6. Він може бути доданим в
      Specify 7 в майбутньому.
    `,
  },
  wrongTableForPlugin: {
    comment:
      'Example: ... Locality, Collecting Event or Collection Object forms.',
    'en-us': `
      This plugin cannot be used on the {currentTable:string} form. Try moving
      it to the {supportedTables:string} forms.
    `,
    'ru-ru': `
      Этот плагин нельзя использовать на форме {currentTable:string}. Попробуйте
      переместить его на формы {supportedTables:string}.
    `,
    'es-es': `
      Este complemento no se puede usar en el formulario {currentTable:string}.
      Intente moverlo a los formularios {supportedTables:string}.
    `,
    'fr-fr': `
      Ce plugin ne peut pas être utilisé sur le formulaire
      {currentTable:string}. Essayez de le déplacer vers les formulaires
      {supportedTables:string}.
    `,
    'uk-ua': `
      Цей плагін не може бути використаний на формі {currentTable:string}.
      Спробуйте перемістити його на форми {supportedTables:string}.
    `,
  },
  wrongTableForCommand: {
    'en-us': `
      The command cannot be used on the {currentTable:string} form. It can only
      be used on the {correctTable:string} form.
    `,
    'ru-ru': `
      Команда не может быть использована на форме {currentTable:string}. Она
      может быть использована только на форме {correctTable:string}.
    `,
    'es-es': `
      El comando no puede utilizarse en el formulario {currentTable:string}.
      Sólo puede utilizarse en el formulario {correctTable:string}.
    `,
    'fr-fr': `
      La commande ne peut pas être utilisée sur le formulaire
      {currentTable:string}. Il ne peut être utilisé que sur le formulaire
      {correctTable:string}.
    `,
    'uk-ua': `
      Команду не можна використовувати у формі {currentTable:string}. Його можна
      використовувати лише у формі {correctTable:string}.
    `,
  },
  pluginName: {
    'en-us': 'Plugin name',
    'ru-ru': 'Название плагина',
    'es-es': 'Nombre del complemento',
    'fr-fr': 'Nom du plug-in',
    'uk-ua': 'Назва плагіна',
  },
  illegalBool: {
    comment: `
      Yes/No probably shouldn't be translated as Specify 7 does not support
      changing which values are recognized as Yes/No in a given language
    `,
    'en-us': 'Illegal value for a Yes/No field',
    'ru-ru': 'Недопустимое значение для поля Да / Нет',
    'es-es': 'Valor ilegal para un campo Sí/No',
    'fr-fr': 'Valeur illégale pour un champ Oui/Non',
    'uk-ua': 'Неприпустиме значення для поля «Yes/No»',
  },
  requiredField: {
    'en-us': 'Field is required.',
    'ru-ru': 'Поле обязательно для заполнения.',
    'es-es': 'Se requiere campo.',
    'fr-fr': 'Champ requis.',
    'uk-ua': "Поле обов'язкове.",
  },
  invalidValue: {
    'en-us': 'Invalid value',
    'ru-ru': 'Недопустимое значение',
    'es-es': 'valor no válido',
    'fr-fr': 'valeur invalide',
    'uk-ua': 'Недійсне значення',
  },
  requiredFormat: {
    comment: 'Used in field validation messages on the form',
    'en-us': 'Required Format: {format:string}.',
    'ru-ru': 'Обязательный формат: {format:string}.',
    'es-es': 'Formato requerido: {format:string}.',
    'fr-fr': 'Format requis : {format:string}.',
    'uk-ua': 'Необхідний формат: {format:string}.',
  },
  inputTypeNumber: {
    'en-us': 'Value must be a number',
    'ru-ru': 'Значение должно быть числом',
    'es-es': 'El valor debe ser un número',
    'fr-fr': 'La valeur doit être un nombre',
    'uk-ua': 'Значення має бути числом',
  },
  organization: {
    'en-us': 'Organization',
    'ru-ru': 'Организация',
    'es-es': 'Organización',
    'fr-fr': 'Organisation',
    'uk-ua': 'Організація',
  },
  person: {
    'en-us': 'Person',
    'ru-ru': 'Особа',
    'es-es': 'Persona',
    'fr-fr': 'Personne',
    'uk-ua': 'Особа',
  },
  other: {
    'en-us': 'Other',
    'ru-ru': 'Иной',
    'es-es': 'Otro',
    'fr-fr': 'Autre',
    'uk-ua': 'Інший',
  },
  group: {
    'en-us': 'Group',
    'ru-ru': 'Группа',
    'es-es': 'Grupo',
    'fr-fr': 'Groupe',
    'uk-ua': 'Група',
  },
  userDefinedItems: {
    'en-us': 'User Defined Items',
    'ru-ru': 'Пользовательские элементы',
    'es-es': 'Elementos definidos por el usuario',
    'fr-fr': "Éléments définis par l'utilisateur",
    'uk-ua': 'Елементи визначені користувачем',
  },
  entireTable: {
    'en-us': 'Entire Table',
    'ru-ru': 'Вся таблица',
    'es-es': 'Toda la mesa',
    'fr-fr': 'Tableau entier',
    'uk-ua': 'Ціла таблиця',
  },
  fieldFromTable: {
    'en-us': 'Field From Table',
    'ru-ru': 'Поле из таблицы',
    'es-es': 'Campo de la tabla',
    'fr-fr': 'Champ de la table',
    'uk-ua': 'Поле з таблиці',
  },
  unsupportedCellType: {
    'en-us': 'Unsupported cell type',
    'ru-ru': 'Неподдерживаемый тип ячейки',
    'es-es': 'Tipo de celda no compatible',
    'fr-fr': 'Type de cellule non pris en charge',
    'uk-ua': 'Непідтримуваний тип клітинки',
  },
  additionalResultsOmitted: {
    comment: `
      Represents truncated search dialog output (when lots of results returned)
    `,
    'en-us': 'Additional results omitted',
    'ru-ru': 'Дополнительные результаты опущены',
    'es-es': 'Resultados adicionales omitidos',
    'fr-fr': 'Résultats supplémentaires omis',
    'uk-ua': 'Додаткові результати обрізані',
  },
  recordSelectorUnloadProtect: {
    'en-us': 'Proceed without saving?',
    'ru-ru': 'Продолжить без сохранения?',
    'es-es': '¿Continuar sin guardar?',
    'fr-fr': 'Continuer sans sauvegarder?',
    'uk-ua': 'Продовжити без збереження?',
  },
  recordSelectorUnloadProtectDescription: {
    comment: `
      When in record set and current record is unsaved and try to navigate to
      another record
    `,
    'en-us': 'You might want to save this record before navigating away.',
    'ru-ru': 'Не забудьте сохранить эту запись, прежде чем закрыть ее.',
    'es-es': 'Es posible que desee guardar este registro antes de navegar.',
    'fr-fr': `
      Vous voudrez peut-être enregistrer cet enregistrement avant de vous
      éloigner.
    `,
    'uk-ua': 'Можливо, ви хочете зберегти цей запис, перш ніж покинути його.',
  },
  creatingNewRecord: {
    'en-us': 'Creating new record',
    'ru-ru': 'Создание новой записи',
    'es-es': 'Creando nuevo registro',
    'fr-fr': "Création d'un nouvel enregistrement",
    'uk-ua': 'Створення нового запису',
  },
  forward: {
    'en-us': 'Forward',
    'ru-ru': 'Вперед',
    'es-es': 'Hacia adelante',
    'fr-fr': 'Avant',
    'uk-ua': 'Вперед',
  },
  reverse: {
    'en-us': 'Reverse',
    'ru-ru': 'Обратный',
    'es-es': 'Marcha atrás',
    'fr-fr': 'Inverse',
    'uk-ua': 'Зворотний',
  },
  deletedInline: {
    'en-us': '(deleted)',
    'ru-ru': '(удален)',
    'es-es': '(borrado)',
    'fr-fr': '(supprimé)',
    'uk-ua': '(видалено)',
  },
  duplicateRecordSetItem: {
    comment: 'Example: Duplicate Record Set Item',
    'en-us': 'Duplicate {recordSetItemTable:string}',
    'ru-ru': 'Дублирующий {recordSetItemTable:string}',
    'es-es': 'Elemento de {recordSetItemTable:string}',
    'fr-fr': 'Dupliquer {recordSetItemTable:string}',
    'uk-ua': 'Дубльований {recordSetItemTable:string}',
  },
  duplicateRecordSetItemDescription: {
    'en-us':
      'This record is already present in the current {recordSetTable:string}',
    'ru-ru': 'Этот объект уже присутствует в текущем {recordSetTable:string}',
    'es-es':
      'Este registro ya está presente en el {recordSetTable:string} actual',
    'fr-fr': `
      Cet enregistrement est déjà présent dans le courant
      {recordSetTable:string}
    `,
    'uk-ua': 'Цей запис уже присутній у поточному {recordSetTable:string}',
  },
  addToRecordSet: {
    'en-us': 'Add to {recordSetTable:string}',
    'ru-ru': 'Добавить в {recordSetTable:string}',
    'es-es': 'Agregar al {recordSetTable:string}',
    'fr-fr': 'Ajouter à {recordSetTable:string}',
    'uk-ua': 'Додати до {recordSetTable:string}',
  },
  removeFromRecordSet: {
    'en-us': 'Remove from {recordSetTable:string}',
    'ru-ru': 'Удалить из {recordSetTable:string}',
    'es-es': 'Eliminar de {recordSetTable:string}',
    'fr-fr': 'Supprimer de {recordSetTable:string}',
    'uk-ua': 'Видалити з {recordSetTable:string}',
  },
  nothingFound: {
    'en-us': 'Nothing found',
    'ru-ru': 'Ничего не найдено',
    'es-es': 'Nada Encontrado',
    'fr-fr': "Rien n'a été trouvé",
    'uk-ua': 'Нічого не знайдено',
  },
  carryForward: {
    comment: 'Verb. Button label',
    'en-us': 'Carry Forward',
    'ru-ru': 'Перенести',
    'es-es': 'Llevar adelante',
    'fr-fr': 'Reporter',
    'uk-ua': 'Перенести',
  },
  carryForwardEnabled: {
    'en-us': 'Show Carry Forward button',
    'ru-ru': 'Показать кнопку Перенести',
    'es-es': 'Mostrar el botón Transferir',
    'fr-fr': 'Afficher le bouton Reporter',
    'uk-ua': 'Показати клавішу «Перенести»',
  },
  carryForwardDescription: {
    'en-us': 'Create a new record with certain fields carried over',
    'ru-ru': 'Создать новую запись с определенными полями, перенесенными',
    'es-es': 'Crear un nuevo registro con ciertos campos transferidos',
    'fr-fr': 'Créer un nouvel enregistrement avec certains champs reportés',
    'uk-ua': 'Створити новий запис із перенесеними певними полями',
  },
  carryForwardSettingsDescription: {
    'en-us': 'Configure fields to carry forward',
    'ru-ru': 'Настройте поля для клонирования',
    'es-es': 'Configurar campos para transferir',
    'fr-fr': 'Configurer les champs à reporter',
    'uk-ua': 'Налаштувати поля для перенесення',
  },
  carryForwardTableSettingsDescription: {
    'en-us': 'Configure fields to carry forward ({tableName:string})',
    'ru-ru': 'Настройте поля для клонирования ({tableName:string})',
    'es-es': 'Configurar los campos a transferir ({tableName:string})',
    'fr-fr': 'Configurer les champs à reporter ({tableName:string})',
    'uk-ua': 'Налаштувати поля для перенесення ({tableName:string})',
  },
  carryForwardUniqueField: {
    'en-us': 'This field must be unique. It can not be carried over',
    'ru-ru': 'Это поле должно быть уникальным. Оно не может быть перенесено',
    'es-es': 'Este campo debe ser único. No se puede traspasar',
    'fr-fr': 'Ce champ doit être unique. Il ne peut pas être reporté',
    'uk-ua': 'Це поле має бути унікальним. Його не можна переносити',
  },
  cloneButtonEnabled: {
    'en-us': 'Show Clone button',
    'ru-ru': 'Показать кнопку клонирования',
    'es-es': 'Mostrar botón Clonar',
    'fr-fr': 'Afficher le bouton Cloner',
    'uk-ua': 'Показувати клавішу "Клон"',
  },
  addButtonEnabled: {
    'en-us': 'Show Add button',
    'ru-ru': 'Показать кнопку добавления',
    'es-es': 'Mostrar el botón Agregar',
    'fr-fr': 'Afficher le bouton Ajouter',
    'uk-ua': 'Показувати клавішу «Додати»',
  },
  addButtonDescription: {
    'en-us': 'Create a new blank record',
    'ru-ru': 'Создать новую пустую запись',
    'es-es': 'Crear un nuevo registro en blanco',
    'fr-fr': 'Créer un nouvel enregistrement vierge',
    'uk-ua': 'Створіть новий пустий запис',
  },
  autoNumbering: {
    'en-us': 'Auto Numbering',
    'ru-ru': 'Автонумерация',
    'es-es': 'Numeración automática',
    'fr-fr': 'Numérotation automatique',
    'uk-ua': 'Автоматична нумерація',
  },
  editFormDefinition: {
    'en-us': 'Edit Form Definition',
    'ru-ru': 'Редактировать схему формы',
    'es-es': 'Editar definición de formulario',
    'fr-fr': 'Modifier la définition du formulaire',
    'uk-ua': 'Редагувати визначення форми',
  },
  useAutoGeneratedForm: {
    'en-us': 'Use Auto Generated Form',
    'ru-ru': 'Использовать автоматическую схему формы',
    'es-es': 'Usar formulario generado automáticamente',
    'fr-fr': 'Utiliser le formulaire généré automatiquement',
    'uk-ua': 'Використовувати автоматично створену форму',
  },
  useFieldLabels: {
    'en-us': 'Use localized field labels',
    'ru-ru': 'Использовать локализованные названия полей',
    'es-es': 'Usar etiquetas de campo localizadas',
    'fr-fr': 'Utiliser des étiquettes de champ localisées',
    'uk-ua': 'Використовуйте локалізовані назви полів',
  },
  historyOfEdits: {
    'en-us': 'History of edits',
    'ru-ru': 'История изменений',
    'es-es': 'Historial de ediciones',
    'fr-fr': 'Historique des modifications',
    'uk-ua': 'Історія редагувань',
  },
  historyOfEditsQueryName: {
    'en-us': 'History of edits for "{formattedRecord:string}"',
    'ru-ru': 'История изменений для "{formattedRecord:string}"',
    'es-es': 'Historial de ediciones para "{formattedRecord:string}"',
    'fr-fr': 'Historique des modifications pour "{formattedRecord:string}"',
    'uk-ua': 'Історія редагувань для "{formattedRecord:string}"',
  },
  formConfiguration: {
    'en-us': 'Form Configuration',
    'ru-ru': 'Конфигурация формы',
    'es-es': 'Configuración de formulario',
    'fr-fr': 'Configuration du formulaire',
    'uk-ua': 'Конфігурація форми',
  },
  formState: {
    'en-us': 'Form State',
    'ru-ru': 'Состояние формы',
    'es-es': 'Estado del formulario',
    'fr-fr': 'État du formulaire',
    'uk-ua': 'Стан форми',
  },
  recordInformation: {
    'en-us': 'Record Information',
    'ru-ru': 'Информация об объекте',
    'es-es': 'Información de registro',
    'fr-fr': 'Enregistrer des informations',
    'uk-ua': 'Інформація про запис',
  },
  shareRecord: {
    'en-us': 'Share Record',
    'ru-ru': 'Поделиться объектом',
    'es-es': 'Compartir registro',
    'fr-fr': "Partager l'enregistrement",
    'uk-ua': 'Поділитися записом',
  },
  findUsages: {
    'en-us': 'Find usages',
    'ru-ru': 'Найти использование',
    'es-es': 'Buscar usos',
    'fr-fr': 'Trouver des utilisations',
    'uk-ua': 'Знайти використання',
  },
  usagesOfPickList: {
    'en-us': 'Usages of "{pickList:string}" pick list',
    'ru-ru': 'Использование "{pickList:string}" списка выбора',
    'es-es': 'Usos de la lista de selección "{pickList:string}"',
    'fr-fr': 'Utilisations de la liste de sélection "{pickList:string}"',
    'uk-ua': 'Використання списку вибору "{pickList:string}"',
  },
  subForm: {
    'en-us': 'Subform',
    'ru-ru': 'Форма',
    'es-es': 'Subformulario',
    'fr-fr': 'Sous-formulaire',
    'uk-ua': 'Підформа',
  },
  formTable: {
    'en-us': 'Grid',
    'ru-ru': 'Таблица',
    'es-es': 'Cuadrícula',
    'fr-fr': 'Grille',
    'uk-ua': 'Сітка',
  },
  subviewConfiguration: {
    'en-us': 'Subview',
    'ru-ru': 'Конфигурация подчиненной формы',
    'es-es': 'Subvista',
    'fr-fr': 'Sous-vue',
    'uk-ua': 'Підформа',
  },
  selectSourceOfTables: {
    'en-us': 'Select source of tables',
    'ru-ru': 'Выберите источник таблиц',
    'es-es': 'Seleccione la fuente de las tablas',
    'fr-fr': 'Sélectionner la source des tableaux',
    'uk-ua': 'Виберіть джерело таблиць',
  },
  inheritLegacySettings: {
    'en-us': 'Copy Specify 6 settings',
    'ru-ru': 'Копировать настройки из Specify 6',
    'es-es': 'Copiar Especificar 6 configuraciones',
    'fr-fr': 'Copie Spécifiez 6 paramètres',
    'uk-ua': 'Копіювати Specify 6 налаштування',
  },
  useCustomSettings: {
    'en-us': 'Use custom settings',
    'ru-ru': 'Использовать другие настройки',
    'es-es': 'Usar configuraciones personalizadas',
    'fr-fr': 'Utiliser les paramètres personnalisés',
    'uk-ua': 'Використовуйте інші налаштування',
  },
  disableReadOnly: {
    'en-us': 'Disable read-only mode',
    'ru-ru': 'Отключить режим только для чтения',
    'es-es': 'Deshabilitar el modo de solo lectura',
    'fr-fr': 'Désactiver le mode lecture seule',
    'uk-ua': 'Вимкнути режим "Лише для читання"',
  },
  enableReadOnly: {
    'en-us': 'Enable read-only mode',
    'ru-ru': 'Включить режим только для чтения',
    'es-es': 'Habilitar el modo de solo lectura',
    'fr-fr': 'Activer le mode lecture seule',
    'uk-ua': 'Увімкнути режим "Лише для читання"',
  },
  configureDataEntryTables: {
    'en-us': 'Configure data entry tables',
    'ru-ru': 'Настроить таблицы ввода данных',
    'es-es': 'Configurar tablas de entrada de datos',
    'fr-fr': 'Configurer les tables de saisie de données',
    'uk-ua': 'Налаштувати доступні таблиці введення даних',
  },
  formMeta: {
    'en-us': 'Form Meta',
    'ru-ru': 'Мета-данные формы',
    'es-es': 'Formulario Meta',
    'fr-fr': 'Méta formulaire',
    'uk-ua': 'Налаштування форми',
  },
  newResourceTitle: {
    'en-us': 'New {tableName:string}',
    'ru-ru': 'Новый {tableName:string}',
    'es-es': 'Nuevo {tableName:string}',
    'fr-fr': 'Nouveau {tableName:string}',
    'uk-ua': 'Новий {tableName:string}',
  },
  resourceFormatter: {
    comment: `
      When resource does not have a formatter defined, this formatter is used
    `,
    'en-us': '{tableName:string} #{id:number}',
    'ru-ru': '{tableName:string} #{id:number}',
    'es-es': '{tableName:string} №{id:number}',
    'fr-fr': '{tableName:string} #{id:number}',
    'uk-ua': '{tableName:string} №{id:number}',
  },
  resourceDeleted: {
    'en-us': 'Resource deleted',
    'ru-ru': 'Ресурс удален',
    'es-es': 'Recurso eliminado',
    'fr-fr': 'Ressource supprimée',
    'uk-ua': 'Ресурс видалено',
  },
  resourceDeletedDescription: {
    'en-us': 'Item was deleted successfully.',
    'ru-ru': 'Успешно удален.',
    'es-es': 'El elemento se eliminó con éxito.',
    'fr-fr': "L'élément a été supprimé avec succès.",
    'uk-ua': 'Елемент успішно видалено.',
  },
} as const);
