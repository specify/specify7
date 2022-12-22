/**
 * Localization strings that are shared across components
 *
 * @module
 */

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

// REFACTOR: get rid of "exampleDialogText" in favor of just "example" ?
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
  tools: {
    'en-us': 'Tools',
    'ru-ru': 'Инструменты',
  },
  tool: {
    'en-us': 'Tool',
    'ru-ru': 'Инструмент',
  },
  loading: {
    'en-us': 'Loading...',
    'ru-ru': 'Загрузка...',
  },
  name: {
    'en-us': 'Name',
    'ru-ru': 'Имя',
  },
  created: {
    'en-us': 'Created',
    'ru-ru': 'Созданный',
  },
  uploaded: {
    'en-us': 'Uploaded',
    'ru-ru': 'Загружено',
  },
  createdBy: {
    'en-us': 'Created by:',
    'ru-ru': 'Создан:',
  },
  modifiedBy: {
    'en-us': 'Modified by:',
    'ru-ru': 'Модифицирован:',
  },
  stop: {
    'en-us': 'Stop',
    'ru-ru': 'Стоп',
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
  reports: {
    'en-us': 'Reports',
    'ru-ru': 'Отчеты',
  },
  labels: {
    'en-us': 'Labels',
    'ru-ru': 'Этикетки',
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
  logIn: {
    'en-us': 'Log In',
    'ru-ru': 'Авторизоваться',
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
  generate: {
    'en-us': 'Generate',
    'ru-ru': 'Генерировать',
  },
  listTruncated: {
    'en-us': '(list truncated)',
    'ru-ru': '(список усечен)',
  },
  metadataInline: {
    'en-us': 'Metadata:',
    'ru-ru': 'Метаданные:',
  },
  metadata: {
    'en-us': 'Metadata',
    'ru-ru': 'Метаданные',
  },
  query: {
    'en-us': 'Query',
    'ru-ru': 'Запрос',
  },
  unmapped: {
    'en-us': 'Unmapped',
    'ru-ru': 'Не сопоставлений',
  },
  mapped: {
    'en-us': 'Mapped',
    'ru-ru': 'Сопоставлений',
  },
  expand: {
    'en-us': 'Expand',
    'ru-ru': 'Расширить',
  },
  geoMap: {
    'en-us': 'GeoMap',
    'ru-ru': 'Карта',
  },
  geoMapProgress: {
    comment: 'Used in GeoMap title to indicate load progress',
    'en-us': 'GeoMap - {progress:string}',
    'ru-ru': 'Карта - {progress:string}',
  },
  fullDate: {
    'en-us': 'Full Date',
    'ru-ru': 'Полная дата',
  },
  fullName: {
    'en-us': 'Full Name',
    'ru-ru': 'Полное имя',
  },
  view: {
    'en-us': 'View',
    'ru-ru': 'Смотреть',
  },
  addChild: {
    'en-us': 'Add Child',
    'ru-ru': 'Добавить Ребенка',
  },
  move: {
    'en-us': 'Move',
    'ru-ru': 'Переместить',
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
  username: {
    'en-us': 'Username',
    'ru-ru': 'Имя пользователя',
  },
  password: {
    'en-us': 'Password',
    'ru-ru': 'Пароль',
  },
  login: {
    'en-us': 'Login',
    'ru-ru': 'Вход',
  },
  chooseCollection: {
    'en-us': 'Choose Collection',
    'ru-ru': 'Выбрать коллекцию',
  },
  attachments: {
    'en-us': 'Attachments',
    'ru-ru': 'Вложения',
  },
  interactions: {
    'en-us': 'Interactions',
    'ru-ru': 'Взаимодействия',
  },
  ascending: {
    'en-us': 'Ascending',
    'ru-ru': 'По возрастанию',
  },
  descending: {
    'en-us': 'Descending',
    'ru-ru': 'По убыванию',
  },
  queries: {
    'en-us': 'Queries',
    'ru-ru': 'Запросы',
  },
  recordSets: {
    'en-us': 'Record Sets',
    'ru-ru': 'Наборы объектов',
  },
  appResources: {
    'en-us': 'App Resources',
    'ru-ru': 'Ресурсы приложения',
  },
  formDefinitions: {
    'en-us': 'Form Definitions',
    'ru-ru': 'Определения форм',
  },
  trees: {
    'en-us': 'Trees',
    'ru-ru': 'Деревья',
  },
  recordCount: {
    'en-us': 'Record Count',
    'ru-ru': 'Количество объектов',
  },
  size: {
    'en-us': 'Size',
    'ru-ru': 'Размер',
  },
  workBench: {
    'en-us': 'WorkBench',
    'ru-ru': 'WorkBench',
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
  browseInForms: {
    'en-us': 'Browse in Forms',
    'ru-ru': 'Открыть записи',
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
  title: {
    'en-us': 'Title',
    'ru-ru': 'Надпись',
  },
  ordinal: {
    'en-us': 'Ordinal',
    'ru-ru': 'Порядковый номер',
  },
  administration: {
    'en-us': 'Administrative Tools',
    'ru-ru': 'Управления',
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
  scale: {
    'en-us': 'Scale',
    'ru-ru': 'Масштаб',
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
  forms: {
    'en-us': 'Forms',
    'ru-ru': 'Формы',
  },
  modified: {
    'en-us': 'Modified',
    'ru-ru': 'Изменено',
  },
  copyToClipboard: {
    'en-us': 'Copy to clipboard',
    'ru-ru': 'Скопировать в буфер обмена',
  },
  selected: {
    'en-us': 'Selected',
    'ru-ru': 'Выбрано',
  },
  quantity: {
    'en-us': 'Quantity',
    'ru-ru': 'Количество',
  },
  primary: {
    'en-us': 'Primary',
    'ru-ru': 'Основной',
  },
  formDefinition: {
    'en-us': 'Form Definition',
    'ru-ru': 'Схема формы',
  },
  expandAll: {
    'en-us': 'Expand All',
    'ru-ru': 'Развернуть все',
  },
  collapseAll: {
    'en-us': 'Collapse All',
    'ru-ru': 'Свернуть все',
  },
  moveUp: {
    'en-us': 'Move Up',
    'ru-ru': 'Переместить вверх',
  },
  moveDown: {
    'en-us': 'Move Down',
    'ru-ru': 'Переместить вниз',
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
} as const);
