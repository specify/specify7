/**
 * Localization strings from the query builder
 *
 * @module
 */

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

const queryText = createDictionary({
  newQueryName: {
    'en-us': 'New Query',
    'ru-ru': 'Новый запрос',
    ca: 'New Query',
    'es-es': 'New Query',
  },
  queryBoxDescription: {
    'en-us': (fieldNames: string) => `Searches: ${fieldNames}`,
    'ru-ru': (fieldNames: string) => `Поисковые запросы: ${fieldNames}`,
    ca: (fieldNames: string) => `Searches: ${fieldNames}`,
    'es-es': (fieldNames: string) => `Searches: ${fieldNames}`,
  },
  selectFields: {
    'en-us': 'Select Field...',
    'ru-ru': 'Выбрать поле...',
    ca: 'Select Field...',
    'es-es': 'Select Field...',
  },
  treeRankAuthor: {
    'en-us': (rankName: string) => `${rankName} Author`,
    'ru-ru': (rankName: string) => `${rankName} Автор`,
    ca: (rankName: string) => `${rankName} Author`,
    'es-es': (rankName: string) => `${rankName} Author`,
  },
  selectOp: {
    'en-us': 'Select Op...',
    'ru-ru': 'Выберите оп...',
    ca: 'Select Op...',
    'es-es': 'Select Op...',
  },
  any: {
    'en-us': 'Any',
    'ru-ru': 'Любой',
    ca: 'Any',
    'es-es': 'Any',
  },
  startValue: {
    'en-us': 'Start Value',
    'ru-ru': 'Начальное значение',
    ca: 'Start Value',
    'es-es': 'Start Value',
  },
  endValue: {
    'en-us': 'End Value',
    'ru-ru': 'Конечное значение',
    ca: 'End Value',
    'es-es': 'End Value',
  },
  addValuesHint: {
    'en-us': 'Add values one by one, or as comma-separated list:',
    'ru-ru':
      'Добавьте значения по одному или в виде списка, разделенного запятыми:',
    ca: 'Add values one by one, or as comma-separated list:',
    'es-es': 'Add values one by one, or as comma-separated list:',
  },
  saveQueryDialogTitle: {
    'en-us': 'Save query as...',
    'ru-ru': 'Сохранить запрос как...',
    ca: 'Save query as...',
    'es-es': 'Save query as...',
  },
  saveQueryDialogHeader: {
    'en-us': 'Save Query',
    'ru-ru': 'Сохранить запрос',
    ca: 'Save Query',
    'es-es': 'Save Query',
  },
  saveQueryDialogMessage: {
    'en-us': 'Enter a name for the new query.',
    'ru-ru': 'Введите имя для нового запроса.',
    ca: 'Enter a name for the new query.',
    'es-es': 'Enter a name for the new query.',
  },
  saveClonedQueryDialogHeader: {
    'en-us': 'Clone Query',
    'ru-ru': 'Клонировать запрос',
    ca: 'Clone Query',
    'es-es': 'Clone Query',
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
    'es-es': `
      The query will be saved with a new name leaving the current query
      unchanged.`,
  },
  queryName: {
    'en-us': 'Query Name:',
    'ru-ru': 'Имя запроса:',
    ca: 'Query Name:',
    'es-es': 'Query Name:',
  },
  queryDeleteIncompleteDialogTitle: {
    'en-us': 'Incomplete fields',
    'ru-ru': 'Неполные поля',
    ca: 'Incomplete fields',
    'es-es': 'Incomplete fields',
  },
  queryDeleteIncompleteDialogHeader: {
    'en-us': 'Query definition contains incomplete fields',
    'ru-ru': 'Определение запроса содержит неполные поля',
    ca: 'Query definition contains incomplete fields',
    'es-es': 'Query definition contains incomplete fields',
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
    'es-es': `
      There are uncompleted fields in the query definition. Do you want to
      remove them?`,
  },
  queryUnloadProtectDialogMessage: {
    'en-us': 'This query definition has not been saved.',
    'ru-ru': 'Этот запрос не был сохранен.',
    ca: 'This query definition has not been saved.',
    'es-es': 'This query definition has not been saved.',
  },
  recordSetToQueryDialogTitle: {
    'en-us': 'Record Set',
    'ru-ru': 'Набор объектов',
    ca: 'Record Set',
    'es-es': 'Record Set',
  },
  recordSetToQueryDialogHeader: {
    'en-us': 'Creating a Record Set from Query',
    'ru-ru': 'Создание набор объектов из запроса',
    ca: 'Creating a Record Set from Query',
    'es-es': 'Creating a Record Set from Query',
  },
  recordSetToQueryDialogMessage: {
    'en-us': 'Generating Record Set...',
    'ru-ru': 'Создание набора объектов...',
    ca: 'Generating Record Set...',
    'es-es': 'Generating Record Set...',
  },
  recordSetCreatedDialogTitle: {
    'en-us': 'Record Set Created',
    'ru-ru': 'Набор объектов создан',
    ca: 'Record Set Created',
    'es-es': 'Record Set Created',
  },
  recordSetCreatedDialogHeader: {
    'en-us': 'Open newly created record set now?',
    'ru-ru': 'Открыть только что созданный набор объектов?',
    ca: 'Open newly created record set now?',
    'es-es': 'Open newly created record set now?',
  },
  recordSetCreatedDialogMessage: {
    'en-us': 'Open newly created record set now?',
    'ru-ru': 'Открыть только что созданный набор объектов?',
    ca: 'Open newly created record set now?',
    'es-es': 'Open newly created record set now?',
  },
  unableToExportAsKmlDialogTitle: {
    'en-us': 'KML Export',
    'ru-ru': 'KML экспорт',
    ca: 'KML Export',
    'es-es': 'KML Export',
  },
  unableToExportAsKmlDialogHeader: {
    'en-us': 'Unable to export to KML',
    'ru-ru': 'Невозможно экспортировать в KML',
    ca: 'Unable to export to KML',
    'es-es': 'Unable to export to KML',
  },
  unableToExportAsKmlDialogMessage: {
    'en-us': 'Please add latitude and longitude fields to the query.',
    'ru-ru': 'Пожалуйста, добавьте в запрос поля широты и долготы.',
    ca: 'Please add latitude and longitude fields to the query.',
    'es-es': 'Please add latitude and longitude fields to the query.',
  },
  queryExportStartedDialogTitle: {
    'en-us': 'Export Query',
    'ru-ru': 'Экспорт запроса',
    ca: 'Export Query',
    'es-es': 'Export Query',
  },
  queryExportStartedDialogHeader: {
    'en-us': 'Query Export started',
    'ru-ru': 'Экспорт запроса запущен',
    ca: 'Query Export started',
    'es-es': 'Query Export started',
  },
  queryExportStartedDialogMessage: {
    'en-us': `
      The query has begun executing. You will receive a notification when the
      results file is ready for download.`,
    'ru-ru': `
      Запрос начал выполняться. Вы получите уведомление, когда
      файл будет готов к загрузке.`,
    ca: `
      The query has begun executing. You will receive a notification when the
      results file is ready for download.`,
    'es-es': `
      The query has begun executing. You will receive a notification when the
      results file is ready for download.`,
  },
  invalidPicklistValue: {
    'en-us': (value: string) => `${value} (current, invalid value)`,
    'ru-ru': (value: string) => `${value} (текущее, недопустимое значение)`,
    ca: (value: string) => `${value} (current, invalid value)`,
    'es-es': (value: string) => `${value} (current, invalid value)`,
  },
  // QueryTask
  queryTaskTitle: {
    'en-us': (queryName: string) => `Query: ${queryName}`,
    'ru-ru': (queryName: string) => `Запрос: ${queryName}`,
    ca: (queryName: string) => `Query: ${queryName}`,
    'es-es': (queryName: string) => `Query: ${queryName}`,
  },
  queryRecordSetTitle: {
    'en-us': (queryName: string, recordSetName: string) =>
      `Query on ${recordSetName}: ${queryName}`,
    'ru-ru': (queryName: string, recordSetName: string) =>
      `Запрос на ${recordSetName}: ${queryName}`,
    ca: (queryName: string, recordSetName: string) =>
      `Query on ${recordSetName}: ${queryName}`,
    'es-es': (queryName: string, recordSetName: string) =>
      `Query on ${recordSetName}: ${queryName}`,
  },
  newButtonDescription: {
    'en-us': 'Add New Field',
    'ru-ru': 'Добавить новое поле',
    ca: 'Add New Field',
    'es-es': 'Add New Field',
  },
  countOnly: {
    'en-us': 'Count',
    'ru-ru': 'Считать',
    ca: 'Count',
    'es-es': 'Count',
  },
  distinct: {
    'en-us': 'Distinct',
    'ru-ru': 'Отчетливый',
    ca: 'Distinct',
    'es-es': 'Distinct',
  },
  format: {
    'en-us': 'Format',
    'ru-ru': 'Формат',
    ca: 'Format',
    'es-es': 'Format',
  },
  createCsv: {
    'en-us': 'Create CSV',
    'ru-ru': 'Создать CSV',
    ca: 'Create CSV',
    'es-es': 'Create CSV',
  },
  createKml: {
    'en-us': 'Create KML',
    'ru-ru': 'Создать KML',
    ca: 'Create KML',
    'es-es': 'Create KML',
  },
  makeRecordSet: {
    'en-us': 'Make Record Set',
    'ru-ru': 'Сделать набор объектов',
    ca: 'Make Record Set',
    'es-es': 'Make Record Set',
  },
  abandonChanges: {
    'en-us': 'Abandon Changes',
    'ru-ru': 'Отказаться от изменений',
    ca: 'Abandon Changes',
    'es-es': 'Abandon Changes',
  },
  saveAs: {
    'en-us': 'Save As',
    'ru-ru': 'Сохранить как',
    ca: 'Save As',
    'es-es': 'Save As',
  },
  // QueryField
  expandButtonDescription: {
    'en-us': 'Field is valid and will be saved. Click to expand',
    'ru-ru': 'Поле действительное и будет сохранено. Нажмите, чтобы раскрить',
    ca: 'Field is valid and will be saved. Click to expand',
    'es-es': 'Field is valid and will be saved. Click to expand',
  },
  anyRank: {
    'en-us': '(any rank)',
    'ru-ru': '(любой ранг)',
    ca: '(any rank)',
    'es-es': '(any rank)',
  },
  sort: {
    'en-us': 'Sort',
    'ru-ru': 'Сортировать',
    ca: 'Sort',
    'es-es': 'Sort',
  },
  ascendingSort: {
    'en-us': 'Ascending Sort',
    'ru-ru': 'Сортировка по возрастанию',
    ca: 'Ascending Sort',
    'es-es': 'Ascending Sort',
  },
  descendingSort: {
    'en-us': 'Descending Sort',
    'ru-ru': 'Сортировка по убыванию',
    ca: 'Descending Sort',
    'es-es': 'Descending Sort',
  },
  negate: {
    'en-us': 'Negate',
    'ru-ru': 'Отрицать',
    ca: 'Negate',
    'es-es': 'Negate',
  },
  moveUp: {
    'en-us': 'Move up',
    'ru-ru': 'переместить вверх',
    ca: 'Move up',
    'es-es': 'Move up',
  },
  moveDown: {
    'en-us': 'Move down',
    'ru-ru': 'Переместить вниз',
    ca: 'Move down',
    'es-es': 'Move down',
  },
  showButtonDescription: {
    'en-us': 'Show in results',
    'ru-ru': 'Показывать в результатах',
    ca: 'Show in results',
    'es-es': 'Show in results',
  },
  treeRanks: {
    'en-us': 'Tree Ranks',
    'ru-ru': 'Ранги на дереве',
    ca: "Ranks d'arbres",
    'es-es': 'Tree Ranks',
  },
  extract: {
    'en-us': 'Extract...',
    'ru-ru': 'Извлекать...',
    ca: 'Extract...',
    'es-es': 'Extract...',
  },
  // QueryResultsTable
  results: {
    'en-us': 'Results',
    'ru-ru': 'Результаты',
    ca: 'Results',
    'es-es': 'Results',
  },
  editQuery: {
    'en-us': 'Edit Query',
    'ru-ru': 'Показать определение запроса',
    ca: 'Edit Query',
    'es-es': 'Edit Query',
  },
  aggregated: {
    'en-us': '(aggregated)',
    'ru-ru': '(совокупный)',
    ca: '(aggregated)',
    'es-es': '(aggregated)',
  },
  formatted: {
    'en-us': '(formatted)',
    'ru-ru': '(отформатирован)',
    ca: '(formatted)',
    'es-es': '(formatted)',
  },
  filter: {
    'en-us': 'Filter',
    'ru-ru': 'Фильтр',
    ca: 'Filter',
    'es-es': 'Filter',
  },
  like: {
    'en-us': 'Like',
    'ru-ru': 'Подобно',
    ca: 'Like',
    'es-es': 'Like',
  },
  equal: {
    'en-us': 'Equal',
    'ru-ru': 'Равный',
    ca: 'Equal',
    'es-es': 'Equal',
  },
  greaterThan: {
    'en-us': 'Greater than',
    'ru-ru': 'Больше чем',
    ca: 'Greater than',
    'es-es': 'Greater than',
  },
  lessThan: {
    'en-us': 'Less than',
    'ru-ru': 'Меньше чем',
    ca: 'Less than',
    'es-es': 'Less than',
  },
  greaterOrEqualTo: {
    'en-us': 'Greater or Equal to',
    'ru-ru': 'Больше или равно',
    ca: 'Greater or equal to',
    'es-es': 'Greater or Equal to',
  },
  lessOrEqualTo: {
    'en-us': 'Less or Equal to',
    'ru-ru': 'Меньше или равно',
    ca: 'Less or equal to',
    'es-es': 'Less or Equal to',
  },
  true: {
    'en-us': 'True',
    'ru-ru': 'Истинный',
    ca: 'True',
    'es-es': 'True',
  },
  false: {
    'en-us': 'False',
    'ru-ru': 'Ложь',
    ca: 'False',
    'es-es': 'False',
  },
  trueOrNull: {
    'en-us': 'True or Null',
    'ru-ru': 'Истина или Ноль',
    ca: 'True or Null',
    'es-es': 'True or Null',
  },
  falseOrNull: {
    'en-us': 'False or Null',
    'ru-ru': 'Ложь или Нуль',
    ca: 'False or Null',
    'es-es': 'False or Null',
  },
  between: {
    'en-us': 'Between',
    'ru-ru': 'Между',
    ca: 'Between',
    'es-es': 'Between',
  },
  in: {
    'en-us': 'In',
    'ru-ru': 'В',
    ca: 'In',
    'es-es': 'In',
  },
  contains: {
    'en-us': 'Contains',
    'ru-ru': 'Содержит',
    ca: 'Contains',
    'es-es': 'Contains',
  },
  empty: {
    'en-us': 'Empty',
    'ru-ru': 'Пустой',
    ca: 'Empty',
    'es-es': 'Empty',
  },
  datePart: {
    'en-us': 'Date Part',
    'ru-ru': 'Дата',
    ca: 'Date Part',
    'es-es': 'Date Part',
  },
  and: {
    'en-us': 'and',
    'ru-ru': 'и',
    ca: 'and',
    'es-es': 'and',
  },
  startsWith: {
    'en-us': 'Starts With',
    'ru-ru': 'Начинается с',
    ca: 'Starts With',
    'es-es': 'Starts With',
  },
  or: {
    'en-us': 'or',
    'ru-ru': 'или',
    ca: 'or',
    'es-es': 'or',
  },
});

export default queryText;
