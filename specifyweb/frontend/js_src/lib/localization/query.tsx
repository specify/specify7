/**
 * Localization strings from the query builder
 *
 * @module
 */

import { createDictionary, header } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

const queryText = createDictionary({
  queryBoxDescription: {
    'en-us': (fieldNames: string) => `Searches: ${fieldNames}`,
    'ru-ru': (fieldNames: string) => `Поисковые запросы: ${fieldNames}`,
    ca: (fieldNames: string) => `Searches: ${fieldNames}`,
  },
  selectFields: {
    'en-us': 'Select Field...',
    'ru-ru': 'Выбрать поле...',
    ca: 'Select Field...',
  },
  treeRankAuthor: {
    'en-us': (rankName: string) => `${rankName} Author`,
    'ru-ru': (rankName: string) => `${rankName} Автор`,
    ca: (rankName: string) => `${rankName} Author`,
  },
  selectOp: {
    'en-us': 'Select Op...',
    'ru-ru': 'Выберите оп...',
    ca: 'Select Op...',
  },
  any: {
    'en-us': 'any',
    'ru-ru': 'любой',
    ca: 'any',
  },
  startValue: {
    'en-us': 'Start Value',
    'ru-ru': 'Начальное значение',
    ca: 'Start Value',
  },
  endValue: {
    'en-us': 'End Value',
    'ru-ru': 'Конечное значение',
    ca: 'End Value',
  },
  addValuesHint: {
    'en-us': 'Add values one by one, or as comma-separated list:',
    'ru-ru':
      'Добавьте значения по одному или в виде списка, разделенного запятыми:',
    ca: 'Add values one by one, or as comma-separated list:',
  },
  saveQueryDialogTitle: {
    'en-us': 'Save query as...',
    'ru-ru': 'Сохранить запрос как...',
    ca: 'Save query as...',
  },
  saveQueryDialogHeader: {
    'en-us': 'Save Query',
    'ru-ru': 'Сохранить запрос',
    ca: 'Save Query',
  },
  saveQueryDialogMessage: {
    'en-us': 'Enter a name for the new query.',
    'ru-ru': 'Введите имя для нового запроса.',
    ca: 'Enter a name for the new query.',
  },
  saveClonedQueryDialogHeader: {
    'en-us': 'Clone Query',
    'ru-ru': 'Клонировать запрос',
    ca: 'Clone Query',
  },
  saveClonedQueryDialogMessage: {
    'en-us': `
      The query will be saved with a new name leaving the current query
      unchanged.`,
    'ru-ru': `
      Запрос будет сохранен под новым именем, оставив текущий запрос без
      изменений.`,
    ca: `
      The query will be saved with a new name leaving the current query
      unchanged.`,
  },
  queryName: {
    'en-us': 'Query Name:',
    'ru-ru': 'Имя запроса:',
    ca: 'Query Name:',
  },
  queryDeleteIncompleteDialogTitle: {
    'en-us': 'Incomplete fields',
    'ru-ru': 'Неполные поля',
    ca: 'Incomplete fields',
  },
  queryDeleteIncompleteDialogHeader: {
    'en-us': header('Query definition contains incomplete fields'),
    'ru-ru': header('Определение запроса содержит неполные поля'),
    ca: header('Query definition contains incomplete fields'),
  },
  queryDeleteIncompleteDialogMessage: {
    'en-us': `
      There are uncompleted fields in the query definition. Do you want to
      remove them?`,
    'ru-ru': `
      В запросе есть незавершенные поля. Хотите удалить их?`,
    ca: `
      There are uncompleted fields in the query definition. Do you want to
      remove them?`,
  },
  queryUnloadProtectDialogMessage: {
    'en-us': 'This query definition has not been saved.',
    'ru-ru': 'Этот запрос не был сохранен.',
    ca: 'This query definition has not been saved.',
  },
  recordSetToQueryDialogTitle: {
    'en-us': 'Record Set',
    'ru-ru': 'Набор объектов',
    ca: 'Record Set',
  },
  recordSetToQueryDialogHeader: {
    'en-us': header('Creating a Record Set from Query'),
    'ru-ru': header('Создание набор объектов из запроса'),
    ca: header('Creating a Record Set from Query'),
  },
  recordSetToQueryDialogMessage: {
    'en-us': 'Generating Record Set...',
    'ru-ru': 'Создание набора объектов...',
    ca: 'Generating Record Set...',
  },
  recordSetCreatedDialogTitle: {
    'en-us': 'Record Set Created',
    'ru-ru': 'Набор объектов создан',
    ca: 'Record Set Created',
  },
  recordSetCreatedDialogHeader: {
    'en-us': header('Open newly created record set now?'),
    'ru-ru': header('Открыть только что созданный набор объектов?'),
    ca: header('Open newly created record set now?'),
  },
  recordSetCreatedDialogMessage: {
    'en-us': 'Open newly created record set now?',
    'ru-ru': 'Открыть только что созданный набор объектов?',
    ca: 'Open newly created record set now?',
  },
  unableToExportAsKmlDialogTitle: {
    'en-us': 'KML Export',
    'ru-ru': 'KML экспорт',
    ca: 'KML Export',
  },
  unableToExportAsKmlDialogHeader: {
    'en-us': header('Unable to export to KML'),
    'ru-ru': header('Невозможно экспортировать в KML'),
    ca: header('Unable to export to KML'),
  },
  unableToExportAsKmlDialogMessage: {
    'en-us': 'Please add latitude and longitude fields to the query.',
    'ru-ru': 'Пожалуйста, добавьте в запрос поля широты и долготы.',
    ca: 'Please add latitude and longitude fields to the query.',
  },
  queryExportStartedDialogTitle: {
    'en-us': 'Export Query',
    'ru-ru': 'Экспорт запроса',
    ca: 'Export Query',
  },
  queryExportStartedDialogHeader: {
    'en-us': header('Query Export started'),
    'ru-ru': header('Экспорт запроса запущен'),
    ca: header('Query Export started'),
  },
  queryExportStartedDialogMessage: {
    'en-us': (exportFileType: string) => `
      The query has begun executing. You will receive a notification when the
      results ${exportFileType} file is ready for download.`,
    'ru-ru': (exportFileType: string) => `
      Запрос начал выполняться. Вы получите уведомление, когда
      ${exportFileType} файл будет готов к загрузке.`,
    ca: (exportFileType: string) => `
      The query has begun executing. You will receive a notification when the
      results ${exportFileType} file is ready for download.`,
  },
  invalidPicklistValue: {
    'en-us': (value: string) => `${value} (current, invalid value)`,
    'ru-ru': (value: string) => `${value} (текущее, недопустимое значение)`,
    ca: (value: string) => `${value} (current, invalid value)`,
  },
  missingRequiredPicklistValue: {
    'en-us': 'Invalid null selection',
    'ru-ru': 'Недействительный нулевой выбор',
    ca: 'Invalid null selection',
  },
  // QueryTask
  queryTaskTitle: {
    'en-us': (queryName: string) => `Query: ${queryName}`,
    'ru-ru': (queryName: string) => `Запрос: ${queryName}`,
    ca: (queryName: string) => `Query: ${queryName}`,
  },
  queryRecordSetTitle: {
    'en-us': (queryName: string, recordSetName: string) =>
      `Query on ${recordSetName}: ${queryName}`,
    'ru-ru': (queryName: string, recordSetName: string) =>
      `Запрос на ${recordSetName}: ${queryName}`,
    ca: (queryName: string, recordSetName: string) =>
      `Query on ${recordSetName}: ${queryName}`,
  },
  newButtonDescription: {
    'en-us': 'New Field',
    'ru-ru': 'Новое поле',
    ca: 'New Field',
  },
  countOnly: {
    'en-us': 'Count',
    'ru-ru': 'Считать',
    ca: 'Count',
  },
  distinct: {
    'en-us': 'Distinct',
    'ru-ru': 'Отчетливый',
    ca: 'Distinct',
  },
  format: {
    'en-us': 'Format',
    'ru-ru': 'Формат',
    ca: 'Format',
  },
  createCsv: {
    'en-us': 'Create CSV',
    'ru-ru': 'Создать CSV',
    ca: 'Create CSV',
  },
  createKml: {
    'en-us': 'Create KML',
    'ru-ru': 'Создать KML',
    ca: 'Create KML',
  },
  makeRecordSet: {
    'en-us': 'Make Record Set',
    'ru-ru': 'Сделать набор объектов',
    ca: 'Make Record Set',
  },
  abandonChanges: {
    'en-us': 'Abandon Changes',
    'ru-ru': 'Отказаться от изменений',
    ca: 'Abandon Changes',
  },
  saveAs: {
    'en-us': 'Save As',
    'ru-ru': 'Сохранить как',
    ca: 'Save As',
  },
  // QueryField
  expandButtonDescription: {
    'en-us': 'Field is valid and will be saved. Click to expand',
    'ru-ru': 'Поле действительное и будет сохранено. Нажмите, чтобы раскрить',
    ca: 'Field is valid and will be saved. Click to expand',
  },
  anyInline: {
    'en-us': '(any)',
    'ru-ru': '(любое)',
    ca: '(any)',
  },
  sort: {
    'en-us': 'Sort',
    'ru-ru': 'Сортировать',
    ca: 'Sort',
  },
  negate: {
    'en-us': 'Negate',
    'ru-ru': 'Отрицать',
    ca: 'Negate',
  },
  moveUp: {
    'en-us': 'Move up',
    'ru-ru': 'переместить вверх',
    ca: 'Move up',
  },
  moveDown: {
    'en-us': 'Move down',
    'ru-ru': 'Переместить вниз',
    ca: 'Move down',
  },
  showButtonDescription: {
    'en-us': 'Show in results',
    'ru-ru': 'Показывать в результатах',
    ca: 'Show in results',
  },
  treeRanks: {
    'en-us': 'Tree Ranks',
    'ru-ru': 'Ранги на дереве',
    ca: "Ranks d'arbres",
  },
  extract: {
    'en-us': 'Extract...',
    'ru-ru': 'Извлекать...',
    ca: 'Extract...',
  },
  // QueryResultsTable
  results: {
    'en-us': (count: number | string) => `Results: ${count}`,
    'ru-ru': (count: number | string) => `Результаты: ${count}`,
    ca: (count: number | string) => `Results: ${count}`,
  },
});

export default queryText;
