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
    'fr-fr': 'Résultats supplémentaires omis',
    'uk-ua': 'Форми',
    'de-ch': 'Formulare',
  },
  clone: {
    'en-us': 'Clone',
    'ru-ru': 'Клонировать',
    'es-es': 'Clon',
    'fr-fr': 'Cloner',
    'uk-ua': 'Клон',
    'de-ch': 'Klone',
  },
  cloneDescription: {
    'en-us': 'Create a full copy of current record',
    'ru-ru': 'Создать полную копию текущей записи',
    'es-es': 'Crear una copia completa del registro actual',
    'fr-fr': "Créer une copie complète de l'enregistrement actuel",
    'uk-ua': 'Створіть повну копію поточного запису',
    'de-ch': 'Erstellen einer kompletten Kopie des aktuellen Datensatzes',
  },
  valueMustBeUniqueToField: {
    'en-us': 'Value must be unique to {fieldName:string}',
    'ru-ru': 'Значение должно быть уникальным для {fieldName:string}',
    'es-es': 'El valor debe ser exclusivo de {fieldName:string}',
    'fr-fr': 'La valeur doit être unique à {fieldName:string}',
    'uk-ua': 'Значення має бути унікальним для {fieldName:string}',
    'de-ch': 'Der Wert muss für {fieldName:string} eindeutig sein',
  },
  valueMustBeUniqueToDatabase: {
    'en-us': 'Value must be unique to database',
    'ru-ru': 'Значение должно быть уникальным для базы данных',
    'es-es': 'El valor debe ser exclusivo de la base de datos.',
    'fr-fr': 'La valeur doit être unique à la base de données',
    'uk-ua': 'Значення має бути унікальним для бази даних',
    'de-ch': 'Der Wert muss für die Datenbank eindeutig sein',
  },
  valuesOfMustBeUniqueToField: {
    'en-us': 'Values of {values:string} must be unique to {fieldName:string}',
    'ru-ru': `
      Значения {values:string} должны быть уникальными для {fieldName:string}
    `,
    'es-es': `
      Los valores de {values:string} deben ser únicos para {fieldName:string}
    `,
    'fr-fr': `
      Êtes-vous sûr de vouloir supprimer définitivement ce [X49X] de la base de
      données ?
    `,
    'uk-ua':
      'Значення {values:string} мають бути унікальними для {fieldName:string}',
    'de-ch': `
      Werte von {values:string} müssen für {fieldName:string} eindeutig sein.
    `,
  },
  valuesOfMustBeUniqueToDatabase: {
    'en-us': 'Values of {values:string} must be unique to database',
    'ru-ru':
      'Значения {values:string} должны быть уникальными для базы данных.',
    'es-es':
      'Los valores de {values:string} deben ser únicos para la base de datos.',
    'fr-fr': `
      Les valeurs de {values:string} doivent être uniques à la base de données
    `,
    'uk-ua': 'Значення {values:string} мають бути унікальними для бази даних',
    'de-ch':
      'Werte von {values:string} müssen für die Datenbank eindeutig sein',
  },
  checkingIfResourceCanBeDeleted: {
    'en-us': 'Checking if resource can be deleted…',
    'ru-ru': 'Проверка возможности удаления ресурса…',
    'es-es': 'Comprobando si el recurso se puede eliminar…',
    'fr-fr': 'Vérifier si la ressource peut être supprimée…',
    'uk-ua': 'Перевірка можливості видалення ресурсу…',
    'de-ch': 'Es wird geprüft, ob die Ressource gelöscht werden kann …',
  },
  deleteBlocked: {
    'en-us': 'Delete blocked',
    'ru-ru': 'Удалить заблокированное',
    'es-es': 'Eliminar bloqueado',
    'fr-fr': 'Supprimer bloqué',
    'uk-ua': 'Видалити заблокований',
    'de-ch': 'Löschen blockiert',
  },
  deleteBlockedDescription: {
    'en-us': `
      The resource cannot be deleted because it is referenced by the following
      resources:
    `,
    'de-ch': `
      Die Ressource kann nicht gelöscht werden, da sie von den folgenden
      Ressourcen referenziert wird:
    `,
    'es-es': 'encontrar usos',
    'fr-fr': 'Trouver des utilisations',
    'ru-ru': 'Найдите способы использования',
    'uk-ua': 'Знайти використання',
  },
  relationship: {
    'en-us': 'Relationship',
    'ru-ru': 'Отношение',
    'es-es': 'Relación',
    'fr-fr': 'Relation',
    'uk-ua': 'стосунки',
    'de-ch': 'Beziehung',
  },
  paleoMap: {
    'en-us': 'Paleo Map',
    'ru-ru': 'Карта Палео',
    'es-es': 'Mapa Paleo',
    'fr-fr': 'Carte Paléo',
    'uk-ua': 'Карта Палео',
    'de-ch': 'Paläo-Karte',
  },
  paleoRequiresGeography: {
    comment: 'Example: Geography Required',
    'en-us': '{geographyTable:string} Required',
    'ru-ru': '{geographyTable:string} Обязательно',
    'es-es': '{geographyTable:string} Requerido',
    'fr-fr': '{geographyTable:string} Obligatoire',
    'uk-ua': '{geographyTable:string} Потрібний',
    'de-ch': '{geographyTable:string} Erforderlich',
  },
  paleoRequiresGeographyDescription: {
    'en-us': `
      The Paleo Map plugin requires that the {localityTable:string} have
      geographic coordinates and that the paleo context have a geographic age
      with at least a start time or and end time populated.
    `,
    'de-ch': `
      Das Paleo Map-Plugin erfordert, dass die {localityTable:string}
      geografische Koordinaten haben und dass der Paläo-Kontext ein
      geografisches Alter mit mindestens einer Start- oder Endzeit hat.
    `,
    'es-es': 'Seleccionar fuente de tablas',
    'fr-fr': 'Sélectionnez la source des tables',
    'ru-ru': 'Выберите источник таблиц',
    'uk-ua': 'Виберіть джерело таблиць',
  },
  invalidDate: {
    'en-us': 'Invalid Date',
    'ru-ru': 'Недействительная дата',
    'es-es': 'Fecha invalida',
    'fr-fr': 'Date invalide',
    'uk-ua': 'Недійсна дата',
    'de-ch': 'Ungültiges Datum',
  },
  deleteConfirmation: {
    'en-us': `
      Are you sure you want to permanently delete this {tableName:string} from
      the database?
    `,
    'de-ch': `
      Sind Sie sicher, dass Sie dieses {tableName:string} dauerhaft aus der
      Datenbank löschen möchten?
    `,
    'es-es': 'El valor debe ser exclusivo de la base de datos.',
    'fr-fr': 'La valeur doit être unique à la base de données',
    'ru-ru': 'Значение должно быть уникальным для базы данных',
    'uk-ua': 'Значення має бути унікальним для бази даних',
  },
  deleteConfirmationDescription: {
    'en-us': 'This action cannot be undone.',
    'ru-ru': 'Это действие не может быть отменено.',
    'es-es': 'Esta acción no se puede deshacer.',
    'fr-fr': 'Cette action ne peut pas être annulée.',
    'uk-ua': 'Цю дію не можна скасувати.',
    'de-ch': 'Diese Aktion kann nicht rückgängig gemacht werden.',
  },
  datePrecision: {
    'en-us': 'Date Precision',
    'ru-ru': 'Точность даты',
    'es-es': 'Precisión de fecha',
    'fr-fr': 'Précision des dates',
    'uk-ua': 'Точність дати',
    'de-ch': 'Datumsgenauigkeit',
  },
  monthYear: {
    comment: `
      A placeholder for partial date field when "month /year" type is selected.
      Visible only in browsers that don\'t support the "month" input type.
    `,
    'en-us': 'Mon / Year',
    'ru-ru': 'Пн/Год',
    'es-es': 'Lun / Año',
    'fr-fr': 'Lun / Année',
    'uk-ua': 'пн / рік',
    'de-ch': 'Mo./Jahr',
  },
  yearPlaceholder: {
    comment:
      'A placeholder for partial date field when "year" type is selected',
    'en-us': 'YYYY',
    'ru-ru': 'ГГГГ',
    'es-es': 'AAAA',
    'fr-fr': 'AAAA',
    'uk-ua': 'РРРР',
    'de-ch': 'JJJJ',
  },
  today: {
    'en-us': 'Today',
    'ru-ru': 'Сегодня',
    'es-es': 'Hoy',
    'fr-fr': "Aujourd'hui",
    'uk-ua': 'Сьогодні',
    'de-ch': 'Heute',
  },
  todayButtonDescription: {
    'en-us': 'Set to current date',
    'ru-ru': 'Установить текущую дату',
    'es-es': 'Establecer en la fecha actual',
    'fr-fr': 'Définir sur la date actuelle',
    'uk-ua': 'Встановити поточну дату',
    'de-ch': 'Auf das aktuelle Datum einstellen',
  },
  addToPickListConfirmation: {
    'en-us': 'Add to {pickListTable:string}?',
    'ru-ru': 'Добавить в {pickListTable:string}?',
    'es-es': '¿Agregar a {pickListTable:string}?',
    'fr-fr': 'Ajouter à {pickListTable:string} ?',
    'uk-ua': 'Додати до {pickListTable:string}?',
    'de-ch': 'Zu {pickListTable:string} hinzufügen?',
  },
  addToPickListConfirmationDescription: {
    'en-us': `
      Add value "{value:string}" to the {pickListTable:string} named
      "{pickListName:string}"?
    `,
    'de-ch': `
      Wert „{value:string}“ zum {pickListTable:string} mit dem Namen
      „{pickListName:string}“ hinzufügen?
    `,
    'es-es': 'AAAA',
    'fr-fr': 'AAAA',
    'ru-ru': 'ГГГГ',
    'uk-ua': 'РРРР',
  },
  invalidType: {
    'en-us': 'Invalid Type',
    'ru-ru': 'Неверный тип',
    'es-es': 'Tipo no válido',
    'fr-fr': 'Type invalide',
    'uk-ua': 'Недійсний тип',
    'de-ch': 'Ungültiger Typ',
  },
  invalidNumericPicklistValue: {
    'en-us': 'Only numeric values are supported in this {pickListTable:string}',
    'de-ch': `
      In diesem {pickListTable:string} werden nur numerische Werte unterstützt.
    `,
    'es-es': 'Resultados adicionales omitidos',
    'fr-fr': 'Résultats supplémentaires omis',
    'ru-ru': 'Дополнительные результаты опущены',
    'uk-ua': 'Додаткові результати пропущено',
  },
  noData: {
    'en-us': 'No Data.',
    'ru-ru': 'Нет данных.',
    'es-es': 'Sin datos.',
    'fr-fr': 'Pas de données.',
    'uk-ua': 'Немає даних.',
    'de-ch': 'Keine Daten.',
  },
  recordSetDeletionWarning: {
    'en-us': `
      The {recordSetTable:string} "{recordSetName:string}" will be deleted. The
      referenced records will NOT be deleted from the database.
    `,
    'ru-ru': `
      {recordSetTable:string} «{recordSetName:string}» будет удален. Записи, на
      которые имеются ссылки, НЕ будут удалены из базы данных.
    `,
    'es-es': `
      Se eliminará el {recordSetTable:string} "{recordSetName:string}". Los
      registros referenciados NO serán eliminados de la base de datos.
    `,
    'fr-fr': `
      Le {recordSetTable:string} "{recordSetName:string}" sera supprimé. Les
      enregistrements référencés ne seront PAS supprimés de la base de données.
    `,
    'uk-ua': `
      {recordSetTable:string} "{recordSetName:string}" буде видалено. Записи, на
      які посилаються, НЕ будуть видалені з бази даних.
    `,
    'de-ch': `
      Der {recordSetTable:string} „{recordSetName:string}“ wird gelöscht. Die
      referenzierten Datensätze werden NICHT aus der Datenbank gelöscht.
    `,
  },
  saveRecordFirst: {
    'en-us': 'Save record first',
    'ru-ru': 'Сначала сохраните запись',
    'es-es': 'Guardar registro primero',
    'fr-fr': "Enregistrer d'abord l'enregistrement",
    'uk-ua': 'Спочатку збережіть запис',
    'de-ch': 'Datensatz zuerst speichern',
  },
  firstRecord: {
    'en-us': 'First Record',
    'ru-ru': 'Первая запись',
    'es-es': 'Primer registro',
    'fr-fr': 'Premier enregistrement',
    'uk-ua': 'Перший запис',
    'de-ch': 'Erste Aufnahme',
  },
  lastRecord: {
    'en-us': 'Last Record',
    'ru-ru': 'Последняя запись',
    'es-es': 'Último registro',
    'fr-fr': 'Dernier enregistrement',
    'uk-ua': 'Останній запис',
    'de-ch': 'Letzter Datensatz',
  },
  previousRecord: {
    'en-us': 'Previous Record',
    'ru-ru': 'Предыдущая запись',
    'es-es': 'Récord anterior',
    'fr-fr': 'Enregistrement précédent',
    'uk-ua': 'Попередній запис',
    'de-ch': 'Bisherigen Rekord',
  },
  nextRecord: {
    'en-us': 'Next Record',
    'ru-ru': 'Следующая запись',
    'es-es': 'Próximo registro',
    'fr-fr': 'Enregistrement suivant',
    'uk-ua': 'Наступний запис',
    'de-ch': 'Nächster Datensatz',
  },
  currentRecord: {
    'en-us': 'Current object (out of {total:number|formatted})',
    'ru-ru': 'Текущий объект (из {total:number|formatted})',
    'es-es': 'Objeto actual (de {total:number|formatted})',
    'fr-fr': 'Objet actuel (sur {total:number|formatted})',
    'uk-ua': "Поточний об'єкт (з {total:number|formatted})",
    'de-ch': 'Aktuelles Objekt (aus {total:number|formatted})',
  },
  unsavedFormUnloadProtect: {
    'en-us': 'This form has not been saved.',
    'ru-ru': 'Эта форма не сохранена.',
    'es-es': 'Este formulario no ha sido guardado.',
    'fr-fr': "Ce formulaire n'a pas été enregistré.",
    'uk-ua': 'Ця форма не збережена.',
    'de-ch': 'Dieses Formular wurde nicht gespeichert.',
  },
  saveConflict: {
    comment: 'Meaning a conflict occurred when saving',
    'en-us': 'Save conflict',
    'ru-ru': 'Сохранить конфликт',
    'es-es': 'Guardar conflicto',
    'fr-fr': 'Enregistrer le conflit',
    'uk-ua': 'Зберегти конфлікт',
    'de-ch': 'Konflikt speichern',
  },
  saveConflictDescription: {
    'en-us': `
      The data shown on this page has been changed by another user or in another
      browser tab and is out of date. The page must be reloaded to prevent
      inconsistent data from being saved.
    `,
    'ru-ru': `
      Данные, показанные на этой странице, были изменены другим пользователем
      или на другой вкладке браузера и устарели. Страницу необходимо
      перезагрузить, чтобы предотвратить сохранение противоречивых данных.
    `,
    'es-es': `
      Los datos mostrados en esta página han sido modificados por otro usuario o
      en otra pestaña del navegador y están desactualizados. La página debe
      recargarse para evitar que se guarden datos inconsistentes.
    `,
    'fr-fr': `
      Les données affichées sur cette page ont été modifiées par un autre
      utilisateur ou dans un autre onglet du navigateur et sont obsolètes. La
      page doit être rechargée pour éviter que des données incohérentes soient
      enregistrées.
    `,
    'uk-ua': `
      Дані, показані на цій сторінці, були змінені іншим користувачем або на
      іншій вкладці браузера та застаріли. Сторінку потрібно перезавантажити,
      щоб запобігти збереженню суперечливих даних.
    `,
    'de-ch': `
      Die auf dieser Seite angezeigten Daten wurden von einem anderen Benutzer
      oder in einem anderen Browser-Tab geändert und sind veraltet. Um zu
      verhindern, dass inkonsistente Daten gespeichert werden, muss die Seite
      neu geladen werden.
    `,
  },
  saveBlocked: {
    'en-us': 'Save blocked',
    'de-ch': 'Informationen aufnehmen',
    'es-es': 'Información de registro',
    'fr-fr': 'Enregistrer des informations',
    'ru-ru': 'Запись информации',
    'uk-ua': 'Запис інформації',
  },
  saveBlockedDescription: {
    'en-us': 'Form cannot be saved because of the following error:',
    'ru-ru': 'Невозможно сохранить форму из-за следующей ошибки:',
    'es-es': 'El formulario no se puede guardar debido al siguiente error:',
    'fr-fr': `
      Le formulaire ne peut pas être enregistré en raison de l'erreur suivante :
    `,
    'uk-ua': 'Форму неможливо зберегти через таку помилку:',
    'de-ch': `
      Das Formular kann aufgrund des folgenden Fehlers nicht gespeichert werden:
    `,
  },
  unavailableCommandButton: {
    'en-us': 'Command N/A',
    'ru-ru': 'Команда Н/Д',
    'es-es': 'Comando N/A',
    'fr-fr': 'Commande N/A',
    'uk-ua': 'Команда N/A',
    'de-ch': 'Befehl N/A',
  },
  commandUnavailable: {
    'en-us': 'Command Not Available',
    'ru-ru': 'Команда недоступна',
    'es-es': 'Comando no disponible',
    'fr-fr': 'Commande non disponible',
    'uk-ua': 'Команда недоступна',
    'de-ch': 'Befehl nicht verfügbar',
  },
  commandUnavailableDescription: {
    'en-us': 'This command is currently unavailable for Specify 7.',
    'ru-ru': 'Эта команда в настоящее время недоступна для Specify 7.',
    'es-es': 'Este comando no está disponible actualmente para Specify 7.',
    'uk-ua': 'Ця команда наразі недоступна для Specify 7.',
    'de-ch': 'Dieser Befehl ist derzeit für Specify 7 nicht verfügbar.',
    'fr-fr': 'AAAA',
  },
  commandUnavailableSecondDescription: {
    'en-us': `
      It was probably included on this form from Specify 6 and may be supported
      in the future.
    `,
    'ru-ru': `
      Вероятно, он был включен в эту форму из Specify 6 и может поддерживаться в
      будущем.
    `,
    'es-es': `
      Probablemente se incluyó en este formulario de la Especificación 6 y es
      posible que se admita en el futuro.
    `,
    'fr-fr': `
      Il a probablement été inclus sur ce formulaire à partir de Specify 6 et
      pourrait être pris en charge à l'avenir.
    `,
    'uk-ua': `
      Ймовірно, він був включений у цю форму з Specify 6 і може підтримуватися в
      майбутньому.
    `,
    'de-ch': `
      Es war wahrscheinlich in diesem Formular von Specify 6 enthalten und wird
      möglicherweise in Zukunft unterstützt.
    `,
  },
  commandName: {
    'en-us': 'Command name',
    'ru-ru': 'Имя команды',
    'es-es': 'Nombre del comando',
    'fr-fr': 'Nom de la commande',
    'uk-ua': 'Назва команди',
    'de-ch': 'Befehlsname',
  },
  unavailablePluginButton: {
    'en-us': 'Plugin N/A',
    'ru-ru': 'Плагин Н/Д',
    'es-es': 'Complemento N/A',
    'fr-fr': 'Plugin N/A',
    'uk-ua': 'Плагін Н/Д',
    'de-ch': 'Plugin N/A',
  },
  pluginNotAvailable: {
    'en-us': 'Plugin Not Available',
    'ru-ru': 'Плагин недоступен',
    'es-es': 'Complemento no disponible',
    'fr-fr': 'Plugin non disponible',
    'uk-ua': 'Плагін недоступний',
    'de-ch': 'Plugin nicht verfügbar',
  },
  pluginNotAvailableDescription: {
    'en-us': 'This plugin is currently unavailable for Specify 7',
    'ru-ru': 'Этот плагин в настоящее время недоступен для Specify 7.',
    'es-es': 'Este complemento no está disponible actualmente para Specify 7',
    'fr-fr': 'Ce plugin est actuellement indisponible pour Specify 7',
    'uk-ua': 'Цей плагін наразі недоступний для Specify 7',
    'de-ch': 'Dieses Plugin ist derzeit für Specify 7 nicht verfügbar',
  },
  wrongTableForPlugin: {
    comment:
      'Example: ... Locality, Collecting Event or Collection Object forms.',
    'en-us': `
      This plugin cannot be used on the {currentTable:string} form. Try moving
      it to the {supportedTables:string} forms.
    `,
    'ru-ru': `
      Этот плагин нельзя использовать в форме {currentTable:string}. Попробуйте
      переместить его в формы {supportedTables:string}.
    `,
    'es-es': `
      Este complemento no se puede utilizar en el formulario
      {currentTable:string}. Intente moverlo a los formularios
      {supportedTables:string}.
    `,
    'fr-fr': `
      Ce plugin ne peut pas être utilisé sur le formulaire
      {currentTable:string}. Essayez de le déplacer vers les formulaires
      {supportedTables:string}.
    `,
    'uk-ua': `
      Цей плагін не можна використовувати у формі {currentTable:string}.
      Спробуйте перемістити його до форм {supportedTables:string}.
    `,
    'de-ch': 'Neu [X4X]',
  },
  wrongTableForCommand: {
    'en-us': `
      The command cannot be used on the {currentTable:string} form. It can only
      be used on the {correctTable:string} form.
    `,
    'ru-ru': `
      Эту команду нельзя использовать в форме {currentTable:string}. Его можно
      использовать только в форме {correctTable:string}.
    `,
    'es-es': `
      El comando no se puede utilizar en el formulario {currentTable:string}.
      Sólo se puede utilizar en el formulario {correctTable:string}.
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
    'de-ch': `
      Der Befehl kann nicht im Formular {currentTable:string} verwendet werden.
      Es kann nur auf dem Formular {correctTable:string} verwendet werden.
    `,
  },
  pluginName: {
    'en-us': 'Plugin name',
    'ru-ru': 'Название плагина',
    'es-es': 'Nombre del complemento',
    'fr-fr': 'Nom du plugin',
    'uk-ua': 'Назва плагіна',
    'de-ch': 'Plugin-Name',
  },
  illegalBool: {
    comment: `
      Yes/No probably shouldn't be translated as Specify 7 does not support
      changing which values are recognized as Yes/No in a given language
    `,
    'en-us': 'Illegal value for a Yes/No field',
    'ru-ru': 'Недопустимое значение для поля Да/Нет.',
    'es-es': 'Valor ilegal para un campo Sí/No',
    'fr-fr': 'Valeur illégale pour un champ Oui/Non',
    'uk-ua': 'Неприпустиме значення для поля «Так/Ні».',
    'de-ch': 'Ungültiger Wert für ein Ja/Nein-Feld',
  },
  requiredField: {
    'en-us': 'Field is required.',
    'ru-ru': 'Поле, обязательное для заполнения.',
    'es-es': 'Se requiere campo.',
    'fr-fr': 'Champ requis.',
    'uk-ua': "Поле обов'язкове.",
    'de-ch': 'Feld ist erforderlich.',
  },
  invalidValue: {
    'en-us': 'Invalid value',
    'ru-ru': 'Неверное значение',
    'es-es': 'valor no válido',
    'fr-fr': 'valeur invalide',
    'uk-ua': 'Недійсне значення',
    'de-ch': 'Ungültiger Wert',
  },
  requiredFormat: {
    comment: 'Used in field validation messages on the form',
    'en-us': 'Required Format: {format:string}.',
    'ru-ru': 'Требуемый формат: {format:string}.',
    'es-es': 'Formato requerido: {format:string}.',
    'fr-fr': 'Format requis : {format:string}.',
    'uk-ua': 'Необхідний формат: {format:string}.',
    'de-ch': 'Felder für die Übertragung konfigurieren ([X35X])',
  },
  inputTypeNumber: {
    'en-us': 'Value must be a number',
    'ru-ru': 'Значение должно быть числом',
    'es-es': 'El valor debe ser un número.',
    'uk-ua': 'Значення має бути числом',
    'de-ch': `
      Die Ressource kann nicht gelöscht werden, da sie von den folgenden
      Ressourcen referenziert wird:
    `,
    'fr-fr': `
      La ressource ne peut pas être supprimée car elle est référencée par les
      ressources suivantes :
    `,
  },
  organization: {
    'en-us': 'Organization',
    'ru-ru': 'Организация',
    'es-es': 'Organización',
    'fr-fr': 'Organisation',
    'uk-ua': 'організація',
    'de-ch': 'Organisation',
  },
  person: {
    'en-us': 'Person',
    'ru-ru': 'Человек',
    'es-es': 'Persona',
    'fr-fr': 'Personne',
    'uk-ua': 'особа',
    'de-ch': 'Person',
  },
  other: {
    'en-us': 'Other',
    'ru-ru': 'Другой',
    'es-es': 'Otro',
    'fr-fr': 'Autre',
    'uk-ua': 'Інший',
    'de-ch': 'Andere',
  },
  group: {
    'en-us': 'Group',
    'ru-ru': 'Группа',
    'es-es': 'Grupo',
    'fr-fr': 'Groupe',
    'uk-ua': 'Група',
    'de-ch': 'Gruppe',
  },
  userDefinedItems: {
    'en-us': 'User Defined Items',
    'ru-ru': 'Пользовательские элементы',
    'es-es': 'Elementos definidos por el usuario',
    'fr-fr': "Éléments définis par l'utilisateur",
    'uk-ua': 'Визначені користувачем елементи',
    'de-ch': 'Benutzerdefinierte Elemente',
  },
  entireTable: {
    'en-us': 'Entire Table',
    'ru-ru': 'Вся таблица',
    'es-es': 'Tabla entera',
    'fr-fr': 'Tableau entier',
    'uk-ua': 'Ціла таблиця',
    'de-ch': 'Gesamte Tabelle',
  },
  fieldFromTable: {
    'en-us': 'Field From Table',
    'ru-ru': 'Поле из таблицы',
    'es-es': 'Campo de la tabla',
    'fr-fr': 'Champ de la table',
    'uk-ua': 'Поле з табл',
    'de-ch': 'Feld aus Tabelle',
  },
  unsupportedCellType: {
    'en-us': 'Unsupported cell type',
    'ru-ru': 'Неподдерживаемый тип ячейки',
    'es-es': 'Tipo de celda no compatible',
    'fr-fr': 'Type de cellule non pris en charge',
    'uk-ua': 'Непідтримуваний тип клітинки',
    'de-ch': 'Nicht unterstützter Zelltyp',
  },
  additionalResultsOmitted: {
    comment: `
      Represents truncated search dialog output (when lots of results returned)
    `,
    'en-us': 'Additional results omitted',
    'ru-ru': 'Дополнительные результаты опущены',
    'es-es': 'Resultados adicionales omitidos',
    'fr-fr': 'Résultats supplémentaires omis',
    'uk-ua': 'Додаткові результати пропущено',
    'de-ch': 'Weitere Ergebnisse weggelassen',
  },
  recordSelectorUnloadProtect: {
    'en-us': 'Proceed without saving?',
    'ru-ru': 'Продолжить без сохранения?',
    'es-es': '¿Continuar sin guardar?',
    'fr-fr': 'Continuer sans sauvegarder?',
    'uk-ua': 'Продовжити без збереження?',
    'de-ch': 'Ohne Speichern fortfahren?',
  },
  recordSelectorUnloadProtectDescription: {
    comment: `
      When in record set and current record is unsaved and try to navigate to
      another record
    `,
    'en-us': 'You might want to save this record before navigating away.',
    'ru-ru': 'Возможно, вы захотите сохранить эту запись, прежде чем уйти.',
    'es-es': 'Es posible que desee guardar este registro antes de navegar.',
    'fr-fr': `
      Vous souhaiterez peut-être enregistrer cet enregistrement avant de
      quitter.
    `,
    'uk-ua': 'Можливо, ви захочете зберегти цей запис, перш ніж перейти.',
    'de-ch': 'Neu [X4X]',
  },
  creatingNewRecord: {
    'en-us': 'Creating new record',
    'ru-ru': 'Создание новой записи',
    'es-es': 'Creando nuevo registro',
    'fr-fr': "Création d'un nouvel enregistrement",
    'uk-ua': 'Створення нового запису',
    'de-ch': 'Neuen Datensatz erstellen',
  },
  createNewRecordSet: {
    'en-us': 'Create a new record set',
    'ru-ru': 'Создать новый набор записей',
    'es-es': 'Crear un nuevo conjunto de registros',
    'fr-fr': "Créer un nouveau jeu d'enregistrements",
    'uk-ua': 'Створіть новий набір записів',
    'de-ch': 'Erstellen Sie einen neuen Datensatz',
  },
  forward: {
    'en-us': 'Forward',
    'ru-ru': 'Вперед',
    'es-es': 'Adelante',
    'fr-fr': 'Avant',
    'uk-ua': 'вперед',
    'de-ch': 'Nach vorne',
  },
  reverse: {
    'en-us': 'Reverse',
    'ru-ru': 'Обеспечить регресс',
    'es-es': 'Contrarrestar',
    'fr-fr': 'Inverse',
    'uk-ua': 'Зворотний',
    'de-ch': 'Umkehren',
  },
  deletedInline: {
    'en-us': '(deleted)',
    'ru-ru': '(удалено)',
    'es-es': '(eliminado)',
    'fr-fr': '(supprimé)',
    'uk-ua': '(видалено)',
    'de-ch': '(gelöscht)',
  },
  duplicateRecordSetItem: {
    comment: 'Example: Duplicate Record Set Item',
    'en-us': 'Duplicate {recordSetItemTable:string}',
    'ru-ru': 'Дополнительные результаты опущены',
    'es-es': 'Resultados adicionales omitidos',
    'uk-ua': 'Додаткові результати пропущено',
    'de-ch': 'Duplizieren {recordSetItemTable:string}',
    'fr-fr': 'Résultats supplémentaires omis',
  },
  duplicateRecordSetItemDescription: {
    'en-us':
      'This record is already present in the current {recordSetTable:string}',
    'ru-ru': 'Эта запись уже присутствует в текущем {recordSetTable:string}',
    'es-es':
      'Este registro ya está presente en el {recordSetTable:string} actual.',
    'fr-fr': `
      Cet enregistrement est déjà présent dans le {recordSetTable:string} actuel
    `,
    'uk-ua': 'Цей запис уже присутній у поточному {recordSetTable:string}',
    'de-ch': `
      Dieser Datensatz ist bereits im aktuellen {recordSetTable:string}
      vorhanden.
    `,
  },
  addToRecordSet: {
    'en-us': 'Add to {recordSetTable:string}',
    'ru-ru': 'Добавить в {recordSetTable:string}',
    'es-es': 'Añadir a {recordSetTable:string}',
    'fr-fr': 'Ajouter à {recordSetTable:string}',
    'uk-ua': 'Додати до {recordSetTable:string}',
    'de-ch': 'Zu {recordSetTable:string} hinzufügen',
  },
  removeFromRecordSet: {
    'en-us': 'Remove from {recordSetTable:string}',
    'ru-ru': 'Удалить из {recordSetTable:string}',
    'es-es': 'Quitar de {recordSetTable:string}',
    'fr-fr': 'Supprimer de {recordSetTable:string}',
    'uk-ua': 'Видалити з {recordSetTable:string}',
    'de-ch': 'Von {recordSetTable:string} entfernen',
  },
  nothingFound: {
    'en-us': 'Nothing found',
    'ru-ru': 'Ничего не найдено',
    'es-es': 'Nada Encontrado',
    'fr-fr': "Rien n'a été trouvé",
    'uk-ua': 'Нічого не знайдено',
    'de-ch': 'Nichts gefunden',
  },
  carryForward: {
    comment: 'Verb. Button label',
    'en-us': 'Carry Forward',
    'ru-ru': 'Перенести вперед',
    'es-es': 'Llevar adelante',
    'fr-fr': 'Reporter',
    'uk-ua': 'Переносити',
    'de-ch': 'Vortragen',
  },
  carryForwardEnabled: {
    'en-us': 'Show Carry Forward button',
    'ru-ru': 'Показать кнопку «Перенести вперед»',
    'es-es': 'Mostrar botón Llevar adelante',
    'fr-fr': 'Afficher le bouton Reporter',
    'uk-ua': 'Показати кнопку «Перенести вперед».',
    'de-ch': 'Schaltfläche „Übertragen“ anzeigen',
  },
  carryForwardDescription: {
    'en-us': 'Create a new record with certain fields carried over',
    'ru-ru': 'Создайте новую запись с переносом определенных полей.',
    'es-es': 'Crear un nuevo registro con ciertos campos transferidos',
    'fr-fr': 'Créer un nouvel enregistrement avec certains champs reportés',
    'uk-ua': 'Створіть новий запис із перенесеними певними полями',
    'de-ch': `
      Erstellen Sie einen neuen Datensatz mit übernommenen bestimmten Feldern
    `,
  },
  carryForwardSettingsDescription: {
    'en-us': 'Configure fields to carry forward',
    'ru-ru': 'Настройте поля для переноса',
    'es-es': 'Configurar campos para transferir',
    'fr-fr': 'Configurer les champs à reporter',
    'uk-ua': 'Налаштуйте поля для перенесення',
    'de-ch': 'Konfigurieren Sie Felder für die Übertragung',
  },
  carryForwardTableSettingsDescription: {
    'en-us': 'Configure fields to carry forward ({tableName:string})',
    'ru-ru': 'Настройте поля для переноса ({tableName:string})',
    'es-es': 'Configurar campos para transferir ({tableName:string})',
    'fr-fr': "Cette commande n'est actuellement pas disponible pour Specify 7.",
    'uk-ua': 'Налаштувати поля для перенесення ({tableName:string})',
    'de-ch': 'Felder für die Übertragung konfigurieren ({tableName:string})',
  },
  carryForwardUniqueField: {
    'en-us': 'This field must be unique. It can not be carried over',
    'ru-ru': 'Это поле должно быть уникальным. Его нельзя переносить',
    'es-es': 'Este campo debe ser único. No se puede trasladar',
    'fr-fr': 'Ce champ doit être unique. Il ne peut pas être reporté',
    'uk-ua': 'Це поле має бути унікальним. Його не можна переносити',
    'de-ch': 'Dieses Feld muss eindeutig sein. Es kann nicht übertragen werden',
  },
  cloneButtonEnabled: {
    'en-us': 'Show Clone button',
    'ru-ru': 'Показать кнопку клонировать',
    'es-es': 'Mostrar botón Clonar',
    'fr-fr': 'Afficher le bouton Cloner',
    'uk-ua': 'Показати кнопку клонування',
    'de-ch': 'Schaltfläche „Klonen“ anzeigen',
  },
  addButtonEnabled: {
    'en-us': 'Show Add button',
    'ru-ru': 'Показать кнопку «Добавить»',
    'es-es': 'Mostrar botón Agregar',
    'fr-fr': 'Afficher le bouton Ajouter',
    'uk-ua': 'Показати кнопку «Додати».',
    'de-ch': 'Schaltfläche „Hinzufügen“ anzeigen',
  },
  addButtonDescription: {
    'en-us': 'Create a new blank record',
    'ru-ru': 'Создать новую пустую запись',
    'es-es': 'Crear un nuevo registro en blanco',
    'fr-fr': 'Créer un nouvel enregistrement vierge',
    'uk-ua': 'Створіть новий порожній запис',
    'de-ch': 'Erstellen Sie einen neuen leeren Datensatz',
  },
  autoNumbering: {
    'en-us': 'Auto Numbering',
    'ru-ru': 'Автоматическая нумерация',
    'es-es': 'Numeración automática',
    'fr-fr': 'Numérotation automatique',
    'uk-ua': 'Автоматична нумерація',
    'de-ch': 'Automatische Nummerierung',
  },
  editFormDefinition: {
    'en-us': 'Edit Form Definition',
    'ru-ru': 'Изменить определение формы',
    'es-es': 'Editar definición de formulario',
    'fr-fr': 'Modifier la définition du formulaire',
    'uk-ua': 'Редагувати визначення форми',
    'de-ch': 'Formulardefinition bearbeiten',
  },
  useAutoGeneratedForm: {
    'en-us': 'Use Auto Generated Form',
    'ru-ru': 'Использовать автоматически созданную форму',
    'es-es': 'Usar formulario generado automáticamente',
    'fr-fr': 'Utiliser le formulaire généré automatiquement',
    'uk-ua': 'Використовуйте автоматично створену форму',
    'de-ch': 'Verwenden Sie das automatisch generierte Formular',
  },
  useFieldLabels: {
    'en-us': 'Use Localized Field Labels',
    'ru-ru': 'Используйте локализованные метки полей',
    'es-es': 'Utilice etiquetas de campo localizadas',
    'fr-fr': 'Utiliser des étiquettes de champ localisées',
    'uk-ua': 'Використовуйте локалізовані мітки полів',
    'de-ch': 'Verwenden Sie lokalisierte Feldbezeichnungen',
  },
  showFieldLabels: {
    'en-us': 'Show Localized Field Labels',
    'de-ch': 'Lokalisierte Feldbeschriftungen anzeigen',
    'es-es': 'Mostrar etiquetas de campos localizados',
    'fr-fr': 'Afficher les étiquettes de champ localisées',
    'ru-ru': 'Показать локализованные метки полей',
    'uk-ua': 'Показати локалізовані мітки полів',
  },
  showDataModelLabels: {
    'en-us': 'Show Data Model Field Names',
    'de-ch': 'Feldnamen des Datenmodells anzeigen',
    'es-es': 'Mostrar nombres de campos del modelo de datos',
    'fr-fr': 'Afficher les noms des champs du modèle de données',
    'ru-ru': 'Показать имена полей модели данных',
    'uk-ua': 'Показати назви полів моделі даних',
  },
  editHistory: {
    'en-us': 'Edit history',
    'ru-ru': 'Редактировать историю',
    'es-es': 'Editar historial',
    'fr-fr': "Modifier l'historique",
    'uk-ua': 'Історія редагування',
    'de-ch': 'Bearbeitungsgeschichte',
  },
  editHistoryQueryName: {
    'en-us': 'Edit history for "{formattedRecord:string}"',
    'ru-ru': 'История редактирования «{formattedRecord:string}»',
    'es-es': 'Editar historial de "{formattedRecord:string}"',
    'fr-fr': 'Modifier l\'historique pour "{formattedRecord:string}"',
    'uk-ua': 'Історія редагування для "{formattedRecord:string}"',
    'de-ch': 'Bearbeitungsverlauf für „{formattedRecord:string}“',
  },
  formConfiguration: {
    'en-us': 'Form Configuration',
    'ru-ru': 'Конфигурация формы',
    'es-es': 'Configuración del formulario',
    'fr-fr': 'Configuration du formulaire',
    'uk-ua': 'Конфігурація форми',
    'de-ch': 'Formularkonfiguration',
  },
  formState: {
    'en-us': 'Form State',
    'ru-ru': 'Форма состояния',
    'es-es': 'Estado del formulario',
    'fr-fr': 'État du formulaire',
    'uk-ua': 'Стан форми',
    'de-ch': 'Formularstatus',
  },
  recordInformation: {
    'en-us': 'Record Information',
    'ru-ru': 'Запись информации',
    'es-es': 'Información de registro',
    'fr-fr': 'Enregistrer des informations',
    'uk-ua': 'Запис інформації',
    'de-ch': 'Informationen aufnehmen',
  },
  shareRecord: {
    'en-us': 'Share Record',
    'ru-ru': 'Поделиться записью',
    'es-es': 'Compartir registro',
    'fr-fr': "Partager l'enregistrement",
    'uk-ua': 'Поділитися записом',
    'de-ch': 'Datensatz teilen',
  },
  findUsages: {
    'en-us': 'Find usages',
    'ru-ru': 'Найдите способы использования',
    'es-es': 'encontrar usos',
    'fr-fr': 'Trouver des utilisations',
    'uk-ua': 'Знайти використання',
    'de-ch': 'Finden Sie Verwendungen',
  },
  usagesOfPickList: {
    'en-us': 'Usages of "{pickList:string}" pick list',
    'ru-ru': 'Использование списка выбора «{pickList:string}»',
    'es-es': 'Usos de la lista de selección "{pickList:string}"',
    'fr-fr': 'Utilisations de la liste de sélection "{pickList:string}"',
    'uk-ua': 'Використання списку вибору "{pickList:string}".',
    'de-ch': 'Verwendungsmöglichkeiten der Auswahlliste „{pickList:string}“.',
  },
  subForm: {
    'en-us': 'Subform',
    'ru-ru': 'Подформа',
    'es-es': 'Subformulario',
    'fr-fr': 'Sous-formulaire',
    'uk-ua': 'Підформа',
    'de-ch': 'Unterformular',
  },
  formTable: {
    'en-us': 'Grid',
    'ru-ru': 'Сетка',
    'es-es': 'Red',
    'fr-fr': 'Grille',
    'uk-ua': 'Сітка',
    'de-ch': 'Netz',
  },
  subviewConfiguration: {
    'en-us': 'Subview',
    'ru-ru': 'Подпредставление',
    'es-es': 'Subvista',
    'uk-ua': 'Підвид',
    'de-ch': 'Unteransicht',
    'fr-fr': 'Reporter',
  },
  selectSourceOfTables: {
    'en-us': 'Select source of tables',
    'ru-ru': 'Выберите источник таблиц',
    'es-es': 'Seleccionar fuente de tablas',
    'fr-fr': 'Sélectionnez la source des tables',
    'uk-ua': 'Виберіть джерело таблиць',
    'de-ch': 'Wählen Sie die Quelle der Tabellen aus',
  },
  inheritLegacySettings: {
    'en-us': 'Copy Specify 6 settings',
    'ru-ru': 'Копировать Укажите 6 настроек',
    'es-es': 'Copiar Especificar 6 configuraciones',
    'fr-fr': 'Copier Spécifier 6 paramètres',
    'uk-ua': 'Копіювати Вкажіть 6 параметрів',
    'de-ch': `
      Es war wahrscheinlich in diesem Formular von Specify 6 enthalten und wird
      möglicherweise in Zukunft unterstützt.
    `,
  },
  useCustomSettings: {
    'en-us': 'Use custom settings',
    'ru-ru': 'Использовать пользовательские настройки',
    'es-es': 'Usar configuraciones personalizadas',
    'fr-fr': 'Utiliser des paramètres personnalisés',
    'uk-ua': 'Використовуйте спеціальні налаштування',
    'de-ch': 'Benutzerdefinierte Einstellungen verwenden',
  },
  disableReadOnly: {
    'en-us': 'Disable read-only mode',
    'ru-ru': 'Отключить режим только для чтения',
    'es-es': 'Desactivar el modo de solo lectura',
    'fr-fr': 'Désactiver le mode lecture seule',
    'uk-ua': 'Вимкнути режим лише для читання',
    'de-ch': 'Werte von [X10X] müssen für [X44X] eindeutig sein.',
  },
  enableReadOnly: {
    'en-us': 'Enable read-only mode',
    'ru-ru': 'Включить режим только для чтения',
    'es-es': 'Habilitar el modo de solo lectura',
    'fr-fr': 'Activer le mode lecture seule',
    'uk-ua': 'Увімкнути режим лише для читання',
    'de-ch': 'Aktivieren Sie den schreibgeschützten Modus',
  },
  configureDataEntryTables: {
    'en-us': 'Configure data entry tables',
    'ru-ru': 'Настройка таблиц ввода данных',
    'es-es': 'Configurar tablas de entrada de datos',
    'fr-fr': 'Configurer les tables de saisie de données',
    'uk-ua': 'Налаштувати таблиці введення даних',
    'de-ch': 'Konfigurieren Sie Dateneingabetabellen',
  },
  configureInteractionTables: {
    'en-us': 'Configure interaction tables',
    'ru-ru': 'Настройка таблиц взаимодействия',
    'es-es': 'Configurar tablas de interacción',
    'fr-fr': "Configurer les tables d'interaction",
    'uk-ua': 'Налаштувати таблиці взаємодії',
    'de-ch': 'Interaktionstabellen konfigurieren',
  },
  formMeta: {
    'en-us': 'Form Meta',
    'ru-ru': 'Форма мета',
    'es-es': 'Metaformulario',
    'fr-fr': 'Méta formulaire',
    'uk-ua': 'Мета форми',
    'de-ch': 'Formularstatus',
  },
  newResourceTitle: {
    'en-us': 'New {tableName:string}',
    'ru-ru': 'Новый {tableName:string}',
    'es-es': 'Nuevo {tableName:string}',
    'fr-fr': 'Nouveau {tableName:string}',
    'uk-ua': 'Нове {tableName:string}',
    'de-ch': 'Neu {tableName:string}',
  },
  resourceFormatter: {
    comment: `
      When resource does not have a formatter defined, this formatter is used
    `,
    'en-us': '{tableName:string} #{id:number}',
    'ru-ru': '{tableName:string} #{id:number}',
    'es-es': '{tableName:string} #{id:number}',
    'fr-fr': '{tableName:string} #{id:number}',
    'uk-ua': '{tableName:string} #{id:number}',
    'de-ch': '{tableName:string} #{id:number}',
  },
  resourceDeleted: {
    'en-us': 'Resource deleted',
    'ru-ru': 'Ресурс удален',
    'es-es': 'Recurso eliminado',
    'fr-fr': 'Ressource supprimée',
    'uk-ua': 'Ресурс видалено',
    'de-ch': 'Ressource gelöscht',
  },
  resourceDeletedDescription: {
    'en-us': 'Item was deleted successfully.',
    'ru-ru': 'Элемент был успешно удален.',
    'es-es': 'El artículo se eliminó correctamente.',
    'fr-fr': "L'élément a été supprimé avec succès.",
    'uk-ua': 'Елемент успішно видалено.',
    'de-ch': 'Der Artikel wurde erfolgreich gelöscht.',
  },
  dateRange: {
    'en-us': '(Range: {from:string} - {to:string})',
    'ru-ru': '(Диапазон: {from:string} – {to:string})',
    'es-es': '(Rango: {from:string} - {to:string})',
    'fr-fr': '(Plage : {from:string} - {to:string})',
    'uk-ua': '(Діапазон: {from:string} - {to:string})',
    'de-ch': '(Bereich: {from:string} - {to:string})',
  },
  catalogNumberNumericFormatter: {
    comment: 'Meaning "Catalog Number Numeric formatter"',
    'en-us': 'Catalog Number Numeric',
    'de-ch': 'Katalognummer Numerisch',
    'es-es': 'Número de catálogo numérico',
    'fr-fr': 'Numéro de catalogue Numérique',
    'ru-ru': 'Номер по каталогу Числовой',
    'uk-ua': 'Каталожний номер Числовий',
  },
} as const);
