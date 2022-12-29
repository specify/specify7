/**
 * Localization strings that are shared across components
 *
 * @module
 */

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

export const commonText = createDictionary({
  specifySeven: {
    comment: `
      This is an example of how to provide comments. Comments are visible to
      translators.
    `,
    'en-us': 'Specify 7',
    'ru-ru': 'Specify 7',
  },
  no: {
    'en-us': 'No',
    'ru-ru': 'Нет',
  },
  cancel: {
    'en-us': 'Cancel',
    'ru-ru': 'Отмена',
  },
  back: {
    'en-us': 'Back',
    'ru-ru': 'Назад',
  },
  skip: {
    'en-us': 'Skip',
    'ru-ru': 'Пропустить',
  },
  create: {
    'en-us': 'Create',
    'ru-ru': 'Создать',
  },
  close: {
    'en-us': 'Close',
    'ru-ru': 'Закрыть',
  },
  apply: {
    'en-us': 'Apply',
    'ru-ru': 'Применить',
  },
  applyAll: {
    'en-us': 'Apply All',
    'ru-ru': 'Применить все',
  },
  clearAll: {
    'en-us': 'Clear all',
    'ru-ru': 'Очистить все',
  },
  save: {
    'en-us': 'Save',
    'ru-ru': 'Сохранить',
  },
  add: {
    'en-us': 'Add',
    'ru-ru': 'Добавить',
  },
  open: {
    'en-us': 'Open',
    'ru-ru': 'Открыть',
  },
  delete: {
    'en-us': 'Delete',
    'ru-ru': 'Удалить',
  },
  next: {
    'en-us': 'Next',
    'ru-ru': 'Следующий',
  },
  previous: {
    'en-us': 'Previous',
    'ru-ru': 'Предыдущий',
  },
  tool: {
    'en-us': 'Tool',
    'ru-ru': 'Инструмент',
  },
  tools: {
    'en-us': 'Tools',
    'ru-ru': 'Инструменты',
  },
  loading: {
    'en-us': 'Loading...',
    'ru-ru': 'Загрузка...',
  },
  uploaded: {
    'en-us': 'Uploaded',
    'ru-ru': 'Загружено',
  },
  remove: {
    'en-us': 'Remove',
    'ru-ru': 'Удалить',
  },
  search: {
    'en-us': 'Search',
    'ru-ru': 'Искать',
  },
  noResults: {
    'en-us': 'No Results',
    'ru-ru': 'Нет результатов',
  },
  notApplicable: {
    'en-us': 'N/A',
    'ru-ru': 'Н/Д',
  },
  new: {
    'en-us': 'New',
    'ru-ru': 'Новый',
  },
  edit: {
    'en-us': 'Edit',
    'ru-ru': 'Редактировать',
  },
  ignore: {
    'en-us': 'Ignore',
    'ru-ru': 'Игнорировать',
  },
  proceed: {
    'en-us': 'Proceed',
    'ru-ru': 'Продолжить',
  },
  start: {
    'en-us': 'Start',
    'ru-ru': 'Начало',
  },
  end: {
    'en-us': 'End',
    'ru-ru': 'Конец',
  },
  update: {
    'en-us': 'Update',
    'ru-ru': 'Обновить',
  },
  listTruncated: {
    'en-us': '(list truncated)',
    'ru-ru': '(список усечен)',
  },
  expand: {
    'en-us': 'Expand',
    'ru-ru': 'Расширить',
  },
  contract: {
    'en-us': 'Contract',
    'ru-ru': 'Свернуть',
  },
  fullDate: {
    'en-us': 'Full Date',
    'ru-ru': 'Полная дата',
  },
  view: {
    'en-us': 'View',
    'ru-ru': 'Смотреть',
  },
  opensInNewTab: {
    comment: 'Used in a hover-over message for links that open in new tab',
    'en-us': '(opens in a new tab)',
    'ru-ru': '(открывается в новой вкладке)',
  },
  goToHomepage: {
    'en-us': 'Go to Home Page',
    'ru-ru': 'Вернуться на Домашнюю Страницу',
  },
  actions: {
    'en-us': 'Actions',
    'ru-ru': 'Действия',
  },
  chooseCollection: {
    'en-us': 'Choose Collection',
    'ru-ru': 'Выбрать коллекцию',
  },
  ascending: {
    'en-us': 'Ascending',
    'ru-ru': 'По возрастанию',
  },
  descending: {
    'en-us': 'Descending',
    'ru-ru': 'По убыванию',
  },
  recordSets: {
    'en-us': 'Record Sets',
    'ru-ru': 'Наборы объектов',
  },
  recordCount: {
    'en-us': 'Record Count',
    'ru-ru': 'Количество объектов',
  },
  size: {
    'en-us': 'Size',
    'ru-ru': 'Размер',
  },
  running: {
    'en-us': 'Running…',
    'ru-ru': 'Выполнение…',
  },
  noMatches: {
    'en-us': 'No Matches',
    'ru-ru': 'Нет совпадений',
  },
  searchQuery: {
    'en-us': 'Search Query',
    'ru-ru': 'Поиск',
  },
  unknown: {
    'en-us': 'Unknown',
    'ru-ru': 'Неизвестно',
  },
  language: {
    'en-us': 'Language',
    'ru-ru': 'Язык',
  },
  country: {
    'en-us': 'Country',
    'ru-ru': 'Страна',
  },
  transactions: {
    'en-us': 'Transactions',
    'ru-ru': 'Транзакции',
  },
  viewRecord: {
    'en-us': 'View Record',
    'ru-ru': 'Открыть запись',
  },
  nullInline: {
    'en-us': '(null)',
    'ru-ru': '(нулевой)',
  },
  filePickerMessage: {
    comment: 'Generic. Could refer to any file',
    'en-us': 'Choose a file or drag it here',
    'ru-ru': 'Выберите файл или перетащите его сюда',
  },
  selectedFileName: {
    'en-us': 'Selected file',
    'ru-ru': 'Выбранный файл',
  },
  all: {
    'en-us': 'All',
    'ru-ru': 'Все',
  },
  unused: {
    'en-us': 'Unused',
    'ru-ru': 'Неиспользованные',
  },
  ordinal: {
    'en-us': 'Ordinal',
    'ru-ru': 'Порядковый номер',
  },
  export: {
    'en-us': 'Export',
    'ru-ru': 'Экспорт',
  },
  import: {
    'en-us': 'Import',
    'ru-ru': 'Импорт',
  },
  dismiss: {
    'en-us': 'Dismiss',
    'ru-ru': 'Отклонить',
  },
  id: {
    'en-us': 'ID',
    'ru-ru': 'ИД',
  },
  filter: {
    'en-us': 'Filter',
    'ru-ru': 'Фильтрировать',
  },
  results: {
    'en-us': 'Results',
    'ru-ru': 'Результаты',
  },
  downloadErrorMessage: {
    'en-us': 'Download Error Message',
    'ru-ru': 'Скачать ошибку',
  },
  copied: {
    'en-us': 'Copied!',
    'ru-ru': 'Скопировано!',
  },
  copyToClipboard: {
    'en-us': 'Copy to clipboard',
    'ru-ru': 'Скопировать в буфер обмена',
  },
  selected: {
    'en-us': 'Selected',
    'ru-ru': 'Выбрано',
  },
  primary: {
    'en-us': 'Primary',
    'ru-ru': 'Основной',
  },
  expandAll: {
    'en-us': 'Expand All',
    'ru-ru': 'Развернуть все',
  },
  collapseAll: {
    'en-us': 'Collapse All',
    'ru-ru': 'Свернуть все',
  },
  reset: {
    'en-us': 'Reset',
    'ru-ru': 'Сброс',
  },
  select: {
    'en-us': 'Select',
    'ru-ru': 'Выбрать',
  },
  none: {
    'en-us': 'None',
    'ru-ru': 'Никакой',
  },
  noneAvailable: {
    'en-us': 'None available',
    'ru-ru': 'Нет доступных вариантов',
  },
  countLine: {
    comment: 'Example usage: Record Sets (1,234)',
    'en-us': '{resource:string} ({count:number|formatted})',
    'ru-ru': '{resource:string} ({count:number|formatted})',
  },
  jsxCountLine: {
    comment: 'Example usage: Record Sets (1,234)',
    'en-us': '{resource:string} <wrap>({count:number|formatted})</wrap>',
    'ru-ru': '{resource:string} <wrap>({count:number|formatted})</wrap>',
  },
  colonLine: {
    comment: `
      Example usage: "Created by: Full Name" OR "Record Set: Record Set Name"
    `,
    'en-us': '{label:string}: {value:string}',
    'ru-ru': '{label:string}: {value:string}',
  },
  jsxColonLine: {
    comment: `
      Example usage: "Created by: Full Name" OR "Record Set: Record Set Name"
    `,
    'en-us': '{label:string}: <wrap />',
    'ru-ru': '{label:string}: <wrap />',
  },
} as const);
