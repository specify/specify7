/**
 * Localization strings from the query builder
 *
 * @module
 */

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

export const queryText = createDictionary({
  newQueryName: {
    'en-us': 'New Query',
    'ru-ru': 'Новый запрос',
  },
  queryBoxDescription: {
    comment: `
      Used in a Query Combo Box's hover-over message to show which fields are
      being searched on
    `,
    'en-us': 'Searches: {fieldNames:string}',
    'ru-ru': 'Поисковые запросы: {fieldNames:string}',
  },
  any: {
    'en-us': 'Any',
    'ru-ru': 'Любой',
  },
  startValue: {
    'en-us': 'Start Value',
    'ru-ru': 'Начальное значение',
  },
  endValue: {
    'en-us': 'End Value',
    'ru-ru': 'Конечное значение',
  },
  saveQuery: {
    'en-us': 'Save Query',
    'ru-ru': 'Сохранить запрос',
  },
  saveQueryDialogText: {
    'en-us': 'Enter a name for the new query.',
    'ru-ru': 'Введите имя для нового запроса.',
  },
  saveClonedQueryDialogHeader: {
    'en-us': 'Save query as...',
    'ru-ru': 'Сохранить запрос как...',
  },
  saveClonedQueryDialogText: {
    'en-us': `
      The query will be saved with a new name leaving the current query
      unchanged.
    `,
    'ru-ru': `
      Запрос будет сохранен под новым именем, оставив текущий запрос без
      изменений.
    `,
  },
  queryName: {
    'en-us': 'Query Name:',
    'ru-ru': 'Имя запроса:',
  },
  queryDeleteIncompleteDialogHeader: {
    'en-us': 'Query definition contains incomplete fields',
    'ru-ru': 'Определение запроса содержит неполные поля',
  },
  queryDeleteIncompleteDialogText: {
    'en-us': `
      There are uncompleted fields in the query definition. Do you want to
      remove them?
    `,
    'ru-ru': 'В запросе есть незавершенные поля. Хотите удалить их?',
  },
  queryUnloadProtectDialogText: {
    'en-us': 'The new or modified query definition has not been saved',
    'ru-ru': 'Новый или измененный запрос не был сохранен',
  },
  recordSetToQueryDialogHeader: {
    'en-us': 'Creating a Record Set from Query',
    'ru-ru': 'Создание набор объектов из запроса',
  },
  recordSetToQueryDialogText: {
    'en-us': 'Generating Record Set...',
    'ru-ru': 'Создание набора объектов...',
  },
  recordSetCreatedDialogHeader: {
    'en-us': 'Record Set Created',
    'ru-ru': 'Набор Объектов Созданный',
  },
  unableToExportAsKmlDialogHeader: {
    'en-us': 'Unable to export to KML',
    'ru-ru': 'Невозможно экспортировать в KML',
  },
  unableToExportAsKmlDialogText: {
    'en-us': 'Please add latitude and longitude fields to the query.',
    'ru-ru': 'Пожалуйста, добавьте в запрос поля широты и долготы.',
  },
  queryExportStartedDialogHeader: {
    'en-us': 'Export File Being Created',
    'ru-ru': 'Экспорт запроса запущен',
  },
  queryExportStartedDialogText: {
    'en-us': `
      A notification will appear when the export file is complete and ready for
      download.
    `,
    'ru-ru': `
      Запрос начал выполняться. Вы получите уведомление, когда файл будет готов
      к загрузке.
    `,
  },
  invalidPicklistValue: {
    comment: 'Used when selected pick list value is not one of allowed values',
    'en-us': '{value:string} (current, invalid value)',
    'ru-ru': '{value:string} (текущее, недопустимое значение)',
  },
  queryTaskTitle: {
    comment: 'Used in query builder header',
    'en-us': 'Query: {queryName:string}',
    'ru-ru': 'Запрос: {queryName:string}',
  },
  queryRecordSetTitle: {
    comment: 'Used in query builder header when querying on record set',
    'en-us':
      'Query: "{queryName:string}" on Record Set: "{recordSetName:string}"',
    'ru-ru': `
      Запрос: "{queryName:string}" на наборе записей: "{recordSetName:string}"
    `,
  },
  treeQueryName: {
    comment: 'Used in query builder header when querying on tree node usages',
    'en-us': '{tableName:string} using "{nodeFullName:string}',
    'ru-ru': '{tableName:string} с использованием "{nodeFullName:string}"',
  },
  newButtonDescription: {
    'en-us': 'Add New Field',
    'ru-ru': 'Добавить новое поле',
  },
  countOnly: {
    'en-us': 'Count',
    'ru-ru': 'Считать',
  },
  distinct: {
    'en-us': 'Distinct',
    'ru-ru': 'Отчетливый',
  },
  createCsv: {
    'en-us': 'Create CSV',
    'ru-ru': 'Создать CSV',
  },
  createKml: {
    'en-us': 'Create KML',
    'ru-ru': 'Создать KML',
  },
  createRecordSet: {
    'en-us': 'Create Record Set',
    'ru-ru': 'Сделать набор объектов',
  },
  saveAs: {
    'en-us': 'Save As',
    'ru-ru': 'Сохранить как',
  },
  anyRank: {
    'en-us': '(any rank)',
    'ru-ru': '(любой ранг)',
  },
  sort: {
    'en-us': 'Sort',
    'ru-ru': 'Сортировать',
  },
  ascendingSort: {
    'en-us': 'Ascending Sort',
    'ru-ru': 'Сортировка по возрастанию',
  },
  descendingSort: {
    'en-us': 'Descending Sort',
    'ru-ru': 'Сортировка по убыванию',
  },
  negate: {
    'en-us': 'Negate',
    'ru-ru': 'Отрицать',
  },
  showButtonDescription: {
    'en-us': 'Show in results',
    'ru-ru': 'Показывать в результатах',
  },
  aggregatedInline: {
    'en-us': '(aggregated)',
    'ru-ru': '(совокупный)',
  },
  formattedInline: {
    'en-us': '(formatted)',
    'ru-ru': '(отформатирован)',
  },
  like: {
    'en-us': 'Like',
    'ru-ru': 'Подобно',
  },
  likeDescription: {
    comment: 'Explains the use of special symbols for the "like" query filter',
    'en-us': `
      Use "%" to match any number of characters.
      
      Use "_" to match a single character
    `,
    'ru-ru': `
      Используйте «%» для соответствия любому количеству символов.
      
      Используйте «_» для соответствия одному символу
    `,
  },
  equal: {
    'en-us': 'Equal',
    'ru-ru': 'Равный',
  },
  greaterThan: {
    'en-us': 'Greater than',
    'ru-ru': 'Больше чем',
  },
  lessThan: {
    'en-us': 'Less than',
    'ru-ru': 'Меньше чем',
  },
  greaterOrEqualTo: {
    'en-us': 'Greater or Equal to',
    'ru-ru': 'Больше или равно',
  },
  lessOrEqualTo: {
    'en-us': 'Less or Equal to',
    'ru-ru': 'Меньше или равно',
  },
  true: {
    'en-us': 'True',
    'ru-ru': 'Истинный',
  },
  false: {
    'en-us': 'False',
    'ru-ru': 'Ложь',
  },
  trueOrNull: {
    'en-us': 'True or Empty',
    'ru-ru': 'Истинный или пустой',
  },
  falseOrNull: {
    'en-us': 'False or Empty',
    'ru-ru': 'Ложь или пустой',
  },
  between: {
    'en-us': 'Between',
    'ru-ru': 'Между',
  },
  in: {
    'en-us': 'In',
    'ru-ru': 'В',
  },
  inDescription: {
    'en-us': 'A comma-separated list of values',
    'ru-ru': 'Список значений, разделенных запятыми',
  },
  contains: {
    'en-us': 'Contains',
    'ru-ru': 'Содержит',
  },
  empty: {
    'en-us': 'Empty',
    'ru-ru': 'Пустой',
  },
  and: {
    'en-us': 'and',
    'ru-ru': 'и',
  },
  startsWith: {
    'en-us': 'Starts With',
    'ru-ru': 'Начинается с',
  },
  or: {
    'en-us': 'or',
    'ru-ru': 'или',
  },
  yes: {
    'en-us': 'Yes',
    'ru-ru': 'Да',
  },
  queryBuilder: {
    'en-us': 'Query Builder',
    'ru-ru': 'Конструктор запросов',
  },
  noPreparationsToReturn: {
    'en-us': 'There are no unresolved items to return',
    'ru-ru': 'Нет нерешенных приготовлений к возвращению',
  },
  itemsReturned: {
    'en-us': 'Items have been returned',
    'ru-ru': 'Items have been returned',
  },
  queryResults: {
    'en-us': 'Query Results: {tableName:string}',
    'ru-ru': 'Результаты запроса: {tableName:string}',
  },
  editQuery: {
    'en-us': 'Edit Query',
    'ru-ru': 'Редактировать запрос',
  },
  configureQueryTables: {
    'en-us': 'Configure visible query tables',
    'ru-ru': 'Настроить видимые таблицы запроса',
  },
  openMap: {
    'en-us': 'Open Map',
    'ru-ru': 'Открыть карту',
  },
  queryMapSubset: {
    comment: 'Used in GeoMap header while records are still being fetched',
    'en-us':
      'Plotted {plotted:number|formatted} of {total:number|formatted} records',
    'ru-ru': `
      Отображено {plotted:number|formatted} из {total:number|formatted} записей
    `,
  },
  queryMapAll: {
    'en-us': 'Plotted {plotted:number|formatted} records',
    'ru-ru': 'Отображено {plotted:number|formatted} записей',
  },
  queriesDialogTitle: {
    'en-us': 'Queries ({count:number|formatted})',
    'ru-ru': 'Запросы ({count:number|formatted})',
  },
  exportQueryForDwca: {
    'en-us': 'Export query for DwCA definition',
    'ru-ru': 'Экспорт запрос для DwCA',
  },
  exportQueryForDwcaDialogHeader: {
    'en-us': 'Query XML for DwCA definition',
    'ru-ru': 'XML Запроса для определения DwCA',
  },
  exportQueryAsReport: {
    'en-us': 'Define report based on query',
    'ru-ru': 'Определите отчет на основе запроса',
  },
  exportQueryAsLabel: {
    'en-us': 'Define label based on query',
    'ru-ru': 'Определите метку на основе запроса',
  },
  treeMerge: {
    comment: 'Audit Log Action Type',
    'en-us': 'Tree Merge',
    'ru-ru': 'Слияние узлов дерева',
  },
  treeMove: {
    comment: 'Audit Log Action Type',
    'en-us': 'Tree Move',
    'ru-ru': 'Перемещение узла дерева',
  },
  treeSynonymize: {
    comment: 'Audit Log Action Type',
    'en-us': 'Tree Synonymize',
    'ru-ru': 'Синонимизированный узел дерева',
  },
  treeDesynonymize: {
    comment: 'Audit Log Action Type',
    'en-us': 'Tree Desynonymize',
    'ru-ru': 'Отменено синонимизацию узла дерева',
  },
  tooLongErrorMessage: {
    'en-us': `
      Field value is too long. Max allowed length is
      {maxLength:number|formatted}
    `,
    'ru-ru': `
      Значение поля слишком длинное. Максимально допустимая длина
      {maxLength:number|formatted}
    `,
  },
} as const);
