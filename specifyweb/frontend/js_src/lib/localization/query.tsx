import type { RA } from '../components/wbplanview';
import { createDictionary, createHeader } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

const queryText = createDictionary({
  queryBoxDescription: {
    'en-us': (fieldNames: RA<string>) => `Searches: ${fieldNames.join(', ')}`,
    'ru-ru': (fieldNames: RA<string>) =>
      `Поисковые запросы: ${fieldNames.join(', ')}`,
  },
  selectFields: {
    'en-us': 'Select Field...',
    'ru-ru': 'Выбрать поле...',
  },
  treeRankAuthor: {
    'en-us': (rankName: string) => `${rankName} Author`,
    'ru-ru': (rankName: string) => `${rankName} Автор`,
  },
  selectOp: {
    'en-us': 'Select Op...',
    'ru-ru': 'Выберите оп...',
  },
  any: {
    'en-us': 'any',
    'ru-ru': 'любой',
  },
  startValue: {
    'en-us': 'Start Value',
    'ru-ru': 'Начальное значение',
  },
  endValue: {
    'en-us': 'End Value',
    'ru-ru': 'Конечное значение',
  },
  addValuesHint: {
    'en-us': 'Add values one by one, or as comma-separated list:',
    'ru-ru':
      'Добавьте значения по одному или в виде списка, разделенного запятыми:',
  },
  saveQueryDialogTitle: {
    'en-us': 'Save query as...',
    'ru-ru': 'Сохранить запрос как...',
  },
  savingQueryDialogTitle: {
    'en-us': 'Save Query',
    'ru-ru': 'Сохранить запрос',
  },
  saveQueryDialogHeader: {
    'en-us': createHeader('Save Query'),
    'ru-ru': createHeader('Сохранить запрос'),
  },
  saveQueryDialogMessage: {
    'en-us': 'Enter a name for the new query.',
    'ru-ru': 'Введите имя для нового запроса.',
  },
  saveClonedQueryDialogHeader: {
    'en-us': createHeader('Clone Query'),
    'ru-ru': createHeader('Клонировать запрос'),
  },
  saveClonedQueryDialogMessage: {
    'en-us': `
      The query will be saved with a new name leaving the current query
      unchanged.`,
    'ru-ru': `
      Запрос будет сохранен под новым именем, оставив текущий запрос без
      изменений.`,
  },
  queryName: {
    'en-us': 'Query Name:',
    'ru-ru': 'Имя запроса:',
  },
  queryDeleteIncompleteDialogTitle: {
    'en-us': 'Incomplete fields',
    'ru-ru': 'Неполные поля',
  },
  queryDeleteIncompleteDialogHeader: {
    'en-us': createHeader('Query definition contains incomplete fields'),
    'ru-ru': createHeader('Определение запроса содержит неполные поля'),
  },
  queryDeleteIncompleteDialogMessage: {
    'en-us': `
      There are uncompleted fields in the query definition. Do you want to
      remove them?`,
    'ru-ru': `
      В запросе есть незавершенные поля. Хотите удалить их?`,
  },
  queryUnloadProtectDialogMessage: {
    'en-us': 'This query definition has not been saved.',
    'ru-ru': 'Этот запрос не был сохранен.',
  },
  recordSetToQueryDialogTitle: {
    'en-us': 'Record Set',
    'ru-ru': 'Набор объектов',
  },
  recordSetToQueryDialogHeader: {
    'en-us': createHeader('Creating a Record Set from Query'),
    'ru-ru': createHeader('Создание набор объектов из запроса'),
  },
  recordSetToQueryDialogMessage: {
    'en-us': 'Generating Record Set...',
    'ru-ru': 'Создание набора объектов...',
  },
  recordSetCreatedDialogTitle: {
    'en-us': 'Record Set Created',
    'ru-ru': 'Набор объектов создан',
  },
  recordSetCreatedDialogHeader: {
    'en-us': createHeader('Open newly created record set now?'),
    'ru-ru': createHeader('Открыть только что созданный набор объектов?'),
  },
  recordSetCreatedDialogMessage: {
    'en-us': 'Open newly created record set now?',
    'ru-ru': 'Открыть только что созданный набор объектов?',
  },
  unableToExportAsKmlDialogTitle: {
    'en-us': 'KML Export',
    'ru-ru': 'KML экспорт',
  },
  unableToExportAsKmlDialogHeader: {
    'en-us': createHeader('Unable to export to KML'),
    'ru-ru': createHeader('Невозможно экспортировать в KML'),
  },
  unableToExportAsKmlDialogMessage: {
    'en-us': 'Please add latitude and longitude fields to the query.',
    'ru-ru': 'Пожалуйста, добавьте в запрос поля широты и долготы.',
  },
  queryExportStartedDialogTitle: {
    'en-us': 'Export Query',
    'ru-ru': 'Экспорт запроса',
  },
  queryExportStartedDialogHeader: {
    'en-us': createHeader('Query Export started'),
    'ru-ru': createHeader('Экспорт запроса запущен'),
  },
  queryExportStartedDialogMessage: {
    'en-us': (exportFileType: string) => `
      The query has begun executing. You will receive a notification when the
      results ${exportFileType} file is ready for download.`,
    'ru-ru': (exportFileType: string) => `
      Запрос начал выполняться. Вы получите уведомление, когда
      ${exportFileType} файл будет готов к загрузке.`,
  },
  invalidPicklistValue: {
    'en-us': (value: string) => `${value} (current, invalid value)`,
    'ru-ru': (value: string) => `${value} (текущее, недопустимое значение)`,
  },
  missingRequiredPicklistValue: {
    'en-us': 'Invalid null selection',
    'ru-ru': 'Недействительный нулевой выбор',
  },
  // QueryTask
  queryTaskTitle: {
    'en-us': (queryName: string) => `Query: ${queryName}`,
    'ru-ru': (queryName: string) => `Запрос: ${queryName}`,
  },
  queryRecordSetTitle: {
    'en-us': (queryName: string, recordSetName: string) =>
      `Query on ${recordSetName}: ${queryName}`,
    'ru-ru': (queryName: string, recordSetName: string) =>
      `Запрос на ${recordSetName}: ${queryName}`,
  },
  newButtonDescription: {
    'en-us': 'New Field',
    'ru-ru': 'Новое поле',
  },
  countOnly: {
    'en-us': 'Count',
    'ru-ru': 'Считать',
  },
  distinct: {
    'en-us': 'Distinct',
    'ru-ru': 'Отчетливый',
  },
  format: {
    'en-us': 'Format',
    'ru-ru': 'Формат',
  },
  createCsv: {
    'en-us': 'Create CSV',
    'ru-ru': 'Создать CSV',
  },
  createKml: {
    'en-us': 'Create KML',
    'ru-ru': 'Создать KML',
  },
  makeRecordSet: {
    'en-us': 'Make Record Set',
    'ru-ru': 'Сделать набор объектов',
  },
  abandonChanges: {
    'en-us': 'Abandon Changes',
    'ru-ru': 'Отказаться от изменений',
  },
  saveAs: {
    'en-us': 'Save As',
    'ru-ru': 'Сохранить как',
  },
  // QueryField
  expandButtonDescription: {
    'en-us': 'Field is valid and will be saved. Click to expand',
    'ru-ru': 'Поле действительное и будет сохранено. Нажмите, чтобы раскрить',
  },
  anyInline: {
    'en-us': '(any)',
    'ru-ru': '(любое)',
  },
  sort: {
    'en-us': 'Sort',
    'ru-ru': 'Сортировать',
  },
  negate: {
    'en-us': 'Negate',
    'ru-ru': 'Отрицать',
  },
  moveUp: {
    'en-us': 'Move up',
    'ru-ru': 'переместить вверх',
  },
  moveDown: {
    'en-us': 'Move down',
    'ru-ru': 'Переместить вниз',
  },
  showButtonDescription: {
    'en-us': 'Show in results',
    'ru-ru': 'Показывать в результатах',
  },
  treeRanks: {
    'en-us': 'Tree Ranks',
  },
  month: {
    'en-us': 'Month',
  },
  day: {
    'en-us': 'Day',
  },
  extract: {
    'en-us': 'Extract...',
    'ru-ru': 'Извлекать...',
  },
  // QueryResultsTable
  results: {
    'en-us': (count: number | string) => `Results: ${count}`,
    'ru-ru': (count: number | string) => `Результаты: ${count}`,
  },
});

export default queryText;
