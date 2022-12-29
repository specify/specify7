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
  },
  clone: {
    'en-us': 'Clone',
    'ru-ru': 'Клонировать',
  },
  cloneDescription: {
    'en-us': 'Create a full copy of current record',
    'ru-ru': 'Создать полную копию текущей записи',
  },
  valueMustBeUniqueToField: {
    'en-us': 'Value must be unique to {fieldName:string}',
    'ru-ru': 'Значение {fieldName:string} должно быть уникальным',
  },
  valueMustBeUniqueToDatabase: {
    'en-us': 'Value must be unique to database',
    'ru-ru': 'Значение должно быть уникальным в базе данных',
  },
  valuesOfMustBeUniqueToField: {
    'en-us': 'Values of {values:string} must be unique to {fieldName:string}',
    'ru-ru':
      'Значения {values:string} в {fieldName:string} должны быть уникальным',
  },
  valuesOfMustBeUniqueToDatabase: {
    'en-us': 'Values of {values:string} must be unique to database',
    'ru-ru': 'Значения {values:string} должны быть уникальным в базе данных',
  },
  checkingIfResourceCanBeDeleted: {
    'en-us': 'Checking if resource can be deleted…',
    'ru-ru': 'Проверка возможности удаления ресурса…',
  },
  deleteBlocked: {
    'en-us': 'Delete blocked',
    'ru-ru': 'Удаление заблокировано',
  },
  deleteBlockedDescription: {
    'en-us': `
      The resource cannot be deleted because it is referenced by the following
      resources:
    `,
    'ru-ru':
      'Ресурс нельзя удалить, так как на него ссылаются следующие ресурсы:',
  },
  record: {
    'en-us': 'Record',
    'ru-ru': 'Запись',
  },
  relationship: {
    'en-us': 'Relationship',
    'ru-ru': 'Связь',
  },
  paleoMap: {
    'en-us': 'Paleo Map',
    'ru-ru': 'Карта Палео',
  },
  paleoRequiresGeography: {
    'en-us': 'Geography Required',
    'ru-ru': 'Требуется география',
  },
  paleoRequiresGeographyDescription: {
    'en-us': `
      The Paleo Map plugin requires that the locality have geographic
      coordinates and that the paleo context have a geographic age with at least
      a start time or and end time populated.
    `,
    'ru-ru': `
      Плагин Карта Палео требует, чтобы у населенного пункта были координаты и
      что палеоконтекст имеет географический возраст с заполнено как минимум
      время начала или время окончания.
    `,
  },
  invalidDate: {
    'en-us': 'Invalid Date',
    'ru-ru': 'Недействительная дата',
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
  },
  deleteConfirmationDescription: {
    'en-us': 'This action cannot be undone.',
    'ru-ru': 'Это действие не может быть отменено.',
  },
  datePrecision: {
    'en-us': 'Date Precision',
    'ru-ru': 'Точность даты',
  },
  monthYear: {
    comment: `
      A placeholder for partial date field when "month /year" type is selected.
      Visible only in browsers that don\'t support the "month" input type.
    `,
    'en-us': 'Mon / Year',
    'ru-ru': 'Месяц / Год',
  },
  yearPlaceholder: {
    comment:
      'A placeholder for partial date field when "year" type is selected',
    'en-us': 'YYYY',
    'ru-ru': 'ГГГГ',
  },
  today: {
    'en-us': 'Today',
    'ru-ru': 'Сегодня',
  },
  todayButtonDescription: {
    'en-us': 'Set to current date',
    'ru-ru': 'Установить на текущую дату',
  },
  addToPickListConfirmation: {
    'en-us': 'Add to pick list?',
    'ru-ru': 'Добавить в список выбора?',
  },
  addToPickListConfirmationDescription: {
    'en-us': `
      Add value "{value:string}" to the pick list named "{pickListName:string}"?
    `,
    'ru-ru': `
      Добавить значение "{value:string}" в список выбора
      "{pickListName:string}"?
    `,
  },
  invalidType: {
    'en-us': 'Invalid Type',
    'ru-ru': 'Недействительный тип',
  },
  invalidNumericPicklistValue: {
    'en-us': 'Only numeric values are supported in this pick list',
    'ru-ru': 'В этом списке выбора допускаются только числовые значения',
  },
  noData: {
    'en-us': 'No Data.',
    'ru-ru': 'Нет данных.',
  },
  recordSet: {
    'en-us': 'Record Set',
    'ru-ru': 'Набор объектов',
  },
  recordSetDeletionWarning: {
    'en-us': `
      The record set "{recordSetName:string}" will be deleted. The referenced
      records will NOT be deleted from the database.
    `,
    'ru-ru': `
      Набор объектов "{recordSetName:string}" будет удален. Связанные записи не
      будут удалены из базы данных.
    `,
  },
  saveRecordFirst: {
    'en-us': 'Save record first',
    'ru-ru': 'Сначала нужко сохранить запись',
  },
  firstRecord: {
    'en-us': 'First Record',
    'ru-ru': 'Первый объект',
  },
  lastRecord: {
    'en-us': 'Last Record',
    'ru-ru': 'Последний объект',
  },
  previousRecord: {
    'en-us': 'Previous Record',
    'ru-ru': 'Последняя запись',
  },
  nextRecord: {
    'en-us': 'Next Record',
    'ru-ru': 'Следующий объект',
  },
  currentRecord: {
    'en-us': 'Current object (out of {total:number|formatted})',
    'ru-ru': 'Текущий объект (из {total:number|formatted})',
  },
  unsavedFormUnloadProtect: {
    'en-us': 'This form has not been saved.',
    'ru-ru': 'Эта форма не была сохранена.',
  },
  saveConflict: {
    'en-us': 'Save conflict',
    'ru-ru': 'Сохранить конфликт',
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
  },
  saveBlocked: {
    'en-us': 'Save blocked',
    'ru-ru': 'Сохранение заблокировано',
  },
  saveBlockedDescription: {
    'en-us': 'Form cannot be saved while the following errors exist:',
    'ru-ru': 'Форма не может быть сохранена, пока существуют следующие ошибки:',
  },
  unavailableCommandButton: {
    'en-us': 'Command N/A',
    'ru-ru': 'Команда недоступна',
  },
  commandUnavailable: {
    'en-us': 'Command Not Available',
    'ru-ru': 'Команда недоступна',
  },
  commandUnavailableDescription: {
    'en-us': 'This command is currently unavailable for Specify 7.',
    'ru-ru': 'Эта команда в настоящее время недоступна для Specify 7.',
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
  },
  commandName: {
    'en-us': 'Command name',
    'ru-ru': 'Имя команды',
  },
  unavailablePluginButton: {
    'en-us': 'Plugin N/A',
    'ru-ru': 'Плагин недоступен',
  },
  pluginNotAvailable: {
    'en-us': 'Plugin Not Available',
    'ru-ru': 'Плагин недоступен',
  },
  pluginNotAvailableDescription: {
    'en-us': 'This plugin is currently unavailable for Specify 7',
    'ru-ru': 'Этот плагин в настоящее время недоступна для Specify 7',
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
  },
  wrongTableForPlugin: {
    'en-us': `
      The plugin cannot be used on the {currentTable:string} form. It can only
      be used on the {correctTable:string} form.
    `,
    'ru-ru': `
      Этот плагин нельзя использовать в форме {currentTable:string}. Его можно
      использовать только в форме {correctTable:string}.
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
  },
  pluginName: {
    'en-us': 'Plugin name',
    'ru-ru': 'Название плагина',
  },
  visit: {
    'en-us': 'Visit',
    'ru-ru': 'Открыть',
  },
  illegalBool: {
    'en-us': 'Illegal value for a Yes/No field',
    'ru-ru': 'Недопустимое значение для поля Да / Нет',
  },
  requiredField: {
    'en-us': 'Field is required.',
    'ru-ru': 'Поле обязательно для заполнения.',
  },
  invalidValue: {
    'en-us': 'Invalid value',
    'ru-ru': 'Недопустимое значение',
  },
  requiredFormat: {
    comment: 'Used in field validation messages on the form',
    'en-us': 'Required Format: {format:string}.',
    'ru-ru': 'Обязательный формат: {format:string}.',
  },
  inputTypeNumber: {
    'en-us': 'Value must be a number',
    'ru-ru': 'Значение должно быть числом',
  },
  organization: {
    'en-us': 'Organization',
    'ru-ru': 'Организация',
  },
  person: {
    'en-us': 'Person',
    'ru-ru': 'Особа',
  },
  other: {
    'en-us': 'Other',
    'ru-ru': 'Иной',
  },
  group: {
    'en-us': 'Group',
    'ru-ru': 'Группа',
  },
  userDefinedItems: {
    'en-us': 'User Defined Items',
    'ru-ru': 'Пользовательские элементы',
  },
  entireTable: {
    'en-us': 'Entire Table',
    'ru-ru': 'Вся таблица',
  },
  fieldFromTable: {
    'en-us': 'Field From Table',
    'ru-ru': 'Поле из таблицы',
  },
  unsupportedCellType: {
    'en-us': 'Unsupported cell type',
    'ru-ru': 'Неподдерживаемый тип ячейки',
  },
  additionalResultsOmitted: {
    comment: `
      Represents truncated search dialog output (when lots of results returned)
    `,
    'en-us': 'Additional results omitted',
    'ru-ru': 'Дополнительные результаты опущены',
  },
  recordSelectorUnloadProtect: {
    'en-us': 'Proceed without saving?',
    'ru-ru': 'Продолжить без сохранения?',
  },
  recordSelectorUnloadProtectDescription: {
    comment: `
      When in record set and current record is unsaved and try to navigate to
      another record
    `,
    'en-us': 'You might want to save this record before navigating away.',
    'ru-ru': 'Не забудьте сохранить эту запись, прежде чем закрыть ее.',
  },
  creatingNewRecord: {
    'en-us': 'Creating new record',
    'ru-ru': 'Создание новой записи',
  },
  forward: {
    'en-us': 'Forward',
    'ru-ru': 'Вперед',
  },
  reverse: {
    'en-us': 'Reverse',
    'ru-ru': 'Обратный',
  },
  deletedInline: {
    'en-us': '(deleted)',
    'ru-ru': '(удален)',
  },
  duplicateRecordSetItem: {
    'en-us': 'Duplicate Record Set Item',
    'ru-ru': 'Дублирующий элемент набора записей',
  },
  duplicateRecordSetItemDescription: {
    'en-us': 'This record is already present in the current record set',
    'ru-ru': 'Этот объект уже присутствует в текущем наборе записей',
  },
  addToRecordSet: {
    'en-us': 'Add to Record Set',
    'ru-ru': 'Добавить в набор записей',
  },
  removeFromRecordSet: {
    'en-us': 'Remove from Record Set',
    'ru-ru': 'Удалить из набора записей',
  },
  nothingFound: {
    'en-us': 'Nothing found',
    'ru-ru': 'Ничего не найдено',
  },
  carryForward: {
    'en-us': 'Carry Forward',
    'ru-ru': 'Перенести',
  },
  carryForwardEnabled: {
    'en-us': 'Show Carry Forward button',
    'ru-ru': 'Показать кнопку Перенести',
  },
  carryForwardDescription: {
    'en-us': 'Create a new record with certain fields carried over',
    'ru-ru': 'Создать новую запись с определенными полями, перенесенными',
  },
  carryForwardSettingsDescription: {
    'en-us': 'Configure fields to carry forward',
    'ru-ru': 'Настройте поля для клонирования',
  },
  carryForwardTableSettingsDescription: {
    'en-us': 'Configure fields to carry forward ({tableName: string})',
    'ru-ru': 'Настройте поля для клонирования ({tableName: string})',
  },
  carryForwardUniqueField: {
    'en-us': 'This field must be unique. It can not be carried over',
    'ru-ru': 'Это поле должно быть уникальным. Оно не может быть перенесено',
  },
  cloneButtonEnabled: {
    'en-us': 'Show Clone button',
    'ru-ru': 'Показать кнопку клонирования',
  },
  addButtonEnabled: {
    'en-us': 'Show Add button',
    'ru-ru': 'Показать кнопку добавления',
  },
  addButtonDescription: {
    'en-us': 'Create a new blank record',
    'ru-ru': 'Создать новую пустую запись',
  },
  autoNumbering: {
    'en-us': 'Auto Numbering',
    'ru-ru': 'Автонумерация',
  },
  editFormDefinition: {
    'en-us': 'Edit Form Definition',
    'ru-ru': 'Редактировать схему формы',
  },
  useAutoGeneratedForm: {
    'en-us': 'Use Auto Generated Form',
    'ru-ru': 'Использовать автоматическую схему формы',
  },
  useFieldLabels: {
    'en-us': 'Use localized field labels',
    'ru-ru': 'Использовать локализованные названия полей',
  },
  historyOfEdits: {
    'en-us': 'History of edits',
    'ru-ru': 'История изменений',
  },
  historyOfEditsQueryName: {
    'en-us': 'History of edits for "{formattedRecord:string}"',
    'ru-ru': 'История изменений для "{formattedRecord:string}"',
  },
  formConfiguration: {
    'en-us': 'Form Configuration',
    'ru-ru': 'Конфигурация формы',
  },
  formState: {
    'en-us': 'Form State',
    'ru-ru': 'Состояние формы',
  },
  recordInformation: {
    'en-us': 'Record Information',
    'ru-ru': 'Информация об объекте',
  },
  shareRecord: {
    'en-us': 'Share Record',
    'ru-ru': 'Поделиться объектом',
  },
  findUsages: {
    'en-us': 'Find usages',
    'ru-ru': 'Найти использование',
  },
  usagesOfPickList: {
    'en-us': 'Usages of "{pickList:string}" pick list',
    'ru-ru': 'Использование "{pickList:string}" списка выбора',
  },
  form: {
    'en-us': 'Subform',
    'ru-ru': 'Форма',
  },
  formTable: {
    'en-us': 'Grid',
    'ru-ru': 'Таблица',
  },
  subviewConfiguration: {
    'en-us': 'Subview',
    'ru-ru': 'Конфигурация подчиненной формы',
  },
  selectSourceOfTables: {
    'en-us': 'Select source of tables',
    'ru-ru': 'Выберите источник таблиц',
  },
  inheritLegacySettings: {
    'en-us': 'Copy Specify 6 settings',
    'ru-ru': 'Копировать настройки из Specify 6',
  },
  useCustomSettings: {
    'en-us': 'Use custom settings',
    'ru-ru': 'Использовать другие настройки',
  },
  disableReadOnly: {
    'en-us': 'Disable read-only mode',
    'ru-ru': 'Отключить режим только для чтения',
  },
  enableReadOnly: {
    'en-us': 'Enable read-only mode',
    'ru-ru': 'Включить режим только для чтения',
  },
  configureDataEntryTables: {
    'en-us': 'Configure data entry tables',
    'ru-ru': 'Настроить таблицы ввода данных',
  },
  formMeta: {
    'en-us': 'Form Meta',
    'ru-ru': 'Мета-данные формы',
  },
  newResourceTitle: {
    'en-us': 'New {tableName:string}',
    'ru-ru': 'Новый {tableName:string}',
  },
  resourceFormatter: {
    comment: `
      When resource does not have a formatter defined, this formatter is used
    `,
    'en-us': '{tableName:string} #{id:number}',
    'ru-ru': '{tableName:string} #{id:number}',
  },
  resourceDeleted: {
    'en-us': 'Item deleted',
    'ru-ru': 'Удалено',
  },
  resourceDeletedDescription: {
    'en-us': 'Item was deleted successfully.',
    'ru-ru': 'Успешно удален.',
  },
} as const);
