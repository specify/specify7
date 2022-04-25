/**
 * Localization strings used on Data Entry forms and Interactions
 * (don't confuse this with schema localization strings)
 *
 * @module
 */

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

export const formsText = createDictionary({
  // Attachments
  order: {
    'en-us': 'Order By',
    'ru-ru': 'Сортировать по',
    ca: 'Order By',
    'es-es': 'Order By',
  },
  attachmentServerUnavailable: {
    'en-us': 'Attachment server unavailable.',
    'ru-ru': 'Сервер прикрепленных файлов недоступен.',
    ca: 'Attachment server unavailable.',
    'es-es': 'Attachment server unavailable.',
  },
  attachmentUploadDialogTitle: {
    'en-us': 'Uploading...',
    'ru-ru': 'Закачивание...',
    ca: 'Uploading...',
    'es-es': 'Uploading...',
  },
  noAttachments: {
    'en-us': 'There are no attachments',
    'ru-ru': 'В вашей коллекции нет вложений',
    ca: 'No hi ha fitxers adjunts',
    'es-es': 'There are no attachments',
  },
  clone: {
    'en-us': 'Clone',
    'ru-ru': 'Клонировать',
    ca: 'Clone',
    'es-es': 'Clone',
  },
  // BusinessRules
  valueMustBeUniqueToField: {
    'en-us': (fieldName: string) => `Value must be unique to ${fieldName}`,
    'ru-ru': (fieldName: string) =>
      `Значение ${fieldName} должно быть уникальным`,
    ca: (fieldName: string) => `Value must be unique to ${fieldName}`,
    'es-es': (fieldName: string) => `Value must be unique to ${fieldName}`,
  },
  valuesOfMustBeUniqueToField: {
    'en-us': (fieldName: string, values: string) =>
      `Values of ${values} must be unique to ${fieldName}}`,
    'ru-ru': (fieldName: string, values: string) =>
      `Значения ${values} в ${fieldName} должны быть уникальным`,
    ca: (fieldName: string, values: string) =>
      `Values of ${values} must be unique to ${fieldName}}`,
    'es-es': (fieldName: string, values: string) =>
      `Values of ${values} must be unique to ${fieldName}}`,
  },
  database: {
    'en-us': 'database',
    'ru-ru': 'база данных',
    ca: 'database',
    'es-es': 'database',
  },
  // CollectionReLoneToManyPlugin
  collectionObject: {
    'en-us': 'Collection Object',
    'ru-ru': 'Объект коллекции',
    ca: 'Collection Object',
    'es-es': 'Collection Object',
  },
  // Data Model
  specifySchema: {
    'en-us': 'Specify Schema',
    'ru-ru': 'Схема базы данных Specify',
    ca: 'Specify Schema',
    'es-es': 'Specify Schema',
  },
  // Data View
  emptyRecordSetHeader: {
    'en-us': (recordSetName: string) => `
      The Record Set "${recordSetName}" contains no records.`,
    'ru-ru': (recordSetName: string) => `
      Набор объектов "${recordSetName}" является пустым.`,
    ca: (recordSetName: string) => `
      The Record Set "${recordSetName}" contains no records.`,
    'es-es': (recordSetName: string) => `
      The Record Set "${recordSetName}" contains no records.`,
  },
  emptyRecordSetMessage: {
    'en-us': `You can delete the record set or add records to it.
      Be aware that another user maybe getting ready to add records,
      so only delete this record set if you are sure it is not to be used.`,
    'ru-ru': `Вы можете удалить набор записей или добавить к нему.
      Имейте в виду, что другой пользователь, возможно, готовится
      добавить объекты, поэтому удаляйте этот набор записей только в том случае,
      если вы уверены, что он не будет использованным.`,
    ca: `You can delete the record set or add records to it.
      Be aware that another user maybe getting ready to add records,
      so only delete this record set if you are sure it is not to be used.`,
    'es-es': `You can delete the record set or add records to it.
      Be aware that another user maybe getting ready to add records,
      so only delete this record set if you are sure it is not to be used.`,
  },
  checkingIfResourceCanBeDeleted: {
    'en-us': 'Checking if resource can be deleted...',
    'ru-ru': 'Проверка возможности удаления ресурса...',
    ca: 'Checking if resource can be deleted...',
    'es-es': 'Checking if resource can be deleted...',
  },
  deleteBlockedDialogTitle: {
    'en-us': 'Delete resource',
    'ru-ru': 'Удалить ресурс',
    ca: 'Delete resource',
    'es-es': 'Delete resource',
  },
  deleteBlockedDialogHeader: {
    'en-us': 'Delete blocked',
    'ru-ru': 'Удаление заблокировано',
    ca: 'Delete blocked',
    'es-es': 'Delete blocked',
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
    'es-es': `
      The resource cannot be deleted because it is referenced through the
      following fields:`,
  },
  contract: {
    'en-us': 'Contract',
    'ru-ru': 'Договор',
    ca: 'Contract',
    'es-es': 'Contract',
  },
  // Forms Dialog
  formsDialogTitle: {
    'en-us': 'Forms',
    'ru-ru': 'Формы',
    ca: 'Forms',
    'es-es': 'Forms',
  },
  // Interactions
  addItems: {
    'en-us': 'Add Items',
    'ru-ru': 'Добавить элементы',
    ca: 'Add Items',
    'es-es': 'Add Items',
  },
  recordReturn: {
    'en-us': (modelName: string) => `${modelName} Return`,
    'ru-ru': (modelName: string) => `Возврат ${modelName}`,
    ca: (modelName: string) => `${modelName} Return`,
    'es-es': (modelName: string) => `${modelName} Return`,
  },
  createRecord: {
    'en-us': (modelName: string) => `Create ${modelName}`,
    'ru-ru': (modelName: string) => `Создать ${modelName}`,
    ca: (modelName: string) => `Create ${modelName}`,
    'es-es': (modelName: string) => `Create ${modelName}`,
  },
  missing: {
    'en-us': 'Missing:',
    'ru-ru': 'Отсутствует:',
    ca: 'Missing:',
    'es-es': 'Missing:',
  },
  preparationsNotFound: {
    'en-us': 'No preparations were found.',
    'ru-ru': 'Никаких препаратов не обнаружено.',
    ca: 'No preparations were found.',
    'es-es': 'No preparations were found.',
  },
  problemsFound: {
    'en-us': 'There are problems with the entry:',
    'ru-ru': 'Обнаружены ошибки:',
    ca: 'There are problems with the entry:',
    'es-es': 'There are problems with the entry:',
  },
  recordSetCaption: {
    'en-us': (count: number) =>
      `By choosing a recordset (${count === 0 ? 'none' : count} available)`,
    'ru-ru': (count: number) => `Выбрав набор записей (доступно ${count})`,
    ca: (count: number) =>
      `By choosing a recordset (${count === 0 ? 'none' : count} available)`,
    'es-es': (count: number) =>
      `By choosing a recordset (${count === 0 ? 'none' : count} available)`,
  },
  entryCaption: {
    'en-us': (fieldName: string) => `By entering ${fieldName}s`,
    'ru-ru': (fieldName: string) => `Ввести ${fieldName}`,
    ca: (fieldName: string) => `By entering ${fieldName}s`,
    'es-es': (fieldName: string) => `By entering ${fieldName}s`,
  },
  noPreparationsCaption: {
    'en-us': 'Without preparations',
    'ru-ru': 'Без подготовки',
    ca: 'Without preparations',
    'es-es': 'Without preparations',
  },
  noCollectionObjectCaption: {
    'en-us': 'Add unassociated item',
    'ru-ru': 'Добавить несвязанный элемент',
    ca: 'Add unassociated item',
    'es-es': 'Add unassociated item',
  },
  // Loan Return
  preparationsDialogTitle: {
    'en-us': 'Preparations',
    'ru-ru': 'Препараты',
    ca: 'Preparations',
    'es-es': 'Preparations',
  },
  preparationsCanNotBeReturned: {
    'en-us': `
      Preparations cannot be returned in this context.`,
    'ru-ru': `
      Препараты не могут быть возвращены в этом контексте.`,
    ca: `
      Preparations cannot be returned in this context.`,
    'es-es': `
      Preparations cannot be returned in this context.`,
  },
  noUnresolvedPreparations: {
    'en-us': 'There no unresolved preparations for this loan.',
    'ru-ru': 'Незавершенных приготовлений по этому кредиту нет.',
    ca: 'There no unresolved preparations for this loan.',
    'es-es': 'There no unresolved preparations for this loan.',
  },
  remarks: {
    'en-us': 'Remarks',
    'ru-ru': 'Замечания',
    ca: 'Remarks',
    'es-es': 'Remarks',
  },
  unresolved: {
    'en-us': 'Unresolved',
    'ru-ru': 'Нерешенные',
    ca: 'Unresolved',
    'es-es': 'Unresolved',
  },
  return: {
    'en-us': 'Return',
    'ru-ru': 'Возвращение',
    ca: 'Return',
    'es-es': 'Return',
  },
  resolve: {
    'en-us': 'Resolve',
    'ru-ru': 'Разрешить',
    ca: 'Resolve',
    'es-es': 'Resolve',
  },
  returnAllPreparations: {
    'en-us': 'Return all preparations',
    'ru-ru': 'Вернуть все препараты',
    ca: 'Return all preparations',
    'es-es': 'Return all preparations',
  },
  returnSelectedPreparations: {
    'en-us': 'Return selected preparations',
    'ru-ru': 'Вернуть выбранные препараты',
    ca: 'Return selected preparations',
    'es-es': 'Return selected preparations',
  },
  selectAllAvailablePreparations: {
    'en-us': 'Select all available preparations',
    'ru-ru': 'Выбрать все доступные препараты',
    ca: 'Select all available preparations',
    'es-es': 'Select all available preparations',
  },
  selectAll: {
    'en-us': 'Select All',
    'ru-ru': 'Выбрать все',
    ca: 'Select All',
    'es-es': 'Select All',
  },
  selectedAmount: {
    'en-us': 'Selected Amount',
    'ru-ru': 'Выбранная сумма',
    ca: 'Selected Amount',
    'es-es': 'Selected Amount',
  },
  returnedAmount: {
    'en-us': 'Returned Amount',
    'ru-ru': 'Возвращенно',
    ca: 'Returned Amount',
    'es-es': 'Returned Amount',
  },
  resolvedAmount: {
    'en-us': 'Resolved Amount',
    'ru-ru': 'Решенный',
    ca: 'Resolved Amount',
    'es-es': 'Resolved Amount',
  },
  // PaleoLocationPlugin
  paleoMap: {
    'en-us': 'Paleo Map',
    'ru-ru': 'Карта Палео',
    ca: 'Paleo Map',
    'es-es': 'Paleo Map',
  },
  paleoRequiresGeographyDialogTitle: {
    'en-us': 'Paleo Map',
    'ru-ru': 'Карта Палео',
    ca: 'Paleo Map',
    'es-es': 'Paleo Map',
  },
  paleoRequiresGeographyDialogHeader: {
    'en-us': 'Geography Required',
    'ru-ru': 'Требуется география',
    ca: 'Geography Required',
    'es-es': 'Geography Required',
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
    'es-es': `
      The Paleo Map plugin requires that the locality have geographic
      coordinates and that the paleo context have a geographic age with at
      least a start time or and end time populated.`,
  },
  unsupportedFormDialogTitle: {
    'en-us': 'Unsupported Plugin',
    'ru-ru': 'Неподдерживаемый плагин',
    ca: 'Unsupported Plugin',
    'es-es': 'Unsupported Plugin',
  },
  unsupportedFormDialogHeader: {
    'en-us': 'Incorrect Form',
    'ru-ru': 'Неправильная форма',
    ca: 'Incorrect Form',
    'es-es': 'Incorrect Form',
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
    'es-es': `
      This plugin cannot be used on this form. Try moving it to the locality,
      collecting event or collection object forms.`,
  },
  // DateParser
  invalidDate: {
    'en-us': 'Invalid Date',
    'ru-ru': 'Недействительная дата',
    ca: 'Invalid Date',
    'es-es': 'Invalid Date',
  },
  // DeleteButton
  deleteConfirmationDialogTitle: {
    'en-us': 'Delete?',
    'ru-ru': 'Удалить?',
    ca: 'Delete?',
    'es-es': 'Delete?',
  },
  deleteConfirmationDialogHeader: {
    'en-us': 'Are you sure you want to permanently delete this item(s)?',
    'ru-ru': 'Вы уверены, что хотите навсегда удалить этот элемент(ы)?',
    ca: 'Are you sure you want to permanently delete this item(s)?',
    'es-es': 'Are you sure you want to permanently delete this item(s)?',
  },
  deleteConfirmationDialogMessage: {
    'en-us': 'This action cannot be undone.',
    'ru-ru': 'Это действие не может быть отменено.',
    ca: 'This action cannot be undone.',
    'es-es': 'This action cannot be undone.',
  },
  // PartialDateUi
  datePrecision: {
    'en-us': 'Date Precision',
    'ru-ru': 'Точность даты',
    ca: 'Date Precision',
    'es-es': 'Date Precision',
  },
  monthYear: {
    'en-us': 'Mon / Year',
    'ru-ru': 'Месяц / Год',
    ca: 'Mon / Year',
    'es-es': 'Mon / Year',
  },
  yearPlaceholder: {
    'en-us': 'YYYY',
    'ru-ru': 'ГГГГ',
    ca: 'YYYY',
    'es-es': 'YYYY',
  },
  today: {
    'en-us': 'Today',
    'ru-ru': 'Сегодня',
    ca: 'Today',
    'es-es': 'Today',
  },
  todayButtonDescription: {
    'en-us': 'Set to current date',
    'ru-ru': 'Установить на текущую дату',
    ca: 'Set to current date',
    'es-es': 'Set to current date',
  },
  // PickListBox
  addToPickListConfirmationDialogTitle: {
    'en-us': 'Pick List',
    'ru-ru': 'Список выбора',
    ca: 'Pick List',
    'es-es': 'Pick List',
  },
  addToPickListConfirmationDialogHeader: {
    'en-us': 'Add to pick list?',
    'ru-ru': 'Добавить в список выбора?',
    ca: 'Add to pick list?',
    'es-es': 'Add to pick list?',
  },
  addToPickListConfirmationDialogMessage: {
    'en-us': (value: string, pickListName: string) =>
      `Add value "${value}" to the pick list named ${pickListName}?`,
    'ru-ru': (value: string, pickListName: string) =>
      `Добавить значение "${value}" в список выбора ${pickListName}?`,
    ca: (value: string, pickListName: string) =>
      `Add value "${value}" to the pick list named ${pickListName}?`,
    'es-es': (value: string, pickListName: string) =>
      `Add value "${value}" to the pick list named ${pickListName}?`,
  },
  // ReadOnlyPickListComboBox
  noData: {
    'en-us': 'No Data.',
    'ru-ru': 'Нет данных.',
    ca: 'No Data.',
    'es-es': 'No Data.',
  },
  // RecordSelector
  removeRecordDialogHeader: {
    'en-us': 'Remove record?',
    'ru-ru': 'Удалить запись?',
    ca: 'Remove record?',
    'es-es': 'Remove record?',
  },
  removeRecordDialogMessage: {
    'en-us': 'Are you sure you want to remove this record?',
    'ru-ru': 'Вы уверены, что хотите удалить эту запись?',
    ca: 'Are you sure you want to remove this record?',
    'es-es': 'Are you sure you want to remove this record?',
  },
  // RecordSetsDialog
  recordSetsDialogTitle: {
    'en-us': (count: number) => `Record Sets (${count})`,
    'ru-ru': (count: number) => `Наборы объектов (${count})`,
    ca: (count: number) => `Record Sets (${count})`,
    'es-es': (count: number) => `Record Sets (${count})`,
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
    'es-es': (recordSetName: string) => `
      The record set "${recordSetName}" will be deleted. The referenced
      records will NOT be deleted.`,
  },
  // Reports
  reportsCanNotBePrintedDialogMessage: {
    'en-us': 'Reports/Labels cannot be printed in this context.',
    'ru-ru': 'Отчеты / этикетки не могут быть напечатаны в этом контексте.',
    ca: 'Reports/Labels cannot be printed in this context.',
    'es-es': 'Reports/Labels cannot be printed in this context.',
  },
  noReportsAvailable: {
    'en-us': 'No reports are available for this table.',
    'ru-ru': 'Для этой таблицы нет отчетов.',
    ca: 'No reports are available for this table.',
    'es-es': 'No reports are available for this table.',
  },
  reportProblemsDialogTitle: {
    'en-us': 'Problems with report',
    'ru-ru': 'Проблемы с отчетом',
    ca: 'Problems with report',
    'es-es': 'Problems with report',
  },
  reportsProblemsDialogMessage: {
    'en-us': 'The selected report has the following problems:',
    'ru-ru': 'В выбранном отчете есть следующие проблемы:',
    ca: 'The selected report has the following problems:',
    'es-es': 'The selected report has the following problems:',
  },
  badImageExpressions: {
    'en-us': 'Bad Image Expressions',
    'ru-ru': 'Плохое выражение изображений',
    ca: 'Bad Image Expressions',
    'es-es': 'Bad Image Expressions',
  },
  missingAttachments: {
    'en-us': 'Missing attachments',
    'ru-ru': 'Отсутствующие вложения',
    ca: 'Missing attachments',
    'es-es': 'Missing attachments',
  },
  // A verb
  fix: {
    'en-us': 'Fix',
    'ru-ru': 'Исправить',
    ca: 'Fix',
    'es-es': 'Fix',
  },
  missingAttachmentsFixDialogTitle: {
    'en-us': 'Choose file',
    'ru-ru': 'Выберите файл',
    ca: 'Choose file',
    'es-es': 'Choose file',
  },
  reportParameters: {
    'en-us': 'Report Parameters',
    'ru-ru': 'Параметры отчета',
    ca: 'Report Parameters',
    'es-es': 'Report Parameters',
  },
  labelFromRecordSetDialogTitle: {
    'en-us': 'From Record Set',
    'ru-ru': 'Из набора объектов',
    ca: 'From Record Set',
    'es-es': 'From Record Set',
  },
  runReport: {
    'en-us': 'Run Report',
    'ru-ru': 'Запустить репорт',
    ca: 'Run Report',
    'es-es': 'Run Report',
  },
  // ResourceView
  firstRecord: {
    'en-us': 'First Record',
    'ru-ru': 'Первый объект',
    ca: 'Primer disc',
    'es-es': 'First Record',
  },
  lastRecord: {
    'en-us': 'Last Record',
    'ru-ru': 'Последний объект',
    ca: 'Últim disc',
    'es-es': 'Last Record',
  },
  previousRecord: {
    'en-us': 'Previous Record',
    'ru-ru': 'Последняя запись',
    ca: 'Previous Record',
    'es-es': 'Previous Record',
  },
  nextRecord: {
    'en-us': 'Next Record',
    'ru-ru': 'Следующий объект',
    ca: 'Next Record',
    'es-es': 'Next Record',
  },
  currentRecord: {
    'en-us': (total: number): string => `Current object (out of ${total})`,
    'ru-ru': (total: number): string => `Текущий объект (из ${total})`,
    ca: (total: number): string => `L'objecte actual (de ${total})`,
    'es-es': (total: number): string => `Current object (out of ${total})`,
  },
  // SaveButton
  unsavedFormUnloadProtect: {
    'en-us': 'This form has not been saved.',
    'ru-ru': 'Эта форма не была сохранена.',
    ca: 'This form has not been saved.',
    'es-es': 'This form has not been saved.',
  },
  saveAndAddAnother: {
    'en-us': 'Save and Add Another',
    'ru-ru': 'Сохранить и добавить еще',
    ca: 'Save and Add Another',
    'es-es': 'Save and Add Another',
  },
  addAnother: {
    'en-us': 'Add Another',
    'ru-ru': 'добавить еще',
    ca: 'Add Another',
    'es-es': 'Add Another',
  },
  saveConflictDialogTitle: {
    'en-us': 'Save record',
    'ru-ru': 'Сохранить запись',
    ca: 'Save record',
    'es-es': 'Save record',
  },
  saveConflictDialogHeader: {
    'en-us': 'Save conflict',
    'ru-ru': 'Сохранить конфликт',
    ca: 'Save conflict',
    'es-es': 'Save conflict',
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
    'es-es': `
      The data shown on this page has been changed by another user or in
      another browser tab and is out of date. The page must be reloaded to
      prevent inconsistent data from being saved.`,
  },
  saveBlockedDialogTitle: {
    'en-us': 'Save record',
    'ru-ru': 'Сохранить запись',
    ca: 'Save record',
    'es-es': 'Save record',
  },
  saveBlockedDialogHeader: {
    'en-us': 'Save blocked',
    'ru-ru': 'Сохранение заблокировано',
    ca: 'Save blocked',
    'es-es': 'Save blocked',
  },
  saveBlockedDialogMessage: {
    'en-us': 'Form cannot be saved while the following errors exist:',
    'ru-ru': 'Форма не может быть сохранена, пока существуют следующие ошибки:',
    ca: 'Form cannot be saved while the following errors exist:',
    'es-es': 'Form cannot be saved while the following errors exist:',
  },
  // ShowTransCommand
  resolvedLoans: {
    'en-us': 'Resolved Loans',
    'ru-ru': 'Решение Заемы',
    ca: 'Resolved Loans',
    'es-es': 'Resolved Loans',
  },
  // Open is a noun
  openLoans: {
    'en-us': 'Open Loans',
    'ru-ru': 'Открытые займы',
    ca: 'Open Loans',
    'es-es': 'Open Loans',
  },
  gifts: {
    'en-us': 'Gifts',
    'ru-ru': 'Подарки',
    ca: 'Gifts',
    'es-es': 'Gifts',
  },
  exchanges: {
    'en-us': 'Exchanges',
    'ru-ru': 'Обмены',
    ca: 'Exchanges',
    'es-es': 'Exchanges',
  },
  // SpecifyCommands
  unavailableCommandButton: {
    'en-us': 'Command N/A',
    'ru-ru': 'Команда недоступна',
    ca: 'Command N/A',
    'es-es': 'Command N/A',
  },
  unavailableCommandDialogTitle: {
    'en-us': 'Command Not Available',
    'ru-ru': 'Команда недоступна',
    ca: 'Command Not Available',
    'es-es': 'Command Not Available',
  },
  unavailableCommandDialogHeader: {
    'en-us': 'Command Not Available',
    'ru-ru': 'Команда недоступна',
    ca: 'Command Not Available',
    'es-es': 'Command Not Available',
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
    'es-es': `
      This command is currently unavailable for <i>Specify&nbsp7</i>
      It was probably included on this form from <i>Specify&nbsp6</i> and
      may be supported in the future.`,
  },
  commandName: {
    'en-us': 'Command name:',
    'ru-ru': 'Имя команды:',
    ca: 'Command name:',
    'es-es': 'Command name:',
  },
  // SpecifyPlugins
  unavailablePluginButton: {
    'en-us': 'Plugin N/A',
    'ru-ru': 'Плагин недоступен',
    ca: 'Plugin N/A',
    'es-es': 'Plugin N/A',
  },
  unavailablePluginDialogTitle: {
    'en-us': 'Plugin Not Available',
    'ru-ru': 'Плагин недоступен',
    ca: 'Plugin Not Available',
    'es-es': 'Plugin Not Available',
  },
  unavailablePluginDialogHeader: {
    'en-us': 'Plugin Not Available',
    'ru-ru': 'Плагин недоступен',
    ca: 'Plugin Not Available',
    'es-es': 'Plugin Not Available',
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
    'es-es': `
      This plugin is currently unavailable for <i>Specify&nbsp7</i>
      It was probably included on this form from <i>Specify&nbsp6</i> and
      may be supported in the future.`,
  },
  wrongTablePluginDialogMessage: {
    'en-us': (currentTable: string, correctTable: string) => `
      The plugin cannot be used on the ${currentTable} form.
      It can only be used on the ${correctTable} form.`,
    'ru-ru': (currentTable: string, correctTable: string) => `
      Этот плагин нельзя использовать в форме ${currentTable}. Его можно
      использовать только в форме ${correctTable}.`,
    ca: (currentTable: string, correctTable: string) => `
      This plugin cannot be used on the ${currentTable} form.
      It can only be used on the ${correctTable} form.`,
    'es-es': (currentTable: string, correctTable: string) => `
      This plugin cannot be used on the ${currentTable} form.
      It can only be used on the ${correctTable} form.`,
  },
  pluginName: {
    'en-us': 'Plugin name:',
    'ru-ru': 'Название плагина:',
    ca: 'Plugin name:',
    'es-es': 'Plugin name:',
  },
  // SubViewHeader
  visit: {
    'en-us': 'Visit',
    'ru-ru': 'Открыть',
    ca: 'Visit',
    'es-es': 'Visit',
  },
  // UiParse
  illegalBool: {
    'en-us': 'Illegal value for a Yes/No field',
    'ru-ru': 'Недопустимое значение для поля Да / Нет',
    ca: 'Illegal value for a Yes/No field',
    'es-es': 'Illegal value for a Yes/No field',
  },
  requiredField: {
    'en-us': 'Field is required.',
    'ru-ru': 'Поле обязательно для заполнения.',
    ca: 'Field is required.',
    'es-es': 'Field is required.',
  },
  requiredFormat: {
    'en-us': (format: string) => `Required Format: ${format}.`,
    'ru-ru': (format: string) => `Обязательный формат: ${format}.`,
    ca: (format: string) => `Required Format: ${format}.`,
    'es-es': (format: string) => `Required Format: ${format}.`,
  },
  inputTypeNumber: {
    'en-us': `Value must be a number`,
    'ru-ru': `Значение должно быть числом`,
    ca: `Value must be a number`,
    'es-es': `Value must be a number`,
  },
  // UserAgentsPlugin
  userAgentsPluginDialogTitle: {
    'en-us': 'Set User Agents',
    'ru-ru': 'Настроить пользовательских агентов',
    ca: 'Set User Agents',
    'es-es': 'Set User Agents',
  },
  // AgentTypeComboBox
  organization: {
    'en-us': 'Organization',
    'ru-ru': 'Организация',
    ca: 'Organization',
    'es-es': 'Organization',
  },
  person: {
    'en-us': 'Person',
    'ru-ru': 'Особа',
    ca: 'Person',
    'es-es': 'Person',
  },
  other: {
    'en-us': 'Other',
    'ru-ru': 'Иной',
    ca: 'Other',
    'es-es': 'Other',
  },
  group: {
    'en-us': 'Group',
    'ru-ru': 'Группа',
    ca: 'Group',
    'es-es': 'Group',
  },
  // PickListTypeComboBox
  userDefinedItems: {
    'en-us': 'User Defined Items',
    'ru-ru': 'Пользовательские элементы',
    ca: 'User Defined Items',
    'es-es': 'User Defined Items',
  },
  entireTable: {
    'en-us': 'Entire Table',
    'ru-ru': 'Вся таблица',
    ca: 'Entire Table',
    'es-es': 'Entire Table',
  },
  fieldFromTable: {
    'en-us': 'Field From Table',
    'ru-ru': 'Поле из таблицы',
    ca: 'Field From Table',
    'es-es': 'Field From Table',
  },
  // Audit log actions
  insert: {
    'en-us': 'Insert',
    'ru-ru': 'Создано',
    ca: 'Insert',
    'es-es': 'Insert',
  },
  treeMerge: {
    'en-us': 'Tree Merge',
    'ru-ru': 'Слияние узлов дерева',
    ca: 'Tree Merge',
    'es-es': 'Tree Merge',
  },
  treeMove: {
    'en-us': 'Tree Move',
    'ru-ru': 'Перемещение узла дерева',
    ca: 'Tree Move',
    'es-es': 'Tree Move',
  },
  treeSynonymize: {
    'en-us': 'Tree Synonymize',
    'ru-ru': 'Синонимизированный узел дерева',
    ca: 'Tree Synonymize',
    'es-es': 'Tree Synonymize',
  },
  treeUnsynonymize: {
    'en-us': 'Tree Unsynonymize',
    'ru-ru': 'Отменено синонимизацию узла дерева',
    ca: 'Tree Unsynonymize',
    'es-es': 'Tree Unsynonymize',
  },
  unsupportedCellType: {
    'en-us': 'Unsupported cell type:',
    'ru-ru': 'Неподдерживаемый тип ячейки:',
    ca: 'Unsupported cell type:',
    'es-es': 'Unsupported cell type:',
  },
  unCataloged: {
    'en-us': 'uncataloged',
    'ru-ru': 'некаталогизированный',
    ca: 'uncataloged',
    'es-es': 'uncataloged',
  },
  additionalResultsOmitted: {
    'en-us': 'Additional results omitted',
    'ru-ru': 'Дополнительные результаты опущены',
    ca: 'Additional results omitted',
    'es-es': 'Additional results omitted',
  },
  reportOnSave: {
    'en-us': 'Generate Label on Save',
    'ru-ru': 'Генерировать отчет при сохранении',
    ca: 'Generate Label on Save',
    'es-es': 'Generate Label on Save',
  },
  recordSelectorUnloadProtectDialogHeader: {
    'en-us': 'Proceed without saving?',
    'ru-ru': 'Продолжить без сохранения?',
    ca: 'Proceed without saving?',
    'es-es': 'Proceed without saving?',
  },
  recordSelectorUnloadProtectDialogMessage: {
    'en-us': 'You might want to save this record before navigating away.',
    'ru-ru': 'Не забудьте сохранить эту запись, прежде чем закрыть ее.',
    ca: 'You might want to save this record before navigating away.',
    'es-es': 'You might want to save this record before navigating away.',
  },
  creatingNewRecord: {
    'en-us': 'Creating new record',
    'ru-ru': 'Создание новой записи',
    ca: 'Creating new record',
    'es-es': 'Creating new record',
  },
  // FIXME: localize
  forward: {
    'en-us': 'Forward',
    'ru-ru': 'Forward',
    ca: 'Forward',
    'es-es': 'Forward',
  },
  reverse: {
    'en-us': 'Reverse',
    'ru-ru': 'Reverse',
    ca: 'Reverse',
    'es-es': 'Reverse',
  },
  tooLongErrorMessage: {
    'en-us': (maxLength: number) =>
      `Field value is too long. Max allowd length is ${maxLength}`,
    'ru-ru': (maxLength: number) =>
      `Field value is too long. Max allowd length is ${maxLength}`,
    ca: (maxLength: number) =>
      `Field value is too long. Max allowd length is ${maxLength}`,
    'es-es': (maxLength: number) =>
      `Field value is too long. Max allowd length is ${maxLength}`,
  },
});
