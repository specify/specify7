/**
 * Localization strings used on Data Entry forms and Interactions
 * (don't confuse this with schema localization strings)
 *
 * @module
 */

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

export const formsText = createDictionary({
  orderBy: {
    'en-us': 'Order By',
    'ru-ru': 'Сортировать по',
  },
  attachmentServerUnavailable: {
    'en-us': 'Attachment server unavailable.',
    'ru-ru': 'Сервер прикрепленных файлов недоступен.',
  },
  attachmentUploadDialogTitle: {
    'en-us': 'Uploading…',
    'ru-ru': 'Закачивание…',
  },
  noAttachments: {
    'en-us': 'There are no attachments',
    'ru-ru': 'В вашей коллекции нет вложений',
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
  valuesOfMustBeUniqueToField: {
    'en-us': 'Values of {values:string} must be unique to {fieldName:string}',
    'ru-ru':
      'Значения {values:string} в {fieldName:string} должны быть уникальным',
  },
  database: {
    'en-us': 'database',
    'ru-ru': 'база данных',
  },
  collectionObject: {
    'en-us': 'Collection Object',
    'ru-ru': 'Объект коллекции',
  },
  checkingIfResourceCanBeDeleted: {
    'en-us': 'Checking if resource can be deleted...',
    'ru-ru': 'Проверка возможности удаления ресурса...',
  },
  deleteBlockedDialogHeader: {
    'en-us': 'Delete blocked',
    'ru-ru': 'Удаление заблокировано',
  },
  deleteBlockedDialogText: {
    'en-us': `
      The resource cannot be deleted because it is referenced by the following
      resources:`,
    'ru-ru': `
      Ресурс нельзя удалить, так как на него ссылаются следующие ресурсы:`,
  },
  record: {
    'en-us': 'Record',
    'ru-ru': 'Запись',
  },
  relationship: {
    'en-us': 'Relationship',
    'ru-ru': 'Связь',
  },
  contract: {
    'en-us': 'Contract',
    'ru-ru': 'Договор',
  },
  addItems: {
    'en-us': 'Add Items',
    'ru-ru': 'Добавить элементы',
  },
  recordReturn: {
    'en-us': '{modelName:string} Return',
    'ru-ru': 'Возврат {modelName:string}',
  },
  createRecord: {
    'en-us': 'Create {modelName:string}',
    'ru-ru': 'Создать {modelName:string}',
  },
  missing: {
    'en-us': 'Missing:',
    'ru-ru': 'Отсутствует:',
  },
  preparationsNotFound: {
    'en-us': 'No preparations were found.',
    'ru-ru': 'Никаких препаратов не обнаружено.',
  },
  problemsFound: {
    'en-us': 'There are problems with the entry:',
    'ru-ru': 'Обнаружены ошибки:',
  },
  recordSetCaption: {
    'en-us': 'By choosing a recordset ({{count:none | one | ??}} available)',
    'ru-ru': 'Выбрав набор записей (доступно {count:number|formatted})',
  },
  entryCaption: {
    'en-us': 'By entering {fieldName:string}s',
    'ru-ru': 'Ввести {fieldName:string}',
  },
  noPreparationsCaption: {
    'en-us': 'Without preparations',
    'ru-ru': 'Без подготовки',
  },
  noCollectionObjectCaption: {
    'en-us': 'Add unassociated item',
    'ru-ru': 'Добавить несвязанный элемент',
  },
  preparationsDialogTitle: {
    'en-us': 'Preparations',
    'ru-ru': 'Препараты',
  },
  preparationsCanNotBeReturned: {
    'en-us': `
      Preparations cannot be returned in this context.`,
    'ru-ru': `
      Препараты не могут быть возвращены в этом контексте.`,
  },
  noUnresolvedPreparations: {
    'en-us': 'There are no unresolved preparations for this loan.',
    'ru-ru': 'Незавершенных приготовлений по этому кредиту нет.',
  },
  remarks: {
    'en-us': 'Remarks',
    'ru-ru': 'Замечания',
  },
  unresolved: {
    'en-us': 'Unresolved',
    'ru-ru': 'Нерешенные',
  },
  return: {
    'en-us': 'Return',
    'ru-ru': 'Возвращение',
  },
  resolve: {
    'en-us': 'Resolve',
    'ru-ru': 'Разрешить',
  },
  returnAllPreparations: {
    'en-us': 'Return all preparations',
    'ru-ru': 'Вернуть все препараты',
  },
  returnSelectedPreparations: {
    'en-us': 'Return selected preparations',
    'ru-ru': 'Вернуть выбранные препараты',
  },
  selectAllAvailablePreparations: {
    'en-us': 'Select all available preparations',
    'ru-ru': 'Выбрать все доступные препараты',
  },
  selectAll: {
    'en-us': 'Select All',
    'ru-ru': 'Выбрать все',
  },
  selectedAmount: {
    'en-us': 'Selected Amount',
    'ru-ru': 'Выбранная сумма',
  },
  returnedAmount: {
    'en-us': 'Returned Amount',
    'ru-ru': 'Возвращенно',
  },
  resolvedAmount: {
    'en-us': 'Resolved Amount',
    'ru-ru': 'Решенный',
  },
  prepReturnFormatter: {
    'en-us': '{tableName:string}: {resource: string}',
    'ru-ru': '{tableName:string}: {resource: string}',
  },
  paleoMap: {
    'en-us': 'Paleo Map',
    'ru-ru': 'Карта Палео',
  },
  paleoRequiresGeographyDialogHeader: {
    'en-us': 'Geography Required',
    'ru-ru': 'Требуется география',
  },
  paleoRequiresGeographyDialogText: {
    'en-us': `
      The Paleo Map plugin requires that the locality have geographic
      coordinates and that the paleo context have a geographic age with at
      least a start time or and end time populated.`,
    'ru-ru': `
      Плагин Карта Палео требует, чтобы у населенного пункта были
      координаты и что палеоконтекст имеет географический возраст с
      заполнено как минимум время начала или время окончания.`,
  },
  unsupportedFormDialogHeader: {
    'en-us': 'Incorrect Form',
    'ru-ru': 'Неправильная форма',
  },
  unsupportedFormDialogText: {
    'en-us': `
      This plugin cannot be used on this form. Try moving it to the locality,
      collecting event or collection object forms.
    `,
    'ru-ru': `
      Этот плагин нельзя использовать в этой форме. Попробуй переместить его на
      форму местности, события сбора или объекта коллекции.
    `,
  },
  invalidDate: {
    'en-us': 'Invalid Date',
    'ru-ru': 'Недействительная дата',
  },
  deleteConfirmationDialogHeader: {
    'en-us': `
      Are you sure you want to permanently delete this {tableName:string} from the
      database?
    `,
    'ru-ru': `
      Вы уверены, что хотите навсегда удалить этот {tableName:string} из базы
      данных?
    `,
  },
  deleteConfirmationDialogText: {
    'en-us': 'This action cannot be undone.',
    'ru-ru': 'Это действие не может быть отменено.',
  },
  datePrecision: {
    'en-us': 'Date Precision',
    'ru-ru': 'Точность даты',
  },
  monthYear: {
    'en-us': 'Mon / Year',
    'ru-ru': 'Месяц / Год',
  },
  yearPlaceholder: {
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
  addToPickListConfirmationDialogHeader: {
    'en-us': 'Add to pick list?',
    'ru-ru': 'Добавить в список выбора?',
  },
  addToPickListConfirmationDialogText: {
    'en-us':
      'Add value "{value:string}" to the pick list named {pickListName:string}?',
    'ru-ru':
      'Добавить значение "{value:string}" в список выбора {pickListName:string}?',
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
  recordSetsDialogTitle: {
    'en-us': 'Record Sets ({count:number|formatted})',
    'ru-ru': 'Наборы объектов ({count:number|formatted})',
  },
  recordSet: {
    'en-us': 'Record Set',
    'ru-ru': 'Набор объектов',
  },
  recordSetFormatted: {
    'en-us': 'Record Set: {name:string}',
    'ru-ru': 'Набор объектов: {name:string}',
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
  reportProblemsDialogTitle: {
    'en-us': 'Problems with report',
    'ru-ru': 'Проблемы с отчетом',
  },
  reportsProblemsDialogText: {
    'en-us': 'The selected report has the following problems:',
    'ru-ru': 'В выбранном отчете есть следующие проблемы:',
  },
  missingAttachments: {
    'en-us': 'Missing attachments',
    'ru-ru': 'Отсутствующие вложения',
  },
  fix: {
    'en-us': 'Fix',
    'ru-ru': 'Исправить',
  },
  missingAttachmentsFixDialogTitle: {
    'en-us': 'Choose file',
    'ru-ru': 'Выберите файл',
  },
  reportParameters: {
    'en-us': 'Report Parameters',
    'ru-ru': 'Параметры отчета',
  },
  runReport: {
    'en-us': 'Run Report',
    'ru-ru': 'Запустить репорт',
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
  saveConflictDialogHeader: {
    'en-us': 'Save conflict',
    'ru-ru': 'Сохранить конфликт',
  },
  saveConflictDialogText: {
    'en-us': `
      The data shown on this page has been changed by another user or in
      another browser tab and is out of date. The page must be reloaded to
      prevent inconsistent data from being saved.
    `,
    'ru-ru': `
      Данные, отображаемые на этой странице, были изменены другим пользователем,
      или другоц вкладке браузера. Страницу необходимо перезагрузить
      чтобы предотвратить сохранение несогласованных данных.
    `,
  },
  saveBlockedDialogHeader: {
    'en-us': 'Save blocked',
    'ru-ru': 'Сохранение заблокировано',
  },
  saveBlockedDialogText: {
    'en-us': 'Form cannot be saved while the following errors exist:',
    'ru-ru': 'Форма не может быть сохранена, пока существуют следующие ошибки:',
  },
  resolvedLoans: {
    'en-us': 'Resolved Loans',
    'ru-ru': 'Решение Заемы',
  },
  openLoans: {
    'en-us': 'Open Loans',
    'ru-ru': 'Открытые займы',
  },
  gifts: {
    'en-us': 'Gifts',
    'ru-ru': 'Подарки',
  },
  exchanges: {
    'en-us': 'Exchanges',
    'ru-ru': 'Обмены',
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
      It was probably included on this form from Specify 6 and may be
      supported in the future.
    `,
    'ru-ru': `
      Вероятно, он был включен на етой форме в <i>Specify 6</i> м может бить
      поддерживаним в будущем.
    `,
  },
  commandName: {
    'en-us': 'Command name:',
    'ru-ru': 'Имя команды:',
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
    'ru-ru': `Этот плагин в настоящее время недоступна для Specify 7`,
  },
  pluginNotAvailableSecondDescription: {
    'en-us': `
      It was probably included on this form from Specify 6 and may be
      supported in the future.
    `,
    'ru-ru': `
      Вероятно, он был включен на етой форме в Specify 6 м может бить
      поддерживаним в будущем.
    `,
  },
  wrongTablePluginDialogText: {
    'en-us': `
      The plugin cannot be used on the {currentTable:string} form.
      It can only be used on the {correctTable:string} form.
    `,
    'ru-ru': `
      Этот плагин нельзя использовать в форме {currentTable:string}. Его можно
      использовать только в форме {correctTable:string}.
    `,
  },
  pluginName: {
    'en-us': 'Plugin name:',
    'ru-ru': 'Название плагина:',
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
    'en-us': 'Required Format: {format:string}.',
    'ru-ru': 'Обязательный формат: {format:string}.',
  },
  inputTypeNumber: {
    'en-us': `Value must be a number`,
    'ru-ru': `Значение должно быть числом`,
  },
  userAgentsPluginDialogTitle: {
    'en-us': 'Set User Agents',
    'ru-ru': 'Настроить пользовательских агентов',
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
  treeMerge: {
    'en-us': 'Tree Merge',
    'ru-ru': 'Слияние узлов дерева',
  },
  treeMove: {
    'en-us': 'Tree Move',
    'ru-ru': 'Перемещение узла дерева',
  },
  treeSynonymize: {
    'en-us': 'Tree Synonymize',
    'ru-ru': 'Синонимизированный узел дерева',
  },
  treeDesynonymize: {
    'en-us': 'Tree Desynonymize',
    'ru-ru': 'Отменено синонимизацию узла дерева',
  },
  unsupportedCellType: {
    'en-us': 'Unsupported cell type:',
    'ru-ru': 'Неподдерживаемый тип ячейки:',
  },
  unCataloged: {
    'en-us': 'uncataloged',
    'ru-ru': 'некаталогизированный',
  },
  additionalResultsOmitted: {
    'en-us': 'Additional results omitted',
    'ru-ru': 'Дополнительные результаты опущены',
  },
  recordSelectorUnloadProtectDialogHeader: {
    'en-us': 'Proceed without saving?',
    'ru-ru': 'Продолжить без сохранения?',
  },
  recordSelectorUnloadProtectDialogText: {
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
  tooLongErrorMessage: {
    'en-us':
      'Field value is too long. Max allowed length is {maxLength:number|formatted}',
    'ru-ru':
      'Значение поля слишком длинное. Максимально допустимая длина {maxLength:number|formatted}',
  },
  returnedPreparations: {
    'en-us': 'Returned Preparations',
    'ru-ru': 'Возвращенные препараты',
  },
  returnedAndSaved: {
    'en-us':
      '{count:number|formatted} preparations have been returned and saved.',
    'ru-ru': '{count:number|formatted} препарата возвращены и сохранены.',
  },
  deselectAll: {
    'en-us': 'Deselect all',
    'ru-ru': 'Отменить выбор',
  },
  available: {
    'en-us': 'Available',
    'ru-ru': 'В наличии',
  },
  unavailable: {
    'en-us': 'Unavailable',
    'ru-ru': 'Недоступен',
  },
  returnLoan: {
    'en-us': 'Return Loan',
    'ru-ru': 'Возврат Заема',
  },
  printInvoice: {
    'en-us': 'Print Invoice',
    'ru-ru': 'Распечатать Накладную',
  },
  loanWithoutPreparation: {
    'en-us': 'Loan w/o Preps',
    'ru-ru': 'Заем без Препаратов',
  },
  loanWithoutPreparationDescription: {
    'en-us': 'Create a loan with no preparations',
    'ru-ru': 'Создать Заем без препаратов',
  },
  createLoan: {
    'en-us': 'Create a Loan',
    'ru-ru': 'Создать Заем',
  },
  editLoan: {
    'en-us': 'Edit Loan',
    'ru-ru': 'Редактировать Заем',
  },
  createdGift: {
    'en-us': 'Create a Gift',
    'ru-ru': 'Создать Дар',
  },
  editGift: {
    'en-us': 'Edit Gift',
    'ru-ru': 'Редактировать Дар',
  },
  createInformationRequest: {
    'en-us': 'Create Information Request',
    'ru-ru': 'Создать Экспресс Запрос',
  },
  missingReportQueryDialogHeader: {
    'en-us': 'Missing Report Query',
    'ru-ru': 'Отсутствует запрос отчета',
  },
  missingReportQueryDialogText: {
    'en-us': 'This report does not have an associated query',
    'ru-ru': 'Этот отчет не имеет связанного запроса',
  },
  missingReportDialogHeader: {
    'en-us': 'Missing report',
    'ru-ru': 'Отсутствует отчет',
  },
  missingReportDialogText: {
    'en-us': 'Unable to find an SpReport record for this App Resource',
    'ru-ru': 'Не удалось найти запись SpReport для этого ресурса приложения',
  },
  deletedInline: {
    'en-us': '(deleted)',
    'ru-ru': '(удален)',
  },
  duplicateRecordSetItemDialogHeader: {
    'en-us': 'Duplicate Record Set Item',
    'ru-ru': 'Дублирующий элемент набора записей',
  },
  duplicateRecordSetItemDialogText: {
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
    'en-us': 'Share Record:',
    'ru-ru': 'Поделиться объектом:',
  },
  findUsages: {
    'en-us': 'Find usages',
    'ru-ru': 'Найти использование',
  },
  usagesOfPickList: {
    'en-us': 'Usages of "{pickList:string}" pick list',
    'ru-ru': 'Использование "{pickList:string}" списка выбора',
  },
  generateLabel: {
    'en-us': 'Generate label',
    'ru-ru': 'Сгенерировать метку',
  },
  generateLabelOnSave: {
    'en-us': 'Generate label on save',
    'ru-ru': 'Генерировать метку при сохранении',
  },
  generateReport: {
    'en-us': 'Generate report',
    'ru-ru': 'Сгенерировать отчет',
  },
  generateReportOnSave: {
    'en-us': 'Generate report on save',
    'ru-ru': 'Генерировать отчет при сохранении',
  },
  form: {
    'en-us': 'Subform',
    'ru-ru': 'Форма',
  },
  formTable: {
    'en-us': 'Grid',
    'ru-ru': 'Таблица',
  },
  formTableHeading: {
    'en-us': '{relationshipName:string} ({count:number|formatted})',
    'ru-ru': '{relationshipName:string} ({count:number|formatted})',
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
    'en-us': '{tableName:string} #{id:number}',
    'ru-ru': '{tableName:string} #{id:number}',
  },
  resourceDeletedDialogHeader: {
    'en-us': 'Item deleted',
    'ru-ru': 'Удалено',
  },
  resourceDeletedDialogText: {
    'en-us': 'Item was deleted successfully.',
    'ru-ru': 'Успешно удален.',
  },
} as const);
