/**
 * Localization strings from the query builder
 *
 * @module
 */

import { createDictionary, whitespaceSensitive } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

export const queryText = createDictionary({
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
  saveQueryDialogHeader: {
    'en-us': 'Save Query',
    'ru-ru': 'Сохранить запрос',
    ca: 'Save Query',
    'es-es': 'Save Query',
  },
  saveQueryDialogText: {
    'en-us': 'Enter a name for the new query.',
    'ru-ru': 'Введите имя для нового запроса.',
    ca: 'Enter a name for the new query.',
    'es-es': 'Enter a name for the new query.',
  },
  saveClonedQueryDialogHeader: {
    'en-us': 'Save query as...',
    'ru-ru': 'Сохранить запрос как...',
    ca: 'Save query as...',
    'es-es': 'Save query as...',
  },
  saveClonedQueryDialogText: {
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
  queryDeleteIncompleteDialogHeader: {
    'en-us': 'Query definition contains incomplete fields',
    'ru-ru': 'Определение запроса содержит неполные поля',
    ca: 'Query definition contains incomplete fields',
    'es-es': 'Query definition contains incomplete fields',
  },
  queryDeleteIncompleteDialogText: {
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
  queryUnloadProtectDialogText: {
    'en-us': 'This query definition has not been saved.',
    'ru-ru': 'Этот запрос не был сохранен.',
    ca: 'This query definition has not been saved.',
    'es-es': 'This query definition has not been saved.',
  },
  recordSetToQueryDialogHeader: {
    'en-us': 'Creating a Record Set from Query',
    'ru-ru': 'Создание набор объектов из запроса',
    ca: 'Creating a Record Set from Query',
    'es-es': 'Creating a Record Set from Query',
  },
  recordSetToQueryDialogText: {
    'en-us': 'Generating Record Set...',
    'ru-ru': 'Создание набора объектов...',
    ca: 'Generating Record Set...',
    'es-es': 'Generating Record Set...',
  },
  recordSetCreatedDialogHeader: {
    'en-us': 'Record Set Created',
    'ru-ru': 'Набор Объектов Созданный',
    ca: 'Record Set Created',
    'es-es': 'Record Set Created',
  },
  unableToExportAsKmlDialogHeader: {
    'en-us': 'Unable to export to KML',
    'ru-ru': 'Невозможно экспортировать в KML',
    ca: 'Unable to export to KML',
    'es-es': 'Unable to export to KML',
  },
  unableToExportAsKmlDialogText: {
    'en-us': 'Please add latitude and longitude fields to the query.',
    'ru-ru': 'Пожалуйста, добавьте в запрос поля широты и долготы.',
    ca: 'Please add latitude and longitude fields to the query.',
    'es-es': 'Please add latitude and longitude fields to the query.',
  },
  queryExportStartedDialogHeader: {
    'en-us': 'Export File Being Created',
    'ru-ru': 'Экспорт запроса запущен',
    ca: 'Export File Being Created',
    'es-es': 'Export File Being Created',
  },
  queryExportStartedDialogText: {
    'en-us': `
      A notification will appear when the export file is complete and ready for
      download.`,
    'ru-ru': `
      Запрос начал выполняться. Вы получите уведомление, когда
      файл будет готов к загрузке.`,
    ca: `
      A notification will appear when the export file is complete and ready for
      download.`,
    'es-es': `
      A notification will appear when the export file is complete and ready for
      download.`,
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
      `Query: "${queryName}" on Record Set: "${recordSetName}"`,
    'ru-ru': (queryName: string, recordSetName: string) =>
      `Запрос: "${queryName}" на наборе записей: "${recordSetName}"`,
    ca: (queryName: string, recordSetName: string) =>
      `Query: "${queryName}" on Record Set: "${recordSetName}"`,
    'es-es': (queryName: string, recordSetName: string) =>
      `Query: "${queryName}" on Record Set: "${recordSetName}"`,
  },
  treeQueryName: {
    'en-us': (tableName: string, nodeFullName: string) =>
      `${tableName} using "${nodeFullName}"`,
    'ru-ru': (tableName: string, nodeFullName: string) =>
      `${tableName} с использованием "${nodeFullName}"`,
    ca: (tableName: string, nodeFullName: string) =>
      `${tableName} using "${nodeFullName}"`,
    'es-es': (tableName: string, nodeFullName: string) =>
      `${tableName} using "${nodeFullName}"`,
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
  createRecordSet: {
    'en-us': 'Create Record Set',
    'ru-ru': 'Сделать набор объектов',
    ca: 'Create Record Set',
    'es-es': 'Create Record Set',
  },
  saveAs: {
    'en-us': 'Save As',
    'ru-ru': 'Сохранить как',
    ca: 'Save As',
    'es-es': 'Save As',
  },
  // QueryField
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
  // QueryResultsTable
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
  like: {
    'en-us': 'Like',
    'ru-ru': 'Подобно',
    ca: 'Like',
    'es-es': 'Like',
  },
  likeDescription: {
    'en-us': whitespaceSensitive(`Use "%" to match any number of
      characters.<br>Use "_" to match a single character`),
    'ru-ru': whitespaceSensitive(`Используйте «%» для соответствия любому
      количеству символов.<br>Используйте «_» для соответствия одному символу`),
    ca: whitespaceSensitive(`Use "%" to match any number of
      characters.<br>Use "_" to match a single character`),
    'es-es': whitespaceSensitive(`Use "%" to match any number of
      characters.<br>Use "_" to match a single character`),
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
  inDescription: {
    'en-us': 'A comma-separated list of values',
    'ru-ru': 'Список значений, разделенных запятыми',
    ca: 'A comma-separated list of values',
    'es-es': 'A comma-separated list of values',
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
  yes: {
    'en-us': 'Yes',
    'ru-ru': 'Да',
    ca: 'Yes',
    'es-es': 'Yes',
  },
  queryBuilder: {
    'en-us': 'Query Builder',
    'ru-ru': 'Конструктор запросов',
    ca: 'Query Builder',
    'es-es': 'Query Builder',
  },
  returnLoan: {
    'en-us': 'Return Loan',
    'ru-ru': 'Return Loan',
    ca: 'Return Loan',
    'es-es': 'Return Loan',
  },
  noPreparationsToReturn: {
    'en-us': 'There are no unresolved items to return',
    'ru-ru': 'Нет нерешенных приготовлений к возвращению',
    ca: 'There are no unresolved items to return',
    'es-es': 'There are no unresolved items to return',
  },
  itemsReturned: {
    'en-us': 'Items have been returned',
    'ru-ru': 'Items have been returned',
    ca: 'Items have been returned',
    'es-es': 'Items have been returned',
  },
  saveQuery: {
    'en-us': 'Save Query',
    'ru-ru': 'Сохранить запрос',
    ca: 'Save Query',
    'es-es': 'Save Query',
  },
  queryResults: {
    'en-us': (tableName: string) => `Query Results: ${tableName}`,
    'ru-ru': (tableName: string) => `Результаты запроса: ${tableName}`,
    ca: (tableName: string) => `Query Results: ${tableName}`,
    'es-es': (tableName: string) => `Query Results: ${tableName}`,
  },
});
