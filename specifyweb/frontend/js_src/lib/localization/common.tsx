/**
 * Localization strings that are shared across components or that are used
 * in the Header or UserTools menu
 *
 * @module
 */

import React from 'react';

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

/* eslint-disable react/jsx-no-literals */
/* eslint-disable @typescript-eslint/naming-convention */
// REFACTOR: get rid of "exampleDialogText" in favor of just "example" ?
export const commonText = createDictionary({
  specifySeven: {
    'en-us': 'Specify 7',
    'ru-ru': 'Specify 7',
  },
  pageNotFound: {
    'en-us': 'Page Not Found',
    'ru-ru': 'Страница не найдена',
  },
  nothingWasFound: {
    'en-us': 'Oops! Nothing was found',
    'ru-ru': 'Ой! Ничего не найдено',
  },
  pageNotFoundDescription: {
    'en-us': `
      The page you are looking for might have been removed, had its name changed
      or is temporarily unavailable.`,
    'ru-ru': `
      Возможно, страница, которую вы ищете, была удалена, ее название изменилось
      или она временно недоступна.`,
  },
  returnToHomepage: {
    'en-us': 'Return to homepage',
    'ru-ru': 'Вернуться на главную страницу',
  },
  collectionAccessDenied: {
    'en-us': 'You do not have access to this collection',
    'ru-ru': 'У вас нет доступа к этой коллекции',
  },
  collectionAccessDeniedDescription: {
    'en-us': (collectionName: string) =>
      `The currently logged in account does not have access to the
       ${collectionName} collection.`,
    'ru-ru': (collectionName: string) =>
      `Учетная запись, вошедшая в систему в данный момент, не имеет доступа к
       коллекции ${collectionName}.`,
  },
  noAgent: {
    'en-us': 'Current user does not have an agent assigned',
    'ru-ru': 'Текущему пользователю не назначен агент',
  },
  noAgentDescription: {
    'en-us': 'Please log in as admin and assign an agent to this user',
    'ru-ru':
      'Пожалуйста, войдите как администратор и назначьте агента этому пользователю',
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
  tableInline: {
    'en-us': 'Table:',
    'ru-ru': 'Таблица:',
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
    'en-us': '(opens in a new tab)',
    'ru-ru': '(открывается в новой вкладке)',
  },

  // Toolbar
  skipToContent: {
    'en-us': 'Skip to Content',
    'ru-ru': 'Перейти к содержанию',
  },
  goToHomepage: {
    'en-us': 'Go to Home Page',
    'ru-ru': 'Вернуться на Домашнюю Страницу',
  },
  currentUser: {
    'en-us': 'Current User',
    'ru-ru': 'Текущий пользователь',
  },
  currentCollection: {
    'en-us': 'Current Collection',
    'ru-ru': 'Текущая коллекция',
  },
  actions: {
    'en-us': 'Actions',
    'ru-ru': 'Действия',
  },

  // Login screen
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
  helloMessage: {
    'en-us': (userName: string) => `Hello, ${userName}!`,
    'ru-ru': (userName: string) => `Привет, ${userName}!`,
  },
  oicWelcomeMessage: {
    'en-us': `
      You've been invited to associate an external login to
      your Specify user account. This will enable you to log in to Specify with
      your chosen provider going forward.
    `,
    'ru-ru': `
      Вам было предложено связать внешний логин с вашей учетной записью
      пользователя Specify. Это позволит вам войти в Specify с выбранным вами
      провайдером в будущем.
    `,
  },
  legacyLogin: {
    'en-us': 'Sign in with Specify Account',
    'ru-ru': 'Войти с помощью Профиля Specify',
  },
  unknownOicUser: {
    'en-us': (providerName: string) => `There is currently no Specify user
      associated with your ${providerName} account. If you have a Specify user
      name and password, you can enter them below to associate that user with
      your ${providerName} account for future logins.
    `,
    'ru-ru': (providerName: string) => `В настоящее время нет пользователя
      Specify, связанного с вашей учетной записью ${providerName}. Если у вас
      есть Specify имя пользователя и пароль, вы можете ввести их ниже, чтобы
      связать этого пользователя с вашей учетной записью ${providerName} для
      будущих входов в систему.
    `,
  },

  // Choose Collection
  chooseCollection: {
    'en-us': 'Collection Choice',
    'ru-ru': 'Выбрать коллекцию',
  },
  noAccessToCollections: {
    'en-us': `
      The logged in user has not been given access to any collections in this
      database. You must login as another user.
    `,
    'ru-ru': `
      Пользователь, вошедший в систему, не получил доступа ни к каким
      коллекциям в этой базе данных. Вы должны войти в систему как другой
      пользователь.
    `,
  },

  // Change Password
  changePassword: {
    'en-us': 'Change Password',
    'ru-ru': 'Изменить пароль',
  },
  oldPassword: {
    'en-us': 'Old password',
    'ru-ru': 'Предыдущий пароль',
  },
  newPassword: {
    'en-us': 'New password',
    'ru-ru': 'iНовый пароль',
  },
  repeatPassword: {
    'en-us': 'Repeat new password',
    'ru-ru': 'Повторите новый пароль',
  },

  // Menu Bar & User Tools
  notifications: {
    'en-us': (count: number | string) => `Notifications: ${count}`,
    'ru-ru': (count: number | string) => `Уведомлений: ${count}`,
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
    'en-us': 'Create DwC Archive',
    'ru-ru': 'Создать DwC архив',
  },
  updateExportFeed: {
    'en-us': 'Update RSS Feed',
    'ru-ru': 'Обновить RSS фид',
  },
  updateExportFeedDialogTitle: {
    'en-us': 'Update export feed?',
    'ru-ru': 'Обновить все элементы фида экспорта сейчас?',
  },
  updateExportFeedDialogText: {
    'en-us': 'Update all RSS export feed items now?',
    'ru-ru': 'Обновить все элементы RSS фида экспорта сейчас?',
  },
  feedExportStartedDialogHeader: {
    'en-us': 'Export feed update started',
    'ru-ru': 'Начато обновление экспортного фида',
  },
  feedExportStartedDialogText: {
    'en-us': `
      Update started. You will receive a notification for each feed item
      updated.`,
    'ru-ru': `
      Обновление началось. Вы получите уведомление о каждом элементе фида`,
  },
  dwcaExportStartedDialogHeader: {
    'en-us': 'DwCA export started',
    'ru-ru': 'DwCA экспорт начат',
  },
  dwcaExportStartedDialogText: {
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
  userPassword: {
    'en-us': 'User Password:',
    'ru-ru': 'Пользовательский пароль:',
  },
  masterKeyDialogHeader: {
    'en-us': 'Master key generated',
    'ru-ru': 'Мастер-ключ создан',
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
  createLabelDialogHeader: {
    'en-us': 'Create new label',
    'ru-ru': 'Создать новую этикетку',
  },
  createReportDialogHeader: {
    'en-us': 'Create new report',
    'ru-ru': 'Создать новый отчет',
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
  repairTree: {
    'en-us': 'Repair Tree',
    'ru-ru': 'Ремонтировать дерево',
  },
  treeRepairComplete: {
    'en-us': 'Tree repair is complete.',
    'ru-ru': 'Ремонт дерева завершен.',
  },
  trees: {
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
  workBench: {
    'en-us': 'WorkBench',
    'ru-ru': 'WorkBench',
  },
  chooseDwcaDialogTitle: {
    'en-us': 'Choose DwCA',
    'ru-ru': 'Выберите DwCA',
  },
  chooseMetadataResource: {
    'en-us': 'Choose Metadata resource',
    'ru-ru': 'Выберите Ресурс метаданных',
  },
  // Error Boundary
  errorBoundaryDialogHeader: {
    'en-us': "Sorry, something's gone a bit wrong",
    'ru-ru': 'Произошла неожиданная ошибка',
  },
  errorBoundaryDialogText: {
    'en-us': `We're sorry, it seems you have encountered an error in Specify 7
      that we may not be aware of.`,
    'ru-ru': `Произошла неисправимая ошибка, которая не позволит нам безопасно
      вернуться к вашему текущему окну.`,
  },
  errorBoundaryCriticalDialogText: {
    'en-us': `To avoid corrupting data records, we need to start again from a
      safe spot--the Home page.`,
    'ru-ru': `Чтобы избежать повреждения записей данных, нам нужно начать
      заново с безопасного места — домашней страницы.`,
  },
  errorBoundaryDialogSecondMessage: {
    'en-us': (
      email: JSX.Element,
      memberLink: (label: string) => JSX.Element,
      discourseLink: (label: string) => JSX.Element
    ) => (
      <>
        If this issue persists, please contact your IT support or if this is a
        Specify Cloud database, contact {email}
        <br />
        <br />
        Users from {memberLink('member institutions')} can search for answered
        questions and ask for help on our {discourseLink('Community Forum')}.
      </>
    ),
    'ru-ru': (
      email: JSX.Element,
      memberLink: (label: string) => JSX.Element,
      discourseLink: (label: string) => JSX.Element
    ) => (
      <>
        Если проблема не исчезнет, обратитесь в вашу IT службу поддержки или
        свяжитесь с нами: {email}
        <br />
        <br />
        Пользователи из {memberLink('учреждений Консорциума')} могут искать
        ответы на вопросы и обращаться за помощью на нашем
        {discourseLink('форуме')}.
      </>
    ),
  },
  errorMessage: {
    'en-us': 'Error Message',
    'ru-ru': 'Описание ошибки',
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
    'ru-ru': 'Неизвестно',
  },
  // Unload Protection
  leavePageDialogHeader: {
    'en-us': 'Are you sure you want to leave this page?',
    'ru-ru': 'Вы уверены, что хотите покинуть эту страницу?',
  },
  leavePageDialogText: {
    'en-us': 'Unsaved changes would be lost if your leave this page.',
    'ru-ru':
      'Несохраненные изменения будут потеряны, если вы покинете эту страницу.',
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
    'en-us': 'RSS Export feed has been updated.',
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
    'en-us': (userName: JSX.Element, dataSetName: JSX.Element) => (
      <>
        {userName} transferred the ownership of the {dataSetName} dataset to
        you.
      </>
    ),
    'ru-ru': (userName: JSX.Element, dataSetName: JSX.Element) => (
      <>
        {userName} передал вам право собственности на набор данных {dataSetName}
        .
      </>
    ),
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
  loginToProceed: {
    'en-us': 'You can login to the collection, to proceed:',
    'ru-ru': 'Вы можете войти в коллекцию, чтобы продолжить:',
  },
  // SpecifyApp
  versionMismatchDialogHeader: {
    'en-us': 'Specify version does not match database version',
    'ru-ru': 'Specify версия не соответствует версии базы данных',
  },
  versionMismatchDialogText: {
    'en-us': (specifySixVersion: string, databaseVersion: string) => `
      The Specify version ${specifySixVersion} does not match the database
      version ${databaseVersion}.`,
    'ru-ru': (specifySixVersion: string, databaseVersion: string) => `
      Specify версия ${specifySixVersion} не соответствует версии базы
      данных ${databaseVersion}.`,
  },
  versionMismatchSecondDialogText: {
    'en-us':
      'Some features of Specify 7 may therefore fail to operate correctly.',
    'ru-ru': 'Поэтому некоторые функции Specify 7 могут неработать.',
  },
  versionMismatchThirdDialogText: {
    'en-us': 'Instructions for resolving Specify schema mismatch',
    'ru-ru': 'Инструкции по устранению несоответствия схемы Specify',
  },
  resourceDeletedDialogHeader: {
    'en-us': 'Item deleted',
    'ru-ru': 'Удалено',
  },
  resourceDeletedDialogText: {
    'en-us': 'Item was deleted successfully.',
    'ru-ru': 'Успешно удален.',
  },
  appTitle: {
    'en-us': (baseTitle: string) => `${baseTitle} | Specify 7`,
    'ru-ru': (baseTitle: string) => `${baseTitle} | Specify 7`,
  },
  baseAppTitle: {
    'en-us': 'Specify 7',
    'ru-ru': 'Specify 7',
  },
  // StartApp
  sessionTimeOutDialogHeader: {
    'en-us': 'Insufficient Privileges',
    'ru-ru': 'Insufficient Privileges',
  },
  sessionTimeOutDialogText: {
    'en-us': `
      You lack sufficient privileges for that action, or your current
      session has been logged out.`,
    'ru-ru': `
      У вас недостаточно прав для этого действия, или текещий сеанс был
      отключен.`,
  },
  // UserTools
  logOut: {
    'en-us': 'Log Out',
    'ru-ru': 'Выйти',
  },
  userToolsDialogTitle: {
    'en-us': 'User Tools',
    'ru-ru': 'Инструменты',
  },
  language: {
    'en-us': 'Language:',
    'ru-ru': 'Язык:',
  },
  helpLocalizeSpecify: {
    'en-us': 'Help Localize Specify 7',
    'ru-ru': 'Помогти локализовать Specify 7',
  },
  helpLocalizeSpecifyDialogText: {
    'en-us': (emailLink: JSX.Element) => (
      <>
        We would be very grateful for your support localizing Specify 7 User
        Interface. If you are interested, please send an email to {emailLink}
      </>
    ),
    'ru-ru': (emailLink: JSX.Element) => (
      <>
        Мы будем очень благодарны за вашу поддержку в локализации
        пользовательский интерфейс Specify 7. Если вы заинтересованы,
        пожалуйста, отправьте письмо по адресу {emailLink}
      </>
    ),
  },
  schemaConfig: {
    'en-us': 'Schema Config',
    'ru-ru': 'Конфигурация схемы',
  },
  unsavedSchemaUnloadProtect: {
    'en-us': 'Schema changes have not been saved',
    'ru-ru': 'Изменения схемы не сохранены',
  },

  // Schema Config
  changeBaseTable: {
    'en-us': 'Change Base Table',
    'ru-ru': 'Изменить базовую таблицу',
  },
  fields: {
    'en-us': 'Fields',
    'ru-ru': 'Поля',
  },
  field: {
    'en-us': 'Field',
    'ru-ru': 'Поле',
  },
  relationships: {
    'en-us': 'Relationships',
    'ru-ru': 'Отношения',
  },
  caption: {
    'en-us': 'Caption',
    'ru-ru': 'Подпись',
  },
  description: {
    'en-us': 'Description',
    'ru-ru': 'Описание',
  },
  hideTable: {
    'en-us': 'Hide Table',
    'ru-ru': 'Скрыть таблицу',
  },
  hideField: {
    'en-us': 'Hide Field',
    'ru-ru': 'Скрыть поле',
  },
  tableFormat: {
    'en-us': 'Table Format',
    'ru-ru': 'Формат таблицы',
  },
  tableAggregation: {
    'en-us': 'Table Aggregation',
    'ru-ru': 'Агрегация таблиц',
  },
  type: {
    'en-us': 'Type',
    'ru-ru': 'Тип',
  },
  oneToOne: {
    'en-us': 'One-to-one',
    'ru-ru': 'Один к одному',
  },
  oneToMany: {
    'en-us': 'One-to-many',
    'ru-ru': 'Один ко многим',
  },
  manyToOne: {
    'en-us': 'Many-to-one',
    'ru-ru': 'Многие к одному',
  },
  manyToMany: {
    'en-us': 'many-to-many',
    'ru-ru': 'Многие-ко-многим',
  },
  length: {
    'en-us': 'Length',
    'ru-ru': 'Длина',
  },
  readOnly: {
    'en-us': 'Read-only',
    'ru-ru': 'Только чтение',
  },
  required: {
    'en-us': 'Required',
    'ru-ru': 'Необходимый',
  },
  fieldFormat: {
    'en-us': 'Field Format',
    'ru-ru': 'Формат поля',
  },
  none: {
    'en-us': 'None',
    'ru-ru': 'Никакой',
  },
  noneAvailable: {
    'en-us': 'None available',
    'ru-ru': 'Нет доступных вариантов',
  },
  formatted: {
    'en-us': 'Formatted',
    'ru-ru': 'Форматирован',
  },
  webLink: {
    'en-us': 'Web Link',
    'ru-ru': 'Интернет-ссылка',
  },
  pickList: {
    'en-us': 'Pick List',
    'ru-ru': 'Список выбора',
  },
  system: {
    'en-us': 'System',
    'ru-ru': 'Системное',
  },
  userDefined: {
    'en-us': 'User Defined',
    'ru-ru': 'Создано пользователем',
  },
  addLanguage: {
    'en-us': 'Add Language',
    'ru-ru': 'Добавить язык',
  },
  addLanguageDialogHeader: {
    'en-us': 'Add new language',
    'ru-ru': 'Добавить новый язык',
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
  preferences: {
    'en-us': 'Preferences',
    'ru-ru': 'Настройки',
  },
  nullInline: {
    'en-us': '(null)',
    'ru-ru': '(нулевой)',
  },
  filePickerMessage: {
    'en-us': 'Choose a file or drag it here',
    'ru-ru': 'Выберите файл или перетащите его сюда',
  },
  selectedFileName: {
    'en-us': (fileName: string) => `Selected file: ${fileName}`,
    'ru-ru': (fileName: string) => `Выбранный файл: ${fileName}`,
  },
  all: {
    'en-us': 'All',
    'ru-ru': 'Все',
  },
  unused: {
    'en-us': 'Unused',
    'ru-ru': 'Неиспользованные',
  },
  tables: {
    'en-us': 'Tables',
    'ru-ru': 'Таблицы',
  },
  label: {
    'en-us': 'Label',
    'ru-ru': 'Локализованный',
  },
  hidden: {
    'en-us': 'Hidden',
    'ru-ru': 'Скрытый',
  },
  databaseColumn: {
    'en-us': 'Database Column',
    'ru-ru': 'Столбец базы данных',
  },
  relatedModel: {
    'en-us': 'Related Model',
    'ru-ru': 'Родственная Таблица',
  },
  otherSideName: {
    'en-us': 'Other side name',
    'ru-ru': 'Имя другой стороны',
  },
  dependent: {
    'en-us': 'Dependent',
    'ru-ru': 'Зависимый',
  },
  downloadAsJson: {
    'en-us': 'Download as JSON',
    'ru-ru': 'Скачать как JSON',
  },
  downloadAsTsv: {
    'en-us': 'Download as TSV',
    'ru-ru': 'Скачать как TSV',
  },
  tableId: {
    'en-us': 'Table ID',
    'ru-ru': 'Идентификатор',
  },
  fieldCount: {
    'en-us': 'Field count',
    'ru-ru': 'Количество полей',
  },
  relationshipCount: {
    'en-us': 'Relationship count',
    'ru-ru': 'Количество отношений',
  },
  databaseSchema: {
    'en-us': 'Database Schema',
    'ru-ru': 'Database Schema',
  },
  tableApi: {
    'en-us': 'Tables API',
    'ru-ru': 'API таблиц',
  },
  operationsApi: {
    'en-us': 'Operations API',
    'ru-ru': ' API операций',
  },
  title: {
    'en-us': 'Title',
    'ru-ru': 'Надпись',
  },
  ordinal: {
    'en-us': 'Ordinal',
    'ru-ru': 'Порядковый номер',
  },
  userAccount: {
    'en-us': 'User Account',
    'ru-ru': 'Учетная запись',
  },
  customization: {
    'en-us': 'Customization',
    'ru-ru': 'Настройка',
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
  documentation: {
    'en-us': 'Documentation',
    'ru-ru': 'Документация',
  },
  developers: {
    'en-us': 'Developer Resources',
    'ru-ru': 'Инструменты разработчика',
  },
  forum: {
    'en-us': 'Community Forum',
    'ru-ru': 'Specify Форум',
  },
  clearCache: {
    'en-us': 'Clear Browser Cache',
    'ru-ru': 'Очистить кеш',
  },
  clearedCacheDialogText: {
    'en-us': 'Cache has been cleared. Please reload the page.',
    'ru-ru': 'Кэш очищен. Пожалуйста, перезагрузите страницу.',
  },
  technicalDocumentation: {
    'en-us': 'Technical Docs',
    'ru-ru': 'Тех. Документы',
  },
  dismiss: {
    'en-us': 'Dismiss',
    'ru-ru': 'Отклонить',
  },
  /*
   * Used in field formatter if user doesn't have read access to the related
   * table
   */
  noPermission: {
    'en-us': 'NO PERMISSION',
    'ru-ru': 'ОТСУТСТВУЕТ РАЗРЕШЕНИЕ',
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
  permissionDeniedError: {
    'en-us': 'Permission denied error',
    'ru-ru': 'В доступе отказано',
  },
  modified: {
    'en-us': 'Modified',
    'ru-ru': 'Изменено',
  },
  permissionDeniedDialogText: {
    'en-us': `You don't have any policy or role that gives you permission to do
      the following action:`,
    'ru-ru': `У вас нет политики или роли, которая дает вам разрешение на
      выполнение следующих действий:`,
  },
  permissionDeniedDialogSecondText: {
    'en-us': (url: JSX.Element) => <>Permission denied when accessing {url}</>,
    'ru-ru': (url: JSX.Element) => (
      <>Разрешение не было дано при доступе {url}</>
    ),
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
  mostRecentNotificationsTop: {
    'en-us': '(Ordered from most recent to the oldest.)',
    'ru-ru': '(В порядке от самого последнего к самому старому.)',
  },
  primary: {
    'en-us': 'Primary',
    'ru-ru': 'Основной',
  },
  revealHiddenFormFields: {
    'en-us': 'Reveal Hidden Form Fields',
    'ru-ru': 'Показать скрытые поля формы',
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
  selectedTables: {
    'en-us': 'Selected Tables',
    'ru-ru': 'Выбранные таблицы',
  },
  possibleTables: {
    'en-us': 'Possible Tables',
    'ru-ru': 'Возможные таблицы',
  },
  reset: {
    'en-us': 'Reset',
    'ru-ru': 'Сброс',
  },
  select: {
    'en-us': 'Select',
    'ru-ru': 'Выбрать',
  },
});
/* eslint-enable react/jsx-no-literals */
/* eslint-enable @typescript-eslint/naming-convention */
