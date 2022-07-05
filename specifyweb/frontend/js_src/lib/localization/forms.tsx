/**
 * Localization strings used on Data Entry forms and Interactions
 * (don't confuse this with schema localization strings)
 *
 * @module
 */

import React from 'react';

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

export const formsText = createDictionary({
  // Attachments
  order: {
    'en-us': 'Order By',
    'ru-ru': 'Сортировать по',
  },
  attachmentServerUnavailable: {
    'en-us': 'Attachment server unavailable.',
    'ru-ru': 'Сервер прикрепленных файлов недоступен.',
  },
  attachmentUploadDialogTitle: {
    'en-us': 'Uploading...',
    'ru-ru': 'Закачивание...',
  },
  noAttachments: {
    'en-us': 'There are no attachments',
    'ru-ru': 'В вашей коллекции нет вложений',
  },
  clone: {
    'en-us': 'Clone',
    'ru-ru': 'Клонировать',
  },
  addAnother: {
    'en-us': 'Add another',
    'ru-ru': 'Добавить еще',
  },
  // BusinessRules
  valueMustBeUniqueToField: {
    'en-us': (fieldName: string) => `Value must be unique to ${fieldName}`,
    'ru-ru': (fieldName: string) =>
      `Значение ${fieldName} должно быть уникальным`,
  },
  valuesOfMustBeUniqueToField: {
    'en-us': (fieldName: string, values: string) =>
      `Values of ${values} must be unique to ${fieldName}}`,
    'ru-ru': (fieldName: string, values: string) =>
      `Значения ${values} в ${fieldName} должны быть уникальным`,
  },
  database: {
    'en-us': 'database',
    'ru-ru': 'база данных',
  },
  // CollectionReLoneToManyPlugin
  collectionObject: {
    'en-us': 'Collection Object',
    'ru-ru': 'Объект коллекции',
  },
  // Data View
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
      The resource cannot be deleted because it is referenced through the
      following fields:`,
    'ru-ru': `
      Ресурс не может быть удален, потому что на него есть ссылка через
      следующие поля:`,
  },
  contract: {
    'en-us': 'Contract',
    'ru-ru': 'Договор',
  },
  // Interactions
  addItems: {
    'en-us': 'Add Items',
    'ru-ru': 'Добавить элементы',
  },
  recordReturn: {
    'en-us': (modelName: string) => `${modelName} Return`,
    'ru-ru': (modelName: string) => `Возврат ${modelName}`,
  },
  createRecord: {
    'en-us': (modelName: string) => `Create ${modelName}`,
    'ru-ru': (modelName: string) => `Создать ${modelName}`,
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
    'en-us': (count: number) =>
      `By choosing a recordset (${count === 0 ? 'none' : count} available)`,
    'ru-ru': (count: number) => `Выбрав набор записей (доступно ${count})`,
  },
  entryCaption: {
    'en-us': (fieldName: string) => `By entering ${fieldName}s`,
    'ru-ru': (fieldName: string) => `Ввести ${fieldName}`,
  },
  noPreparationsCaption: {
    'en-us': 'Without preparations',
    'ru-ru': 'Без подготовки',
  },
  noCollectionObjectCaption: {
    'en-us': 'Add unassociated item',
    'ru-ru': 'Добавить несвязанный элемент',
  },
  // Loan Return
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
    'en-us': 'There no unresolved preparations for this loan.',
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
  // PaleoLocationPlugin
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
      collecting event or collection object forms.`,
    'ru-ru': `
      Этот плагин нельзя использовать в этой форме. Попробуй переместить его на
      форму местности, события сбора или объекта коллекции.`,
  },
  // DateParser
  invalidDate: {
    'en-us': 'Invalid Date',
    'ru-ru': 'Недействительная дата',
  },
  // DeleteButton
  deleteConfirmationDialogHeader: {
    'en-us':
      'Are you sure you want to permanently delete this item(s) from the database?',
    'ru-ru':
      'Вы уверены, что хотите навсегда удалить этот элемент(ы) из базы данных?',
  },
  deleteConfirmationDialogText: {
    'en-us': 'This action cannot be undone.',
    'ru-ru': 'Это действие не может быть отменено.',
  },
  // PartialDateUi
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
  // PickListBox
  addToPickListConfirmationDialogHeader: {
    'en-us': 'Add to pick list?',
    'ru-ru': 'Добавить в список выбора?',
  },
  addToPickListConfirmationDialogText: {
    'en-us': (value: string, pickListName: string) =>
      `Add value "${value}" to the pick list named ${pickListName}?`,
    'ru-ru': (value: string, pickListName: string) =>
      `Добавить значение "${value}" в список выбора ${pickListName}?`,
  },
  // ReadOnlyPickListComboBox
  noData: {
    'en-us': 'No Data.',
    'ru-ru': 'Нет данных.',
  },
  // RecordSetsDialog
  recordSetsDialogTitle: {
    'en-us': (count: number) => `Record Sets (${count})`,
    'ru-ru': (count: number) => `Наборы объектов (${count})`,
  },
  recordSetDeletionWarning: {
    'en-us': (recordSetName: string) => `
      The record set "${recordSetName}" will be deleted. The referenced
      records will NOT be deleted.`,
    'ru-ru': (recordSetName: string) => `
      Набор объектов "${recordSetName}" будет удален. Связанные записи не будут
      удалены.`,
  },
  // Reports
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
  // A verb
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
  // ResourceView
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
    'en-us': (total: number): string => `Current object (out of ${total})`,
    'ru-ru': (total: number): string => `Текущий объект (из ${total})`,
  },
  // SaveButton
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
      prevent inconsistent data from being saved.`,
    'ru-ru': `
      Данные, отображаемые на этой странице, были изменены другим пользователем,
      или другоц вкладке браузера. Страницу необходимо перезагрузить
      чтобы предотвратить сохранение несогласованных данных.`,
  },
  saveBlockedDialogHeader: {
    'en-us': 'Save blocked',
    'ru-ru': 'Сохранение заблокировано',
  },
  saveBlockedDialogText: {
    'en-us': 'Form cannot be saved while the following errors exist:',
    'ru-ru': 'Форма не может быть сохранена, пока существуют следующие ошибки:',
  },
  // ShowTransCommand
  resolvedLoans: {
    'en-us': 'Resolved Loans',
    'ru-ru': 'Решение Заемы',
  },
  // Open is a noun
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
  // SpecifyCommands
  unavailableCommandButton: {
    'en-us': 'Command N/A',
    'ru-ru': 'Команда недоступна',
  },
  unavailableCommandDialogHeader: {
    'en-us': 'Command Not Available',
    'ru-ru': 'Команда недоступна',
  },
  unavailableCommandDialogText: {
    'en-us': (
      <>
        This command is currently unavailable for <i>Specify 7</i>
        It was probably included on this form from <i>Specify 6</i> and may be
        supported in the future.
      </>
    ),
    'ru-ru': (
      <>
        Эта команда в настоящее время недоступна для <i>Specify 7</i>
        Вероятно, он был включен на етой форме в <i>Specify 6</i> м может бить
        поддерживаним в будущем.
      </>
    ),
  },
  commandName: {
    'en-us': 'Command name:',
    'ru-ru': 'Имя команды:',
  },
  // SpecifyPlugins
  unavailablePluginButton: {
    'en-us': 'Plugin N/A',
    'ru-ru': 'Плагин недоступен',
  },
  unavailablePluginDialogHeader: {
    'en-us': 'Plugin Not Available',
    'ru-ru': 'Плагин недоступен',
  },
  unavailablePluginDialogText: {
    'en-us': (
      <>
        This plugin is currently unavailable for <i>Specify 7</i>
        It was probably included on this form from <i>Specify 6</i> and may be
        supported in the future.
      </>
    ),
    'ru-ru': (
      <>
        Этот плагин в настоящее время недоступна для <i>Specify 7</i>
        Вероятно, он был включен на етой форме в <i>Specify 6</i> м может бить
        поддерживаним в будущем.
      </>
    ),
  },
  wrongTablePluginDialogText: {
    'en-us': (currentTable: string, correctTable: string) => `
      The plugin cannot be used on the ${currentTable} form.
      It can only be used on the ${correctTable} form.`,
    'ru-ru': (currentTable: string, correctTable: string) => `
      Этот плагин нельзя использовать в форме ${currentTable}. Его можно
      использовать только в форме ${correctTable}.`,
  },
  pluginName: {
    'en-us': 'Plugin name:',
    'ru-ru': 'Название плагина:',
  },
  // SubViewHeader
  visit: {
    'en-us': 'Visit',
    'ru-ru': 'Открыть',
  },
  // UiParse
  illegalBool: {
    'en-us': 'Illegal value for a Yes/No field',
    'ru-ru': 'Недопустимое значение для поля Да / Нет',
  },
  requiredField: {
    'en-us': 'Field is required.',
    'ru-ru': 'Поле обязательно для заполнения.',
  },
  requiredFormat: {
    'en-us': (format: string) => `Required Format: ${format}.`,
    'ru-ru': (format: string) => `Обязательный формат: ${format}.`,
  },
  inputTypeNumber: {
    'en-us': `Value must be a number`,
    'ru-ru': `Значение должно быть числом`,
  },
  // UserAgentsPlugin
  userAgentsPluginDialogTitle: {
    'en-us': 'Set User Agents',
    'ru-ru': 'Настроить пользовательских агентов',
  },
  // AgentTypeComboBox
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
  // PickListTypeComboBox
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
  // Audit log actions
  insert: {
    'en-us': 'Insert',
    'ru-ru': 'Создано',
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
  treeUnsynonymize: {
    'en-us': 'Tree Unsynonymize',
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
  reportOnSave: {
    'en-us': 'Generate Label on Save',
    'ru-ru': 'Генерировать отчет при сохранении',
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
    'en-us': (maxLength: number) =>
      `Field value is too long. Max allowed length is ${maxLength}`,
    'ru-ru': (maxLength: number) =>
      `Значение поля слишком длинное. Максимально допустимая длина ${maxLength}`,
  },
  returnedPreparations: {
    'en-us': 'Returned Preparations',
    'ru-ru': 'Возвращенные препараты',
  },
  returnedAndSaved: {
    'en-us': (number: string) =>
      `${number} preparations have been returned and saved.`,
    'ru-ru': (number: string) => `${number} препарата возвращены и сохранены.`,
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
  carryForward: {
    'en-us': 'Carry Forward',
    'ru-ru': 'Настройки клонирования',
  },
  carryForwardDescription: {
    'en-us': 'Fields to carry forward on clone',
    'ru-ru': 'Поля для переноса при клонировании',
  },
  carryForwardUniqueField: {
    'en-us': 'This field must be unique. It can not be carried over',
    'ru-ru': 'Это поле должно быть уникальным. Оно не может быть перенесено',
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
    'en-us': (formattedRecord: string) =>
      `History of edits for "${formattedRecord}"`,
    'ru-ru': (formattedRecord: string) =>
      `История изменений для "${formattedRecord}"`,
  },
  formConfiguration: {
    'en-us': 'Form Configuration',
    'ru-ru': 'Конфигурация формы',
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
    'en-us': 'Find usagges',
    'ru-ru': 'Найти использование',
  },
  usagesOfPickList: {
    'en-us': (pickList: string) => `Usages of "${pickList}" pick list`,
    'ru-ru': (pickList: string) => `Использование "${pickList}" списка выбора`,
  },
  printOnSave: {
    'en-us': 'Print label on save',
    'ru-ru': 'Печатать метку при сохранении',
  },
  form: {
    'en-us': 'Subform',
    'ru-ru': 'Форма',
  },
  formTable: {
    'en-us': 'Grid',
    'ru-ru': 'Таблица',
  },
  recordSelectorConfiguration: {
    'en-us': 'Subview configuration',
    'ru-ru': 'Конфигурация подчиненной формы',
  },
});
