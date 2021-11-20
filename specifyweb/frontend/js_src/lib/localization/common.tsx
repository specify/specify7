import React from 'react';

import { createDictionary, createHeader, createJsxHeader } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

const commonText = createDictionary({
  specifySeven: {
    'en-us': 'Specify&nbsp7',
    'ru-ru': 'Specify&nbsp7',
  },
  pageNotFound: {
    'en-us': 'Page Not Found',
    'ru-ru': 'Страница не найдена',
  },
  collectionAccessDeniedDialogTitle: {
    'en-us': 'Access denied',
    'ru-ru': 'Доступ отказано',
  },
  collectionAccessDeniedDialogHeader: {
    'en-us': createHeader('You do not have access to this collection'),
    'ru-ru': createHeader('У вас нет доступа к этой коллекции'),
  },
  collectionAccessDeniedDialogMessage: {
    'en-us': (collectionName: string) =>
      `The currently logged in account does not have access to the
       ${collectionName} collection.`,
    'ru-ru': (collectionName: string) =>
      `Учетная запись, вошедшая в систему в данный момент, не имеет доступа к
       коллекции ${collectionName}.`,
  },
  noAgentDialogTitle: {
    'en-us': 'No Agent assigned',
  },
  noAgentDialogHeader: {
    'en-us': createHeader(
      'Current user does not have an agent assigned'
    ),
  },
  noAgentDialogMessage: {
    'en-us': 'Please log in as admin and assign an agent to this user',
  },
  no: {
    'en-us': 'No',
    'ru-ru': 'Нет',
  },
  cancel: {
    'en-us': 'Cancel',
    'ru-ru': 'Отмена',
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
  loading: {
    'en-us': 'Loading...',
    'ru-ru': 'Загрузка...',
  },
  tableName: {
    'en-us': 'Table Name',
    'ru-ru': 'Имя таблицы',
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
  notFound: {
    'en-us': 'Not found',
    'ru-ru': 'Не найден',
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
  loadingInline: {
    'en-us': '(loading...)',
    'ru-ru': '(загрузка...)',
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
  fullDate: {
    'en-us': 'Full Date',
    'ru-ru': 'Полная дата',
  },
  year: {
    'en-us': 'Year',
    'ru-ru': 'Год',
  },
  month: {
    'en-us': 'Month',
    'ru-ru': 'Месяц',
  },
  day: {
    'en-us': 'Day',
    'ru-ru': 'День',
  },
  view: {
    'en-us': 'View',
    'ru-ru': 'Смотреть',
  },
  addChild: {
    'en-us': 'Add child',
    'ru-ru': 'Добавить ребенка',
  },
  move: {
    'en-us': 'Move',
    'ru-ru': 'Переместить',
  },
  opensInNewTab: {
    'en-us': '(opens in a new tab)',
    'ru-ru': '(открывается в новой вкладке)',
  },

  // Toolbar
  notifications: {
    'en-us': (count: number) => `Notifications: ${count}`,
    'ru-ru': (count: number) => `Уведомлений: ${count}`,
  },
  attachments: {
    'en-us': 'Attachments',
    'ru-ru': 'Вложения',
  },
  dataEntry: {
    'en-us': 'Data Entry',
    'ru-ru': 'Ввод данных',
  },
  makeDwca: {
    'en-us': 'Make DwCA',
    'ru-ru': 'Создать DwCA',
  },
  definitionResourceNotFound: {
    'en-us': (resourceName: string) =>
      `Definition resource "${resourceName}" was not found.`,
    'ru-ru': (resourceName: string) =>
      `Ресурс определения "${resourceName}" не найден.`,
  },
  metadataResourceNotFound: {
    'en-us': (resourceName: string) =>
      `Metadata resource "${resourceName}" was not found.`,
    'ru-ru': (resourceName: string) =>
      `Ресурс метаданных "${resourceName}" не найден.`,
  },
  updateExportFeed: {
    'en-us': 'Update Feed Now',
    'ru-ru': 'Обновить фид сейчас',
  },
  updateExportFeedDialogTitle: {
    'en-us': 'Export Feed',
    'ru-ru': 'Экспорт фида',
  },
  updateExportFeedDialogHeader: {
    'en-us': createHeader('Update all export feed items now?'),
    'ru-ru': createHeader('Обновить все элементы фида экспорта сейчас?'),
  },
  updateExportFeedDialogMessage: {
    'en-us': 'Update all export feed items now?',
    'ru-ru': 'Обновить все элементы фида экспорта сейчас?',
  },
  feedExportStartedDialogTitle: {
    'en-us': 'Export Feed',
    'ru-ru': 'Экспорт фида',
  },
  feedExportStartedDialogHeader: {
    'en-us': createHeader('Export feed update started'),
    'ru-ru': createHeader('Начато обновление экспортного фида'),
  },
  feedExportStartedDialogMessage: {
    'en-us': `
      Update started. You will receive a notification for each feed item
      updated.`,
    'ru-ru': `
      Обновление началось. Вы получите уведомление о каждом элементе фида`,
  },
  dwcaExportStartedDialogTitle: {
    'en-us': 'DwCA',
    'ru-ru': 'DwCA',
  },
  dwcaExportStartedDialogHeader: {
    'en-us': createHeader('DwCA export started'),
    'ru-ru': createHeader('DwCA экспорт начат'),
  },
  dwcaExportStartedDialogMessage: {
    'en-us': `
      Export started. You will receive a notification
      when the export is complete.`,
    'ru-ru': `
      Экспорт начат. Вы получите уведомление когда экспорт будет завершен.`,
  },
  interactions: {
    'en-us': 'Interactions',
    'ru-ru': 'Взаимодействия',
  },
  generateMasterKey: {
    'en-us': 'Generate Master Key',
    'ru-ru': 'Сгенерировать мастер-ключ',
  },
  generateMasterKeyDialogTitle: {
    'en-us': 'Master Key',
    'ru-ru': 'Мастер ключ',
  },
  generateMasterKeyDialogHeader: {
    'en-us': createHeader('Generate Master Key'),
    'ru-ru': createHeader('Сгенерировать мастер-ключ'),
  },
  userPassword: {
    'en-us': 'User Password:',
    'ru-ru': 'Пользовательский пароль:',
  },
  masterKeyDialogTitle: {
    'en-us': 'Master Key',
    'ru-ru': 'Мастер ключ',
  },
  masterKeyDialogHeader: {
    'en-us': createHeader('Master key generated'),
    'ru-ru': createHeader('Мастер-ключ создан'),
  },
  masterKeyFieldLabel: {
    'en-us': 'Master Key:',
    'ru-ru': 'Мастер ключ:',
  },
  incorrectPassword: {
    'en-us': 'Password was incorrect.',
    'ru-ru': 'Пароль неверный.',
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
  queriesDialogTitle: {
    'en-us': (count: number) => `Queries (${count})`,
    'ru-ru': (count: number) => `Запросы (${count})`,
  },
  newQueryDialogTitle: {
    'en-us': 'New Query Type',
    'ru-ru': 'Новый запрос',
  },
  exportQueryForDwca: {
    'en-us': 'Export query for DwCA definition.',
    'ru-ru': 'Экспорт запрос для DwCA.',
  },
  exportQueryForDwcaDialogTitle: {
    'en-us': 'Query XML for DwCA definition',
    'ru-ru': 'XML Запроса для определения DwCA',
  },
  exportQueryForDwcaDialogHeader: {
    'en-us': createHeader('Query XML for DwCA definition'),
    'ru-ru': createHeader('XML Запроса для определения DwCA'),
  },
  exportQueryAsReport: {
    'en-us': 'Define report based on query.',
    'ru-ru': 'Определите отчет на основе запроса.',
  },
  exportQueryAsLabel: {
    'en-us': 'Define label based on query.',
    'ru-ru': 'Определите метку на основе запроса.',
  },
  newResourceTitle: {
    'en-us': (resourceName: string) => `New ${resourceName}`,
    'ru-ru': (resourceName: string) => `Новый ${resourceName}`,
  },
  labelName: {
    'en-us': 'Label Name',
    'ru-ru': 'Название ярлыка',
  },
  reportName: {
    'en-us': 'Report Name',
    'ru-ru': 'Название отчета',
  },
  createLabelDialogTitle: {
    'en-us': 'Labels',
    'ru-ru': 'Этикетки',
  },
  createLabelDialogHeader: {
    'en-us': createHeader('Create new label'),
    'ru-ru': createHeader('Создать новую этикетку'),
  },
  createReportDialogTitle: {
    'en-us': 'Reports',
    'ru-ru': 'Отчеты',
  },
  createReportDialogHeader: {
    'en-us': createHeader('Create new report'),
    'ru-ru': createHeader('Создать новый отчет'),
  },
  recordSets: {
    'en-us': 'Record Sets',
    'ru-ru': 'Наборы объектов',
  },
  resources: {
    'en-us': 'Resources',
    'ru-ru': 'Ресурсы',
  },
  appResources: {
    'en-us': 'App Resources',
    'ru-ru': 'Ресурсы приложения',
  },
  viewSets: {
    'en-us': 'View Sets',
    'ru-ru': 'Ресурсы для просмотров',
  },
  resourcesDialogTitle: {
    'en-us': 'Resources',
    'ru-ru': 'Ресурсы',
  },
  resourcesDialogHeader: {
    'en-us': createHeader('Choose the resource type you wish to edit:'),
    'ru-ru': createHeader(
      'Выберите тип ресурса, который хотите отредактировать:'
    ),
  },
  repairTree: {
    'en-us': 'Repair Tree',
    'ru-ru': 'Ремонтировать дерево',
  },
  trees: {
    'en-us': 'Trees',
    'ru-ru': 'Деревья',
  },
  treesDialogTitle: {
    'en-us': 'Trees',
    'ru-ru': 'Деревья',
  },
  recordSet: {
    'en-us': 'Record Set',
    'ru-ru': 'Набор объектов',
  },
  recordCount: {
    'en-us': 'Record Count',
    'ru-ru': 'Количество объектов',
  },
  size: {
    'en-us': 'Size',
    'ru-ru': 'Размер',
  },
  manageUsers: {
    'en-us': 'Manage Users',
    'ru-ru': 'Управление пользователями',
  },
  manageUsersDialogTitle: {
    'en-us': 'Manage Users',
    'ru-ru': 'Управление пользователями',
  },
  query: {
    'en-us': 'Query',
    'ru-ru': 'Запрос',
  },
  workbench: {
    'en-us': 'WorkBench',
    'ru-ru': 'WorkBench',
  },
  chooseDwcaDialogTitle: {
    'en-us': 'Choose DwCA',
    'ru-ru': 'Выберите DwCA',
  },
  dwcaDefinition: {
    'en-us': 'DwCA definition:',
    'ru-ru': 'Определение DwCA:',
  },
  metadataResource: {
    'en-us': 'Metadata resource:',
    'ru-ru': 'Ресурс метаданных:',
  },
  // Error Boundary
  errorBoundaryDialogTitle: {
    'en-us': 'Unexpected Error',
    'ru-ru': 'Неожиданная ошибка',
  },
  errorBoundaryDialogHeader: {
    'en-us': createJsxHeader('An unexpected error has occurred'),
    'ru-ru': createJsxHeader('Произошла неожиданная ошибка'),
  },
  errorBoundaryDialogMessage: {
    'en-us': (
      <>
        Please reload the page and try again.
        <br />
        If this issue persists, please contact your IT support or if this is a
        Specify Cloud database, contact
        <a href="mailto:support@specifysoftware.org">
          support@specifysoftware.org
        </a>
      </>
    ),
    'ru-ru': (
      <>
        Пожалуйста, обновите страницу и попробуйте еще раз.
        <br />
        Если проблема не исчезнет, обратитесь в вашу IT службу поддержки или
        свяжитесь с нами:
        <a href="mailto:support@specifysoftware.org">
          support@specifysoftware.org
        </a>
      </>
    ),
  },
  backEndErrorDialogTitle: {
    'en-us': 'Server Error',
    'ru-ru': 'Ошибка на сервере',
  },
  backEndErrorDialogHeader: {
    'en-us': createHeader(
      'An error occurred communicating with the Specify 7 server.'
    ),
    'ru-ru': createHeader('Произошла ошибка связи с сервером Specify 7.'),
  },
  backEndErrorDialogMessage: {
    'en-us': `
      Please reload the page and try again.<br>
      If the issue persists, please contact your IT support, or if this is
      a Specify Cloud database, contact
      <a href="mailto:support@specifysoftware.org">
        support@specifysoftware.org
      </a>.`,
    'ru-ru': (
      <>
        Пожалуйста, обновите страницу и попробуйте еще раз.
        <br />
        Если проблема не исчезнет, обратитесь в вашу IT службу поддержки или
        свяжитесь с нами:
        <a href="mailto:support@specifysoftware.org">
          support@specifysoftware.org
        </a>
      </>
    ),
  },
  // Search
  expressSearch: {
    'en-us': 'Express Search',
    'ru-ru': 'Экспресс поиск',
  },
  primarySearch: {
    'en-us': 'Primary Search',
    'ru-ru': 'Первичный поиск',
  },
  secondarySearch: {
    'en-us': 'Secondary Search',
    'ru-ru': 'Вторичный поиск',
  },
  running: {
    'en-us': 'Running...',
    'ru-ru': 'Выполнение...',
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
    'ru-ru': 'Неизвестный',
  },
  // Unload Protection
  leavePageDialogTitle: {
    'en-us': 'Unsaved changes detected',
    'ru-ru': 'Обнаружены несохраненные изменения',
  },
  leavePageDialogHeader: {
    'en-us': createHeader('Are you sure you want to leave this page?'),
    'ru-ru': createHeader('Вы уверены, что хотите покинуть эту страницу?'),
  },
  leave: {
    'en-us': 'Leave',
    'ru-ru': 'Покинуть',
  },
  // Notifications
  notificationsDialogTitle: {
    'en-us': 'Notifications',
    'ru-ru': 'Уведомления',
  },
  feedItemUpdated: {
    'en-us': 'Export feed item updated.',
    'ru-ru': 'Элемент фида экспорта обновлен.',
  },
  updateFeedFailed: {
    'en-us': 'Export feed update failed.',
    'ru-ru': 'Не удалось обновить экспортный канал.',
  },
  exception: {
    'en-us': 'Exception',
    'ru-ru': 'Трассировка стека',
  },
  download: {
    'en-us': 'Download',
    'ru-ru': 'Скачать',
  },
  dwcaExportCompleted: {
    'en-us': 'DwCA export completed.',
    'ru-ru': 'Экспорт в DwCA завершен.',
  },
  dwcaExportFailed: {
    'en-us': 'DwCA export failed.',
    'ru-ru': 'Не удалось экспортировать DwCA.',
  },
  queryExportToCsvCompleted: {
    'en-us': 'Query export to CSV completed.',
    'ru-ru': 'Экспорт запроса в CSV завершен.',
  },
  queryExportToKmlCompleted: {
    'en-us': 'Query export to KML completed.',
    'ru-ru': 'Экспорт запроса в KML завершен.',
  },
  dataSetOwnershipTransferred: {
    'en-us': (userName: string, dataSetName: string) => `
      ${userName} transferred the ownership of the ${dataSetName} dataset
      to you.`,
    'ru-ru': (userName: string, dataSetName: string) => `
      ${userName} передал вам право собственности на набор данных
      ${dataSetName}.`,
  },
  // OtherCollectionView
  noAccessToResource: {
    'en-us': `
      You do not have access to any collection containing this resource
      through the currently logged in account`,
    'ru-ru': `
      У вас нет доступа ни к одной коллекции, содержащей этот ресурс
      через текущую учетную запись`,
  },
  resourceInaccessible: {
    'en-us': `
      The requested resource cannot be accessed while logged into the
      current collection.`,
    'ru-ru': `
      Запрошенный ресурс недоступен в текущей коллекция.`,
  },
  selectCollection: {
    'en-us': 'Select one of the following collections:',
    'ru-ru': 'Выберите одну из следующих коллекций:',
  },
  collection: {
    'en-us': 'Collection',
    'ru-ru': 'Коллекция',
  },
  loginToProceed: {
    'en-us': (collectionName: string) => `
       You can login to the collection, ${collectionName}, to proceed:`,
    'ru-ru': (collectionName: string) => `
       Вы можете войти в коллекцию, ${collectionName}, чтобы продолжить:`,
  },
  // SpecifyApp
  versionMismatchDialogTitle: {
    'en-us': 'Version Mismatch',
    'ru-ru': 'Несоответствие версий',
  },
  versionMismatchDialogHeader: {
    'en-us': createHeader('Specify version does not match database version'),
    'ru-ru': createHeader('Specify версия не соответствует версии базы данных'),
  },
  versionMismatchDialogMessage: {
    'en-us': (specifySixVersion: string, databaseVersion: string) => `
      The Specify version ${specifySixVersion} does not match the database
      version ${databaseVersion}.`,
    'ru-ru': (specifySixVersion: string, databaseVersion: string) => `
      Specify версия ${specifySixVersion} не соответствует версии базы
      данных ${databaseVersion}.`,
  },
  versionMismatchSecondDialogMessage: {
    'en-us':
      'Some features of Specify 7 may therefore fail to operate correctly.',
    'ru-ru': 'Поэтому некоторые функции Specify 7 могут неработать.',
  },
  resourceDeletedDialogTitle: {
    'en-us': 'Deleted',
    'ru-ru': 'Удалено',
  },
  resourceDeletedDialogHeader: {
    'en-us': createHeader('Item deleted'),
    'ru-ru': createHeader('Удалено'),
  },
  resourceDeletedDialogMessage: {
    'en-us': 'Item was deleted successfully.',
    'ru-ru': 'Успешно удален.',
  },
  appTitle: {
    'en-us': (baseTitle: string) => `${baseTitle} | Specify 7`,
    'ru-ru': (baseTitle: string) => `${baseTitle} | Specify 7`,
  },
  // StartApp
  sessionTimeOutDialogTitle: {
    'en-us': 'Access denied',
    'ru-ru': 'Доступе Отказано',
  },
  sessionTimeOutDialogHeader: {
    'en-us': createHeader('Insufficient Privileges'),
    'ru-ru': createHeader('Insufficient Privileges'),
  },
  sessionTimeOutDialogMessage: {
    'en-us': `
      You lack sufficient privileges for that action, or your current
      session has been logged out.`,
    'ru-ru': `
      У вас недостаточно прав для этого действия, или текещий сеанс был
      отключен..`,
  },
  // UserTools
  logOut: {
    'en-us': 'Log out',
    'ru-ru': 'Выйти',
  },
  changePassword: {
    'en-us': 'Change password',
    'ru-ru': 'Изменить пароль',
  },
  userToolsDialogTitle: {
    'en-us': 'User Tools',
    'ru-ru': 'Инструменты',
  },
  language: {
    'en-us': 'Language:',
    'ru-ru': 'Язык:',
  },
  changeLanguage: {
    'en-us': 'Change Language',
    'ru-ru': 'Изменить язык',
  }
});

export default commonText;
