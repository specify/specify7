/**
 * Localization strings used on Data Entry forms and Interactions
 * (don't confuse this with schema localization strings)
 *
 * @module
 */

import { createDictionary, header } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

const formsText = createDictionary({
  // Attachments
  filterAttachments: {
    'en-us': 'Filter Attachments',
    'ru-ru': 'Фильтрировать вложений',
    ca: 'Filter Attachments',
  },
  attachmentServerUnavailable: {
    'en-us': 'Attachment server unavailable.',
    'ru-ru': 'Сервер прикрепленных файлов недоступен.',
    ca: 'Attachment server unavailable.',
  },
  attachmentUploadDialogTitle: {
    'en-us': 'Uploading...',
    'ru-ru': 'Закачивание...',
    ca: 'Uploading...',
  },
  tables: {
    'en-us': 'Tables',
    'ru-ru': 'Таблицы',
    ca: 'Tables',
  },
  openDataDialogTitle: {
    'en-us': 'Opening...',
    'ru-ru': 'Открытие...',
    ca: 'Opening...',
  },
  noAttachments: {
    'en-us': 'There are no attachments',
    'ru-ru': 'В вашей коллекции нет вложений',
    ca: 'No hi ha fitxers adjunts',
  },
  clone: {
    'en-us': 'Clone',
    'ru-ru': 'Клонировать',
    ca: 'Clone',
  },
  linkInline: {
    'en-us': 'link',
    'ru-ru': 'ссылка',
    ca: 'link',
  },
  // BusinessRules
  valueMustBeUniqueToField: {
    'en-us': (fieldName: string) => `Value must be unique to ${fieldName}`,
    'ru-ru': (fieldName: string) =>
      `Значение ${fieldName} должно быть уникальным`,
    ca: (fieldName: string) => `Value must be unique to ${fieldName}`,
  },
  valuesOfMustBeUniqueToField: {
    'en-us': (fieldName: string, values: string) =>
      `Values of ${values} must be unique to ${fieldName}}`,
    'ru-ru': (fieldName: string, values: string) =>
      `Значения ${values} в ${fieldName} должны быть уникальным`,
    ca: (fieldName: string, values: string) =>
      `Values of ${values} must be unique to ${fieldName}}`,
  },
  database: {
    'en-us': 'database',
    'ru-ru': 'база данных',
    ca: 'database',
  },
  // CollectionReLoneToManyPlugin
  collectionObject: {
    'en-us': 'Collection Object',
    'ru-ru': 'Объект коллекции',
    ca: 'Collection Object',
  },
  // "set" as in "Set Value"
  set: {
    'en-us': 'Set',
    'ru-ru': 'Установить',
    ca: 'Set',
  },
  // Data Model
  specifySchema: {
    'en-us': 'Specify Schema',
    'ru-ru': 'Схема базы данных Specify',
    ca: 'Specify Schema',
  },
  // Data View
  emptyRecordSetHeader: {
    'en-us': (recordSetName: string) => `
      The Record Set "${recordSetName}" contains no records.`,
    'ru-ru': (recordSetName: string) => `
      Набор объектов "${recordSetName}" является пустым.`,
    ca: (recordSetName: string) => `
      The Record Set "${recordSetName}" contains no records.`,
  },
  emptyRecordSetMessage: {
    'en-us': (
      remove: (label: string) => string,
      add: (label: string) => string
    ) => `
      You can ${remove('delete')} the record set or ${add('add')} records
      to it.`,
    'ru-ru': (
      remove: (label: string) => string,
      add: (label: string) => string
    ) => `
      Вы можете ${remove('удалить')} набор записей или
      ${add('добавить')} к нему.`,
    ca: (remove: (label: string) => string, add: (label: string) => string) => `
      You can ${remove('delete')} the record set or ${add('add')} records
      to it.`,
  },
  emptyRecordSetSecondMessage: {
    'en-us': `Be aware that another user maybe getting ready to add records,
      so only delete this record set if you are sure it is not to be used.`,
    'ru-ru': `Имейте в виду, что другой пользователь, возможно, готовится
      добавить объекты, поэтому удаляйте этот набор записей только в том случае,
      если вы уверены, что он не будет использованным.`,
    ca: `Be aware that another user maybe getting ready to add records,
      so only delete this record set if you are sure it is not to be used.`,
  },
  checkingIfResourceCanBeDeleted: {
    'en-us': 'Checking if resource can be deleted.',
    'ru-ru': 'Проверка возможности удаления ресурса.',
    ca: 'Checking if resource can be deleted.',
  },
  deleteBlockedDialogTitle: {
    'en-us': 'Delete resource',
    'ru-ru': 'Удалить ресурс',
    ca: 'Delete resource',
  },
  deleteBlockedDialogHeader: {
    'en-us': header('Delete blocked'),
    'ru-ru': header('Удаление заблокировано'),
    ca: header('Delete blocked'),
  },
  deleteBlockedDialogMessage: {
    'en-us': `
      The resource cannot be deleted because it is referenced through the
      following fields:`,
    'ru-ru': `
      Ресурс не может быть удален, потому что на него есть ссылка через
      следующие поля:`,
    ca: `
      The resource cannot be deleted because it is referenced through the
      following fields:`,
  },
  contract: {
    'en-us': 'Contract',
    'ru-ru': 'Договор',
    ca: 'Contract',
  },
  // Forms Dialog
  formsDialogTitle: {
    'en-us': 'Forms',
    'ru-ru': 'Формы',
    ca: 'Forms',
  },
  // Interactions
  addItems: {
    'en-us': 'Add Items',
    'ru-ru': 'Добавить элементы',
    ca: 'Add Items',
  },
  recordReturn: {
    'en-us': (modelName: string) => `${modelName} Return`,
    'ru-ru': (modelName: string) => `Возврат ${modelName}`,
    ca: (modelName: string) => `${modelName} Return`,
  },
  createRecord: {
    'en-us': (modelName: string) => `Create ${modelName}`,
    'ru-ru': (modelName: string) => `Создать ${modelName}`,
    ca: (modelName: string) => `Create ${modelName}`,
  },
  invalid: {
    'en-us': 'Invalid:',
    'ru-ru': 'Неверный:',
    ca: 'Invalid:',
  },
  missing: {
    'en-us': 'Missing:',
    'ru-ru': 'Отсутствует:',
    ca: 'Missing:',
  },
  preparationsNotFound: {
    'en-us': 'No preparations were found.',
    'ru-ru': 'Никаких препаратов не обнаружено.',
    ca: 'No preparations were found.',
  },
  problemsFound: {
    'en-us': 'There are problems with the entry:',
    'ru-ru': 'Обнаружены ошибки:',
    ca: 'There are problems with the entry:',
  },
  ignoreAndContinue: {
    'en-us': 'Ignore and continue',
    'ru-ru': 'Игнорировать и продолжить',
    ca: 'Ignore and continue',
  },
  recordSetCaption: {
    'en-us': (count: number) =>
      `By choosing a recordset (${count === 0 ? 'none' : count} available)`,
    'ru-ru': (count: number) => `Выбрав набор записей (доступно ${count})`,
    ca: (count: number) =>
      `By choosing a recordset (${count === 0 ? 'none' : count} available)`,
  },
  entryCaption: {
    'en-us': (fieldName: string) => `By entering ${fieldName}s`,
    'ru-ru': (fieldName: string) => `Ввести ${fieldName}`,
    ca: (fieldName: string) => `By entering ${fieldName}s`,
  },
  noPreparationsCaption: {
    'en-us': 'Without preparations',
    'ru-ru': 'Без подготовки',
    ca: 'Without preparations',
  },
  noCollectionObjectCaption: {
    'en-us': 'Add unassociated item',
    'ru-ru': 'Добавить несвязанный элемент',
    ca: 'Add unassociated item',
  },
  actionNotSupported: {
    'en-us': (actionName: string) => `${actionName} is not supported.`,
    'ru-ru': (actionName: string) => `${actionName} не поддерживается.`,
    ca: (actionName: string) => `${actionName} is not supported.`,
  },
  // Loan Return
  preparationsDialogTitle: {
    'en-us': 'Preparations',
    'ru-ru': 'Препараты',
    ca: 'Preparations',
  },
  preparationsCanNotBeReturned: {
    'en-us': `
      Preparations cannot be returned in this context.`,
    'ru-ru': `
      Препараты не могут быть возвращены в этом контексте.`,
    ca: `
      Preparations cannot be returned in this context.`,
  },
  noUnresolvedPreparations: {
    'en-us': 'There no unresolved preparations for this loan.',
    'ru-ru': 'Незавершенных приготовлений по этому кредиту нет.',
    ca: 'There no unresolved preparations for this loan.',
  },
  remarks: {
    'en-us': 'Remarks',
    'ru-ru': 'Замечания',
    ca: 'Remarks',
  },
  unresolved: {
    'en-us': 'Unresolved',
    'ru-ru': 'Нерешенные',
    ca: 'Unresolved',
  },
  return: {
    'en-us': 'Return',
    'ru-ru': 'Возвращение',
    ca: 'Return',
  },
  resolve: {
    'en-us': 'Resolve',
    'ru-ru': 'Разрешить',
    ca: 'Resolve',
  },
  returnAllPreparations: {
    'en-us': 'Return all preparations',
    'ru-ru': 'Вернуть все препараты',
    ca: 'Return all preparations',
  },
  returnSelectedPreparations: {
    'en-us': 'Return selected preparations',
    'ru-ru': 'Вернуть выбранные препараты',
    ca: 'Return selected preparations',
  },
  selectAllAvailablePreparations: {
    'en-us': 'Select all available preparations',
    'ru-ru': 'Выбрать все доступные препараты',
    ca: 'Select all available preparations',
  },
  selectAll: {
    'en-us': 'Select All',
    'ru-ru': 'Выбрать все',
    ca: 'Select All',
  },
  selectedAmount: {
    'en-us': 'Selected Amount',
    'ru-ru': 'Выбранная сумма',
    ca: 'Selected Amount',
  },
  returnedAmount: {
    'en-us': 'Returned Amount',
    'ru-ru': 'Возвращенно',
    ca: 'Returned Amount',
  },
  resolvedAmount: {
    'en-us': 'Resolved Amount',
    'ru-ru': 'Решенный',
    ca: 'Resolved Amount',
  },
  receivedBy: {
    'en-us': 'Received by',
    'ru-ru': 'Получено',
    ca: 'Received by',
  },
  dateResolved: {
    'en-us': 'Date resolved',
    'ru-ru': 'Дата разрешения',
    ca: 'Date resolved',
  },
  // PaleoLocationPlugin
  paleoMap: {
    'en-us': 'Paleo Map',
    'ru-ru': 'Карта Палео',
    ca: 'Paleo Map',
  },
  paleoRequiresGeographyDialogTitle: {
    'en-us': 'Paleo Map',
    'ru-ru': 'Карта Палео',
    ca: 'Paleo Map',
  },
  paleoRequiresGeographyDialogHeader: {
    'en-us': header('Geography Required'),
    'ru-ru': header('Требуется география'),
    ca: header('Geography Required'),
  },
  paleoRequiresGeographyDialogMessage: {
    'en-us': `
      The Paleo Map plugin requires that the locality have geographic
      coordinates and that the paleo context have a geographic age with at
      least a start time or and end time populated.`,
    'ru-ru': `
      Плагин Карта Палео требует, чтобы у населенного пункта были
      координаты и что палеоконтекст имеет географический возраст с
      заполнено как минимум время начала или время окончания.`,
    ca: `
      The Paleo Map plugin requires that the locality have geographic
      coordinates and that the paleo context have a geographic age with at
      least a start time or and end time populated.`,
  },
  noCoordinatesDialogTitle: {
    'en-us': 'No coordinates',
    'ru-ru': 'Нет координат',
    ca: 'No coordinates',
  },
  noCoordinatesDialogHeader: {
    'en-us': (modelName: string) =>
      header(`Not enough information to map ${modelName}`),
    'ru-ru': (modelName: string) =>
      header(`Недостаточно информации для отображения ${modelName}`),
    ca: (modelName: string) =>
      header(`Not enough information to map ${modelName}`),
  },
  noCoordinatesDialogMessage: {
    'en-us': (modelName: string) => `
    ${modelName} must have coordinates and paleo context to be mapped.`,
    'ru-ru': (modelName: string) => `
    Для отображения ${modelName}, он должен иметь координаты и палеоконтекст.`,
    ca: (modelName: string) => `
    ${modelName} must have coordinates and paleo context to be mapped.`,
  },
  unsupportedFormDialogTitle: {
    'en-us': 'Unsupported Plugin',
    'ru-ru': 'Неподдерживаемый плагин',
    ca: 'Unsupported Plugin',
  },
  unsupportedFormDialogHeader: {
    'en-us': header('Incorrect Form'),
    'ru-ru': header('Неправильная форма'),
    ca: header('Incorrect Form'),
  },
  unsupportedFormDialogMessage: {
    'en-us': `
      This plugin cannot be used on this form. Try moving it to the locality,
      collecting event or collection object forms.`,
    'ru-ru': `
      Этот плагин нельзя использовать в этой форме. Попробуй переместить его на
      форму местности, события сбора или объекта коллекции.`,
    ca: `
      This plugin cannot be used on this form. Try moving it to the locality,
      collecting event or collection object forms.`,
  },
  // DateParser
  invalidDate: {
    'en-us': 'Invalid Date',
    'ru-ru': 'Недействительная дата',
    ca: 'Invalid Date',
  },
  // DeleteButton
  deleteConfirmationDialogTitle: {
    'en-us': 'Delete?',
    'ru-ru': 'Удалить?',
    ca: 'Delete?',
  },
  deleteConfirmationDialogHeader: {
    'en-us': header(
      'Are you sure you want to permanently delete this item(s)?'
    ),
    'ru-ru': header('Вы уверены, что хотите навсегда удалить этот элемент(ы)?'),
    ca: header('Are you sure you want to permanently delete this item(s)?'),
  },
  deleteConfirmationDialogMessage: {
    'en-us': 'This action can not be undone.',
    'ru-ru': 'Это действие не может быть отменено.',
    ca: 'This action can not be undone.',
  },
  // PartialDateUi
  datePrecision: {
    'en-us': 'Date Precision',
    'ru-ru': 'Точность даты',
    ca: 'Date Precision',
  },
  monthYear: {
    'en-us': 'Mon / Year',
    'ru-ru': 'Месяц / Год',
    ca: 'Mon / Year',
  },
  yearPlaceholder: {
    'en-us': 'YYYY',
    'ru-ru': 'ГГГГ',
    ca: 'YYYY',
  },
  today: {
    'en-us': 'Today',
    'ru-ru': 'Сегодня',
    ca: 'Today',
  },
  todayButtonDescription: {
    'en-us': 'Set to current date',
    'ru-ru': 'Установить на текущую дату',
    ca: 'Set to current date',
  },
  // PickListBox
  addToPickListConfirmationDialogTitle: {
    'en-us': 'Pick List',
    'ru-ru': 'Список выбора',
    ca: 'Pick List',
  },
  addToPickListConfirmationDialogHeader: {
    'en-us': header('Add to pick list?'),
    'ru-ru': header('Добавить в список выбора?'),
    ca: header('Add to pick list?'),
  },
  addToPickListConfirmationDialogMessage: {
    'en-us': (value: string, pickListName: string) =>
      `Add value "${value}" to the pick list named ${pickListName}?`,
    'ru-ru': (value: string, pickListName: string) =>
      `Добавить значение "${value}" в список выбора ${pickListName}?`,
    ca: (value: string, pickListName: string) =>
      `Add value "${value}" to the pick list named ${pickListName}?`,
  },
  // ReadOnlyPickListComboBox
  noData: {
    'en-us': 'No Data.',
    'ru-ru': 'Нет данных.',
    ca: 'No Data.',
  },
  // RecordSelector
  removeRecordDialogHeader: {
    'en-us': header('Remove dependent record'),
    'ru-ru': header('Удалить зависимую запись'),
    ca: header('Remove dependent record'),
  },
  removeRecordDialogMessage: {
    'en-us': 'Are you sure you want to remove this record?',
    'ru-ru': 'Вы уверены, что хотите удалить эту запись?',
    ca: 'Are you sure you want to remove this record?',
  },
  // RecordSetsDialog
  recordSetsDialogTitle: {
    'en-us': (count: number) => `Record Sets (${count})`,
    'ru-ru': (count: number) => `Наборы объектов (${count})`,
    ca: (count: number) => `Record Sets (${count})`,
  },
  createRecordSetButtonDescription: {
    'en-us': 'Create a new record set',
    'ru-ru': 'Создать новый набор объектов',
    ca: 'Create a new record set',
  },
  recordSetDeletionWarning: {
    'en-us': (recordSetName: string) => `
      The record set "${recordSetName}" will be deleted. The referenced
      records will NOT be deleted.`,
    'ru-ru': (recordSetName: string) => `
      Набор объектов "${recordSetName}" будет удален. Связанные записи не будут
      удалены.`,
    ca: (recordSetName: string) => `
      The record set "${recordSetName}" will be deleted. The referenced
      records will NOT be deleted.`,
  },
  // Reports
  reportsCanNotBePrintedDialogMessage: {
    'en-us': 'Reports/Labels cannot be printed in this context.',
    'ru-ru': 'Отчеты / этикетки не могут быть напечатаны в этом контексте.',
    ca: 'Reports/Labels cannot be printed in this context.',
  },
  noReportsAvailable: {
    'en-us': 'No reports are available for this table.',
    'ru-ru': 'Для этой таблицы нет отчетов.',
    ca: 'No reports are available for this table.',
  },
  reportProblemsDialogTitle: {
    'en-us': 'Problems with report',
    'ru-ru': 'Проблемы с отчетом',
    ca: 'Problems with report',
  },
  reportsProblemsDialogMessage: {
    'en-us': 'The selected report has the following problems:',
    'ru-ru': 'В выбранном отчете есть следующие проблемы:',
    ca: 'The selected report has the following problems:',
  },
  badImageExpressions: {
    'en-us': 'Bad Image Expressions',
    'ru-ru': 'Плохое выражение изображений',
    ca: 'Bad Image Expressions',
  },
  missingAttachments: {
    'en-us': 'Missing attachments',
    'ru-ru': 'Отсутствующие вложения',
    ca: 'Missing attachments',
  },
  // A verb
  fix: {
    'en-us': 'Fix',
    'ru-ru': 'Исправить',
    ca: 'Fix',
  },
  missingAttachmentsFixDialogTitle: {
    'en-us': 'Choose file',
    'ru-ru': 'Выберите файл',
    ca: 'Choose file',
  },
  reportParameters: {
    'en-us': 'Report Parameters',
    'ru-ru': 'Параметры отчета',
    ca: 'Report Parameters',
  },
  labelFromRecordSetDialogTitle: {
    'en-us': 'From Record Set',
    'ru-ru': 'Из набора объектов',
    ca: 'From Record Set',
  },
  runReport: {
    'en-us': 'Run Report',
    'ru-ru': 'Запустить репорт',
    ca: 'Run Report',
  },
  // ResourceView
  missingFormDefinitionPageHeader: {
    'en-us': 'Missing form definition',
    'ru-ru': 'Отсутствует определение формы',
    ca: 'Missing form definition',
  },
  missingFormDefinitionPageContent: {
    'en-us': `
      Specify was unable to find the form definition to display this resource`,
    'ru-ru': `
      Specify не удалось найти определение формы для отображения этого ресурса`,
    ca: `
      Specify was unable to find the form definition to display this resource`,
  },
  addingToRecordSet: {
    'en-us': 'Adding to Record Set and Database',
    'ru-ru': 'Добавление в набор записей и базу данных',
    ca: 'Adding to Record Set and Database',
  },
  createRecordButtonDescription: {
    'en-us': 'Create record and add to Record Set',
    'ru-ru': 'Создать запись и добавить в Набор объектов',
    ca: 'Create record and add to Record Set',
  },
  recordSetAreaDescription: {
    'en-us': (recordSetName: string): string => `Record Set: ${recordSetName}`,
    'ru-ru': (recordSetName: string): string =>
      `Набор объектов: ${recordSetName}`,
    ca: (recordSetName: string): string => `Record Set: ${recordSetName}`,
  },
  firstRecord: {
    'en-us': 'First Record',
    'ru-ru': 'Первый объект',
    ca: 'Primer disc',
  },
  lastRecord: {
    'en-us': 'Last Record',
    'ru-ru': 'Последний объект',
    ca: 'Últim disc',
  },
  previousRecord: {
    'en-us': 'Previous Record',
    'ru-ru': 'Последняя запись',
    ca: 'Previous Record',
  },
  nextRecord: {
    'en-us': 'Next Record',
    'ru-ru': 'Следующий объект',
    ca: 'Next Record',
  },
  currentPositionInTheRecordSet: {
    'en-us': 'Current Position in the Record Set',
    'ru-ru': 'Текущая позиция в наборе объектов',
    ca: 'Current Position in the Record Set',
  },
  // Current index in the record set
  aOutOfB: {
    'en-us': (current: number, total: number): string =>
      `${current} out of ${total}`,
    'ru-ru': (current: number, total: number): string =>
      `${current} из ${total}`,
    ca: (current: number, total: number): string =>
      `${current} out of ${total}`,
  },
  currentRecord: {
    'en-us': (total: number): string => `Current object (out of ${total})`,
    'ru-ru': (total: number): string => `Текущий объект (из ${total})`,
    ca: (total: number): string => `L'objecte actual (de ${total})`,
  },
  // SaveButton
  unsavedFormUnloadProtect: {
    'en-us': 'This form has not been saved.',
    'ru-ru': 'Эта форма не была сохранена.',
    ca: 'This form has not been saved.',
  },
  saveAndAddAnother: {
    'en-us': 'Save and Add Another',
    'ru-ru': 'Сохранить и добавить еще',
    ca: 'Save and Add Another',
  },
  saveConflictDialogTitle: {
    'en-us': 'Save record',
    'ru-ru': 'Сохранить запись',
    ca: 'Save record',
  },
  saveConflictDialogHeader: {
    'en-us': header('Save conflict'),
    'ru-ru': header('Сохранить конфликт'),
    ca: header('Save conflict'),
  },
  saveConflictDialogMessage: {
    'en-us': `
      The data shown on this page has been changed by another user or in
      another browser tab and is out of date. The page must be reloaded to
      prevent inconsistent data from being saved.`,
    'ru-ru': `
      Данные, отображаемые на этой странице, были изменены другим пользователем,
      или другоц вкладке браузера. Страницу необходимо перезагрузить
      чтобы предотвратить сохранение несогласованных данных.`,
    ca: `
      The data shown on this page has been changed by another user or in
      another browser tab and is out of date. The page must be reloaded to
      prevent inconsistent data from being saved.`,
  },
  saveBlockedDialogTitle: {
    'en-us': 'Save record',
    'ru-ru': 'Сохранить запись',
    ca: 'Save record',
  },
  saveBlockedDialogHeader: {
    'en-us': header('Save blocked'),
    'ru-ru': header('Сохранение заблокировано'),
    ca: header('Save blocked'),
  },
  saveBlockedDialogMessage: {
    'en-us': 'Form cannot be saved while the following errors exist:',
    'ru-ru': 'Форма не может быть сохранена, пока существуют следующие ошибки:',
    ca: 'Form cannot be saved while the following errors exist:',
  },
  // ShowTransCommand
  resolvedLoans: {
    'en-us': 'Resolved Loans',
    'ru-ru': 'Решение Заемы',
    ca: 'Resolved Loans',
  },
  // Open is a noun
  openLoans: {
    'en-us': 'Open Loans',
    'ru-ru': 'Открытые займы',
    ca: 'Open Loans',
  },
  gifts: {
    'en-us': 'Gifts',
    'ru-ru': 'Подарки',
    ca: 'Gifts',
  },
  exchanges: {
    'en-us': 'Exchanges',
    'ru-ru': 'Обмены',
    ca: 'Exchanges',
  },
  // SpecifyCommands
  unavailableCommandButton: {
    'en-us': 'Command N/A',
    'ru-ru': 'Команда недоступна',
    ca: 'Command N/A',
  },
  unavailableCommandDialogTitle: {
    'en-us': 'Command Not Available',
    'ru-ru': 'Команда недоступна',
    ca: 'Command Not Available',
  },
  unavailableCommandDialogHeader: {
    'en-us': header('Command Not Available'),
    'ru-ru': header('Команда недоступна'),
    ca: header('Command Not Available'),
  },
  unavailableCommandDialogMessage: {
    'en-us': `
      This command is currently unavailable for <i>Specify&nbsp7</i>
      It was probably included on this form from <i>Specify&nbsp6</i> and
      may be supported in the future.`,
    'ru-ru': `
      Эта команда в настоящее время недоступна для <i>Specify&nbsp7</i>
      Вероятно, она была включена на етой форме в <i>Specify&nbsp6</i> м
      может бить поддерживаним в будущем.`,
    ca: `
      This command is currently unavailable for <i>Specify&nbsp7</i>
      It was probably included on this form from <i>Specify&nbsp6</i> and
      may be supported in the future.`,
  },
  commandName: {
    'en-us': 'Command name:',
    'ru-ru': 'Имя команды:',
    ca: 'Command name:',
  },
  // SpecifyPlugins
  unavailablePluginButton: {
    'en-us': 'Plugin N/A',
    'ru-ru': 'Плагин недоступен',
    ca: 'Plugin N/A',
  },
  unavailablePluginDialogTitle: {
    'en-us': 'Plugin Not Available',
    'ru-ru': 'Плагин недоступен',
    ca: 'Plugin Not Available',
  },
  unavailablePluginDialogHeader: {
    'en-us': header('Plugin Not Available'),
    'ru-ru': header('Плагин недоступен'),
    ca: header('Plugin Not Available'),
  },
  unavailablePluginDialogMessage: {
    'en-us': `
      This plugin is currently unavailable for <i>Specify&nbsp7</i>
      It was probably included on this form from <i>Specify&nbsp6</i> and
      may be supported in the future.`,
    'ru-ru': `
      Этот плагин в настоящее время недоступна для <i>Specify&nbsp7</i>
      Вероятно, он был включен на етой форме в <i>Specify&nbsp6</i> м
      может бить поддерживаним в будущем.`,
    ca: `
      This plugin is currently unavailable for <i>Specify&nbsp7</i>
      It was probably included on this form from <i>Specify&nbsp6</i> and
      may be supported in the future.`,
  },
  pluginName: {
    'en-us': 'Plugin name:',
    'ru-ru': 'Название плагина:',
    ca: 'Plugin name:',
  },
  // SubViewHeader
  link: {
    'en-us': 'Link',
    'ru-ru': 'Ссылка',
    ca: 'Link',
  },
  visit: {
    'en-us': 'Visit',
    'ru-ru': 'Открыть',
    ca: 'Visit',
  },
  // UiParse
  illegalBool: {
    'en-us': 'Illegal value for a Yes/No field',
    'ru-ru': 'Недопустимое значение для поля Да / Нет',
    ca: 'Illegal value for a Yes/No field',
  },
  requiredField: {
    'en-us': 'Field is required.',
    'ru-ru': 'Поле обязательно для заполнения.',
    ca: 'Field is required.',
  },
  requiredFormat: {
    'en-us': (format: string) => `Required Format: ${format}.`,
    'ru-ru': (format: string) => `Обязательный формат: ${format}.`,
    ca: (format: string) => `Required Format: ${format}.`,
  },
  noParser: {
    'en-us': (type: string) => `No parser for type ${type}`,
    'ru-ru': (type: string) => `Нет парсера для типа ${type}`,
    ca: (type: string) => `No parser for type ${type}`,
  },
  inputTypeNumber: {
    'en-us': `Value must be a number`,
    'ru-ru': `Значение должно быть числом`,
    ca: `Value must be a number`,
  },
  minimumLength: {
    'en-us': (number: number) =>
      `Minimum length for this field is ${number} characters`,
    'ru-ru': (number: number) =>
      `Минимальная длина этого поля ${number} символов`,
    ca: (number: number) =>
      `Minimum length for this field is ${number} characters`,
  },
  maximumLength: {
    'en-us': (number: number) =>
      `Value can not be longer than ${number} characters`,
    'ru-ru': (number: number) =>
      `Значение не может быть длиннее чем ${number} символов`,
    ca: (number: number) => `Value can not be longer than ${number} characters`,
  },
  minimumNumber: {
    'en-us': (number: number) => `Number must be smaller than ${number}`,
    'ru-ru': (number: number) => `Число должно быть меньше ${number}`,
    ca: (number: number) => `Number must be smaller than ${number}`,
  },
  maximumNumber: {
    'en-us': (number: number) => `Value must be greater than ${number}`,
    'ru-ru': (number: number) => `Число должно быть больше ${number}`,
    ca: (number: number) => `Value must be greater than ${number}`,
  },
  wrongStep: {
    'en-us': (step: number) => `Value must be a multiple of ${step}`,
    'ru-ru': (step: number) => `Число должно быть кратным ${step}`,
    ca: (step: number) => `Value must be a multiple of ${step}`,
  },
  // UserAgentsPlugin
  setAgents: {
    'en-us': 'Set Agents',
    'ru-ru': 'Подключить к агенту',
    ca: 'Set Agents',
  },
  setAgentsDisabledButtonDescription: {
    'en-us': 'Save user before adding agents.',
    'ru-ru': 'Сохраните пользователя перед добавлением агентов.',
    ca: 'Save user before adding agents.',
  },
  userAgentsPluginDialogTitle: {
    'en-us': 'Set User Agents',
    'ru-ru': 'Настроить пользовательских агентов',
    ca: 'Set User Agents',
  },
});

export default formsText;
