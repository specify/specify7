import type { RA } from '../components/wbplanview';
import { createDictionary, createHeader } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

const formsText = createDictionary({
  // Attachments
  filterAttachments: {
    'en-us': 'Filter Attachments',
    'ru-ru': 'Фильтрировать вложений',
  },
  attachmentServerUnavailable: {
    'en-us': 'Attachment server unavailable.',
    'ru-ru': 'Сервер прикрепленных файлов недоступен.',
  },
  attachmentUploadDialogTitle: {
    'en-us': 'Uploading...',
    'ru-ru': 'Закачивание...',
  },
  tables: {
    'en-us': 'Tables',
    'ru-ru': 'Таблицы',
  },
  openDataDialogTitle: {
    'en-us': 'Opening...',
    'ru-ru': 'Открытие...',
  },
  clone: {
    'en-us': 'Clone',
    'ru-ru': 'Клонировать',
  },
  linkInline: {
    'en-us': 'link',
    'ru-ru': 'ссылка',
  },
  // BusinessRules
  valueMustBeUniqueToField: {
    'en-us': (fieldName: string) => `Value must be unique to ${fieldName}`,
    'ru-ru': (fieldName: string) =>
      `Значение ${fieldName} должно быть уникальным`,
  },
  valuesOfMustBeUniqueToField: {
    'en-us': (fieldName: string, values: RA<string>, lastValue) =>
      `Значения ${values.join(', ')} и ${lastValue}
       must be unique to ${fieldName}}`,
    'ru-ru': (fieldName: string, values: RA<string>, lastValue) =>
      `Values of ${values.join(', ')} and ${lastValue}
       в ${fieldName}} должны быть уникальным`,
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
  collection: {
    'en-us': 'Collection',
    'ru-ru': 'Коллекция',
  },
  // "set" as in "Set Value"
  set: {
    'en-us': 'Set',
    'ru-ru': 'Установить',
  },
  // Data Model
  specifySchema: {
    'en-us': 'Specify Schema',
    'ru-ru': 'Схема базы данных Specify',
  },
  // Data View
  emptyRecordSetMessage: {
    'en-us': (recordSetName: string) => `
      <h2>The Record Set "${recordSetName}" contains no records.</h2>
      <p>You can <button class="recordset-delete magic-button"
      type="button">delete</button> the record set or
      <a class="recordset-add intercept-navigation magic-button">add</a> records
      to it.</p>
      <p>Be aware that another user maybe getting ready to add records,
      so only delete this record set if you are sure it is not to be used.</p>`,
    'ru-ru': (recordSetName: string) => `
      <h2>Набор объектов "${recordSetName}" является пустым.</h2>
      <p>Вы можете <button class="recordset-delete magic-button"
      type="button">удалить</button> набор записей или
      <a class="recordset-add intercept-navigation magic-button">добавить</a>
      к нему.</p>
      <p>Имейте в виду, что другой пользователь, возможно, готовится добавить
      объекты, поэтому удаляйте этот набор записей только в том случае, если вы
      уверены, что он не будет использованным.</p>`,
  },
  checkingIfResourceCanBeDeleted: {
    'en-us': 'Checking if resource can be deleted.',
    'ru-ru': 'Проверка возможности удаления ресурса.',
  },
  deleteBlockedDialogTitle: {
    'en-us': 'Delete resource',
    'ru-ru': 'Удалить ресурс',
  },
  deleteBlockedDialogHeader: {
    'en-us': createHeader('Delete blocked'),
    'ru-ru': createHeader('Удаление заблокировано'),
  },
  deleteBlockedDialogMessage: {
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
  // Forms Dialog
  formsDialogTitle: {
    'en-us': 'Forms',
    'ru-ru': 'Формы',
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
  invalid: {
    'en-us': 'Invalid:',
    'ru-ru': 'Неверный:',
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
  ignoreAndContinue: {
    'en-us': 'Ignore and continue',
    'ru-ru': 'Игнорировать и продолжить',
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
  actionNotSupported: {
    'en-us': (actionName: string) => `${actionName} is not supported.`,
    'ru-ru': (actionName: string) => `${actionName} не поддерживается.`,
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
  receivedBy: {
    'en-us': 'Received by',
    'ru-ru': 'Получено',
  },
  dateResolved: {
    'en-us': 'Date resolved',
    'ru-ru': 'Дата разрешения',
  },
  // PaleoLocationPlugin
  paleoMap: {
    'en-us': 'Paleo Map',
    'ru-ru': 'Карта Палео',
  },
  paleoRequiresGeographyDialogTitle: {
    'en-us': 'Paleo Map',
    'ru-ru': 'Карта Палео',
  },
  paleoRequiresGeographyDialogHeader: {
    'en-us': createHeader('Geography Required'),
    'ru-ru': createHeader('Требуется география'),
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
  },
  noCoordinatesDialogTitle: {
    'en-us': 'No coordinates',
    'ru-ru': 'Нет координат',
  },
  noCoordinatesDialogHeader: {
    'en-us': (modelName: string) =>
      createHeader(`Not enough information to map ${modelName}`),
    'ru-ru': (modelName: string) =>
      createHeader(`Недостаточно информации для отображения ${modelName}`),
  },
  noCoordinatesDialogMessage: {
    'en-us': (modelName: string) => `
    ${modelName} must have coordinates and paleo context to be mapped.`,
    'ru-ru': (modelName: string) => `
    Для отображения ${modelName}, он должен иметь координаты и палеоконтекст.`,
  },
  unsupportedFormDialogTitle: {
    'en-us': 'Unsupported Plugin',
    'ru-ru': 'Неподдерживаемый плагин',
  },
  unsupportedFormDialogHeader: {
    'en-us': createHeader('Incorrect Form'),
    'ru-ru': createHeader('Неправильная форма'),
  },
  unsupportedFormDialogMessage: {
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
  deleteConfirmationDialogTitle: {
    'en-us': 'Delete?',
    'ru-ru': 'Удалить?',
  },
  deleteConfirmationDialogHeader: {
    'en-us': createHeader(
      'Are you sure you want to permanently delete this item(s)?'
    ),
    'ru-ru': createHeader(
      'Вы уверены, что хотите навсегда удалить этот элемент(ы)?'
    ),
  },
  deleteConfirmationDialogMessage: {
    'en-us': 'This action can not be undone.',
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
  dayPlaceholder: {
    'en-us': 'DD',
    'ru-ru': 'ДД',
  },
  monthPlaceholder: {
    'en-us': 'MM',
    'ru-ru': 'ММ',
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
  addToPickListConfirmationDialogTitle: {
    'en-us': 'Pick List',
    'ru-ru': 'Список выбора',
  },
  addToPickListConfirmationDialogHeader: {
    'en-us': createHeader('Add to pick list?'),
    'ru-ru': createHeader('Добавить в список выбора?'),
  },
  addToPickListConfirmationDialogMessage: {
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
  // RecordSelector
  removeRecordDialogHeader: {
    'en-us': createHeader('Remove dependent record'),
    'ru-ru': createHeader('Удалить зависимую запись'),
  },
  removeRecordDialogMessage: {
    'en-us': 'Are you sure you want to remove this record?',
    'ru-ru': 'Вы уверены, что хотите удалить эту запись?',
  },
  // RecordSetsDialog
  recordSetsDialogTitle: {
    'en-us': (count: number) => `Record Sets (${count})`,
    'ru-ru': (count: number) => `Наборы объектов (${count})`,
  },
  createRecordSetButtonDescription: {
    'en-us': 'Create a new record set',
    'ru-ru': 'Создать новый набор объектов',
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
  reportsCanNotBePrintedDialogMessage: {
    'en-us': 'Reports/Labels cannot be printed in this context.',
    'ru-ru': 'Отчеты / этикетки не могут быть напечатаны в этом контексте.',
  },
  noReportsAvailable: {
    'en-us': 'No reports are available for this table.',
    'ru-ru': 'Для этой таблицы нет отчетов.',
  },
  reportProblemsDialogTitle: {
    'en-us': 'Problems with report',
    'ru-ru': 'Проблемы с отчетом',
  },
  reportsProblemsDialogMessage: {
    'en-us': 'The selected report has the following problems:',
    'ru-ru': 'В выбранном отчете есть следующие проблемы:',
  },
  badImageExpressions: {
    'en-us': 'Bad Image Expressions',
    'ru-ru': 'Плохое выражение изображений',
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
  labelFromRecordSetDialogTitle: {
    'en-us': 'From Record Set',
    'ru-ru': 'Из набора объектов',
  },
  runReport: {
    'en-us': 'Run Report',
    'ru-ru': 'Запустить репорт',
  },
  // ResourceView
  missingFormDefinitionPageHeader: {
    'en-us': 'Missing form definition',
    'ru-ru': 'Отсутствует определение формы',
  },
  missingFormDefinitionPageContent: {
    'en-us': `
      Specify was unable to find the form definition to display this resource`,
    'ru-ru': `
      Specify не удалось найти определение формы для отображения этого ресурса`,
  },
  addingToRecordSet: {
    'en-us': 'Adding to Record Set and Database',
    'ru-ru': 'Добавление в набор записей и базу данных',
  },
  createRecordButtonDescription: {
    'en-us': 'Create record and add to Record Set',
    'ru-ru': 'Создать запись и добавить в Набор объектов',
  },
  recordSetAreaDescription: {
    'en-us': (recordSetName: string): string => `Record Set: ${recordSetName}`,
    'ru-ru': (recordSetName: string): string =>
      `Набор объектов: ${recordSetName}`,
  },
  previousRecord: {
    'en-us': 'Previous Record',
    'ru-ru': 'Предыдущий объект',
  },
  nextRecord: {
    'en-us': 'Next Record',
    'ru-ru': 'Следующий объект',
  },
  currentPositionInTheRecordSet: {
    'en-us': 'Current Position in the Record Set',
    'ru-ru': 'Текущая позиция в наборе объектов',
  },
  // Current index in the record set
  aOutOfB: {
    'en-us': (current: number, total: number): string =>
      `${current} out of ${total}`,
    'ru-ru': (current: number, total: number): string =>
      `${current} из ${total}`,
  },
  // SaveButton
  unsavedFormUnloadProtect: {
    'en-us': 'This form has not been saved.',
    'ru-ru': 'Эта форма не была сохранена.',
  },
  saveAndAddAnother: {
    'en-us': 'Save and Add Another',
    'ru-ru': 'Сохранить и добавить еще',
  },
  saveConflictDialogTitle: {
    'en-us': 'Save record',
    'ru-ru': 'Сохранить запись',
  },
  saveConflictDialogHeader: {
    'en-us': createHeader('Save conflict'),
    'ru-ru': createHeader('Сохранить конфликт'),
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
  },
  saveBlockedDialogTitle: {
    'en-us': 'Save record',
    'ru-ru': 'Сохранить запись',
  },
  saveBlockedDialogHeader: {
    'en-us': createHeader('Save blocked'),
    'ru-ru': createHeader('Сохранение заблокировано'),
  },
  saveBlockedDialogMessage: {
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
  unavailableCommandDialogTitle: {
    'en-us': 'Command Not Available',
    'ru-ru': 'Команда недоступна',
  },
  unavailableCommandDialogHeader: {
    'en-us': createHeader('Command Not Available'),
    'ru-ru': createHeader('Команда недоступна'),
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
  unavailablePluginDialogTitle: {
    'en-us': 'Plugin Not Available',
    'ru-ru': 'Плагин недоступен',
  },
  unavailablePluginDialogHeader: {
    'en-us': createHeader('Plugin Not Available'),
    'ru-ru': createHeader('Плагин недоступен'),
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
  },
  pluginName: {
    'en-us': 'Plugin name:',
    'ru-ru': 'Название плагина:',
  },
  // SubViewHeader
  link: {
    'en-us': 'Link',
    'ru-ru': 'Ссылка',
  },
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
  noParser: {
    'en-us': (type: string) => `No parser for type ${type}`,
    'ru-ru': (type: string) => `Нет парсера для типа ${type}`,
  },
  inputTypeNumber: {
    'en-us': `Value must be a number`,
    'ru-ru': `Значение должно быть числом`,
  },
  minimumLength: {
    'en-us': (number: number) =>
      `Minimum length for this field is ${number} characters`,
    'ru-ru': (number: number) =>
      `Минимальная длина этого поля ${number} символов`,
  },
  maximumLength: {
    'en-us': (number: number) =>
      `Value can not be longer than ${number} characters`,
    'ru-ru': (number: number) =>
      `Значение не может быть длиннее чем ${number} символов`,
  },
  minimumNumber: {
    'en-us': (number: number) => `Number must be smaller than ${number}`,
    'ru-ru': (number: number) => `Число должно быть меньше ${number}`,
  },
  maximumNumber: {
    'en-us': (number: number) => `Value must be greater than ${number}`,
    'ru-ru': (number: number) => `Число должно быть больше ${number}`,
  },
  wrongStep: {
    'en-us': (step: number) => `Value must be a multiple of ${step}`,
    'ru-ru': (step: number) => `Число должно быть кратным ${step}`,
  },
  // UserAgentsPlugin
  setAgents: {
    'en-us': 'Set Agents',
    'ru-ru': 'Подключить к агенту',
  },
  setAgentsDisabledButtonDescription: {
    'en-us': 'Save user before adding agents.',
    'ru-ru': 'Сохраните пользователя перед добавлением агентов.',
  },
  userAgentsPluginDialogTitle: {
    'en-us': 'Set User Agents',
    'ru-ru': 'Настроить пользовательских агентов',
  },
});

export default formsText;
