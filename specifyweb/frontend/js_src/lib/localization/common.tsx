/**
 * Localization strings that are shared across components or that are used
 * in the Header or UserTools menu
 *
 * @module
 */

import React from 'react';

import { createDictionary, header } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

const commonText = createDictionary({
  specifySeven: {
    'en-us': 'Specify 7',
    'ru-ru': 'Specify 7',
    ca: 'Specify 7',
  },
  pageNotFound: {
    'en-us': 'Page Not Found',
    'ru-ru': 'Страница не найдена',
    ca: 'Page Not Found',
  },
  collectionAccessDeniedDialogTitle: {
    'en-us': 'Access denied',
    'ru-ru': 'Доступ отказано',
    ca: 'Access denied',
  },
  collectionAccessDeniedDialogHeader: {
    'en-us': header('You do not have access to this collection'),
    'ru-ru': header('У вас нет доступа к этой коллекции'),
    ca: header('You do not have access to this collection'),
  },
  collectionAccessDeniedDialogMessage: {
    'en-us': (collectionName: string) =>
      `The currently logged in account does not have access to the
       ${collectionName} collection.`,
    'ru-ru': (collectionName: string) =>
      `Учетная запись, вошедшая в систему в данный момент, не имеет доступа к
       коллекции ${collectionName}.`,
    ca: (collectionName: string) =>
      `The currently logged in account does not have access to the
       ${collectionName} collection.`,
  },
  noAgentDialogTitle: {
    'en-us': 'No Agent assigned',
    'ru-ru': 'Агент не назначен',
    ca: "No s'ha assignat cap agent",
  },
  noAgentDialogHeader: {
    'en-us': header('Current user does not have an agent assigned'),
    'ru-ru': header('Текущему пользователю не назначен агент'),
    ca: header("L'usuari actual no té cap agent assignat"),
  },
  noAgentDialogMessage: {
    'en-us': 'Please log in as admin and assign an agent to this user',
    'ru-ru':
      'Пожалуйста, войдите как администратор и назначьте агента этому пользователю',
    ca: 'Inicieu sessió com a administrador i assigneu un agent a aquest usuari',
  },
  no: {
    'en-us': 'No',
    'ru-ru': 'Нет',
    ca: 'No',
  },
  cancel: {
    'en-us': 'Cancel',
    'ru-ru': 'Отмена',
    ca: 'Cancel',
  },
  back: {
    'en-us': 'Back',
    'ru-ru': 'Назад',
    ca: 'Esquena',
  },
  create: {
    'en-us': 'Create',
    'ru-ru': 'Создать',
    ca: 'Create',
  },
  close: {
    'en-us': 'Close',
    'ru-ru': 'Закрыть',
    ca: 'Close',
  },
  apply: {
    'en-us': 'Apply',
    'ru-ru': 'Применить',
    ca: 'Apply',
  },
  applyAll: {
    'en-us': 'Apply All',
    'ru-ru': 'Применить все',
    ca: 'Apply All',
  },
  clearAll: {
    'en-us': 'Clear all',
    'ru-ru': 'Очистить все',
    ca: 'Clear all',
  },
  save: {
    'en-us': 'Save',
    'ru-ru': 'Сохранить',
    ca: 'Save',
  },
  add: {
    'en-us': 'Add',
    'ru-ru': 'Добавить',
    ca: 'Add',
  },
  open: {
    'en-us': 'Open',
    'ru-ru': 'Открыть',
    ca: 'Open',
  },
  delete: {
    'en-us': 'Delete',
    'ru-ru': 'Удалить',
    ca: 'Delete',
  },
  next: {
    'en-us': 'Next',
    'ru-ru': 'Следующий',
    ca: 'Next',
  },
  previous: {
    'en-us': 'Previous',
    'ru-ru': 'Предыдущий',
    ca: 'Previous',
  },
  tools: {
    'en-us': 'Tools',
    'ru-ru': 'Инструменты',
    ca: 'Tools',
  },
  loading: {
    'en-us': 'Loading...',
    'ru-ru': 'Загрузка...',
    ca: 'Loading...',
  },
  tableInline: {
    'en-us': 'Table:',
    'ru-ru': 'Таблица',
    ca: 'Taula',
  },
  tableName: {
    'en-us': 'Table Name',
    'ru-ru': 'Имя таблицы',
    ca: 'Table Name',
  },
  name: {
    'en-us': 'Name',
    'ru-ru': 'Имя',
    ca: 'Name',
  },
  created: {
    'en-us': 'Created',
    'ru-ru': 'Созданный',
    ca: 'Created',
  },
  uploaded: {
    'en-us': 'Uploaded',
    'ru-ru': 'Загружено',
    ca: 'Uploaded',
  },
  createdBy: {
    'en-us': 'Created by:',
    'ru-ru': 'Создан:',
    ca: 'Created by:',
  },
  modifiedBy: {
    'en-us': 'Modified by:',
    'ru-ru': 'Модифицирован:',
    ca: 'Modified by:',
  },
  stop: {
    'en-us': 'Stop',
    'ru-ru': 'Стоп',
    ca: 'Stop',
  },
  remove: {
    'en-us': 'Remove',
    'ru-ru': 'Удалить',
    ca: 'Remove',
  },
  search: {
    'en-us': 'Search',
    'ru-ru': 'Искать',
    ca: 'Search',
  },
  noResults: {
    'en-us': 'No Results',
    'ru-ru': 'Нет результатов',
    ca: 'No Results',
  },
  notApplicable: {
    'en-us': 'N/A',
    'ru-ru': 'Н/Д',
    ca: 'N/A',
  },
  new: {
    'en-us': 'New',
    'ru-ru': 'Новый',
    ca: 'New',
  },
  reports: {
    'en-us': 'Reports',
    'ru-ru': 'Отчеты',
    ca: 'Reports',
  },
  labels: {
    'en-us': 'Labels',
    'ru-ru': 'Этикетки',
    ca: 'Labels',
  },
  edit: {
    'en-us': 'Edit',
    'ru-ru': 'Редактировать',
    ca: 'Edit',
  },
  ignore: {
    'en-us': 'Ignore',
    'ru-ru': 'Игнорировать',
    ca: 'Ignore',
  },
  logIn: {
    'en-us': 'Log In',
    'ru-ru': 'Авторизоваться',
    ca: 'Log In',
  },
  start: {
    'en-us': 'Start',
    'ru-ru': 'Начало',
    ca: 'Start',
  },
  end: {
    'en-us': 'End',
    'ru-ru': 'Конец',
    ca: 'End',
  },
  update: {
    'en-us': 'Update',
    'ru-ru': 'Обновить',
    ca: 'Update',
  },
  generate: {
    'en-us': 'Generate',
    'ru-ru': 'Генерировать',
    ca: 'Generate',
  },
  loadingInline: {
    'en-us': '(loading...)',
    'ru-ru': '(загрузка...)',
    ca: '(loading...)',
  },
  listTruncated: {
    'en-us': '(list truncated)',
    'ru-ru': '(список усечен)',
    ca: '(list truncated)',
  },
  metadataInline: {
    'en-us': 'Metadata:',
    'ru-ru': 'Метаданные:',
    ca: 'Metadata:',
  },
  metadata: {
    'en-us': 'Metadata',
    'ru-ru': 'Метаданные',
    ca: 'Metadata',
  },
  query: {
    'en-us': 'Query',
    'ru-ru': 'Запрос',
    ca: 'Consulta',
  },
  unmapped: {
    'en-us': 'Unmapped',
    'ru-ru': 'Не сопоставлений',
    ca: 'Unmapped',
  },
  mapped: {
    'en-us': 'Mapped',
    'ru-ru': 'Сопоставлений',
    ca: 'Mapped',
  },
  expand: {
    'en-us': 'Expand',
    'ru-ru': 'Расширить',
    ca: 'Expand',
  },
  geoMap: {
    'en-us': 'GeoMap',
    'ru-ru': 'Карта',
    ca: 'GeoMap',
  },
  fullDate: {
    'en-us': 'Full Date',
    'ru-ru': 'Полная дата',
    ca: 'Full Date',
  },
  view: {
    'en-us': 'View',
    'ru-ru': 'Смотреть',
    ca: 'View',
  },
  addChild: {
    'en-us': 'Add Child',
    'ru-ru': 'Добавить Ребенка',
    ca: 'Add Child',
  },
  move: {
    'en-us': 'Move',
    'ru-ru': 'Переместить',
    ca: 'Move',
  },
  opensInNewTab: {
    'en-us': '(opens in a new tab)',
    'ru-ru': '(открывается в новой вкладке)',
    ca: '(opens in a new tab)',
  },

  // Toolbar
  skipToContent: {
    'en-us': 'Skip to Content',
    'ru-ru': 'Перейти к содержанию',
    ca: 'Saltar al contingut',
  },
  goToHomepage: {
    'en-us': 'Go to homepage',
    'ru-ru': 'Вернуться на домашнюю страницу',
    ca: "Vés a la pàgina d'inici",
  },
  currentUser: {
    'en-us': 'Current User',
    'ru-ru': 'Текущий пользователь',
    ca: 'Usuari actual',
  },
  currentCollection: {
    'en-us': 'Current Collection',
    'ru-ru': 'Текущая коллекция',
    ca: 'Col·lecció actual',
  },
  actions: {
    'en-us': 'Actions:',
    'ru-ru': 'Действия:',
    ca: 'Accions:',
  },

  // Login screen
  username: {
    'en-us': 'Username',
    'ru-ru': 'Имя пользователя',
    ca: "Nom d'usuari",
  },
  password: {
    'en-us': 'Password',
    'ru-ru': 'Пароль',
    ca: 'Contrasenya',
  },
  login: {
    'en-us': 'Login',
    'ru-ru': 'Вход',
    ca: 'Iniciar Sessió',
  },

  // Choose Collection
  chooseCollection: {
    'en-us': 'Choose Collection',
    'ru-ru': 'Выбрать коллекцию',
    ca: 'Trieu Col·lecció',
  },
  noAccessToCollections: {
    'en-us': (loginLink: (label: string) => JSX.Element) => (
      <>
        The logged in user has not been given access to any collections in this
        database. You must {loginLink('login')} as another user.
      </>
    ),
    'ru-ru': (loginLink: (label: string) => JSX.Element) => (
      <>
        Пользователь, вошедший в систему, не получил доступа ни к каким
        коллекциям в этой базе данных. Вы должны {loginLink('войти')} в систему
        как другой пользователь.
      </>
    ),
    ca: (loginLink: (label: string) => JSX.Element) => (
      <>
        L'usuari que ha iniciat sessió no té accés a cap col·lecció d'aquesta
        base de dades. Heu {loginLink("d'iniciar sessió")} com un altre usuari.
      </>
    ),
  },

  // Change Password
  changePassword: {
    'en-us': 'Change Password',
    'ru-ru': 'Изменить пароль',
    ca: 'Canvia la contrasenya',
  },
  oldPassword: {
    'en-us': 'Old password',
    'ru-ru': 'Предыдущий пароль',
    ca: 'Contrasenya anterior',
  },
  newPassword: {
    'en-us': 'New password',
    'ru-ru': 'iНовый пароль',
    ca: 'Nova contrasenya',
  },
  repeatPassword: {
    'en-us': 'Repeat new password',
    'ru-ru': 'Повторите новый пароль',
    ca: 'Repetiu la contrasenya nova',
  },

  // Menu Bar & User Tools
  notifications: {
    'en-us': (count: number | string) => `Notifications: ${count}`,
    'ru-ru': (count: number | string) => `Уведомлений: ${count}`,
    ca: (count: number | string) => `Notifications: ${count}`,
  },
  attachments: {
    'en-us': 'Attachments',
    'ru-ru': 'Вложения',
    ca: 'Attachments',
  },
  dataEntry: {
    'en-us': 'Data Entry',
    'ru-ru': 'Ввод данных',
    ca: 'Data Entry',
  },
  makeDwca: {
    'en-us': 'Make DwCA',
    'ru-ru': 'Создать DwCA',
    ca: 'Make DwCA',
  },
  definitionResourceNotFound: {
    'en-us': (resourceName: string) =>
      `Definition resource "${resourceName}" was not found.`,
    'ru-ru': (resourceName: string) =>
      `Ресурс определения "${resourceName}" не найден.`,
    ca: (resourceName: string) =>
      `Definition resource "${resourceName}" was not found.`,
  },
  metadataResourceNotFound: {
    'en-us': (resourceName: string) =>
      `Metadata resource "${resourceName}" was not found.`,
    'ru-ru': (resourceName: string) =>
      `Ресурс метаданных "${resourceName}" не найден.`,
    ca: (resourceName: string) =>
      `Metadata resource "${resourceName}" was not found.`,
  },
  updateExportFeed: {
    'en-us': 'Update Feed Now',
    'ru-ru': 'Обновить фид',
    ca: 'Update Feed Now',
  },
  updateExportFeedDialogTitle: {
    'en-us': 'Export Feed',
    'ru-ru': 'Экспорт фида',
    ca: 'Export Feed',
  },
  updateExportFeedDialogHeader: {
    'en-us': 'Update all export feed items now?',
    'ru-ru': 'Обновить все элементы фида экспорта сейчас?',
    ca: 'Update all export feed items now?',
  },
  updateExportFeedDialogMessage: {
    'en-us': 'Update all export feed items now?',
    'ru-ru': 'Обновить все элементы фида экспорта сейчас?',
    ca: 'Update all export feed items now?',
  },
  feedExportStartedDialogTitle: {
    'en-us': 'Export Feed',
    'ru-ru': 'Экспорт фида',
    ca: 'Export Feed',
  },
  feedExportStartedDialogHeader: {
    'en-us': 'Export feed update started',
    'ru-ru': 'Начато обновление экспортного фида',
    ca: 'Export feed update started',
  },
  feedExportStartedDialogMessage: {
    'en-us': `
      Update started. You will receive a notification for each feed item
      updated.`,
    'ru-ru': `
      Обновление началось. Вы получите уведомление о каждом элементе фида`,
    ca: `
      Update started. You will receive a notification for each feed item
      updated.`,
  },
  dwcaExportStartedDialogTitle: {
    'en-us': 'DwCA',
    'ru-ru': 'DwCA',
    ca: 'DwCA',
  },
  dwcaExportStartedDialogHeader: {
    'en-us': 'DwCA export started',
    'ru-ru': 'DwCA экспорт начат',
    ca: 'DwCA export started',
  },
  dwcaExportStartedDialogMessage: {
    'en-us': `
      Export started. You will receive a notification
      when the export is complete.`,
    'ru-ru': `
      Экспорт начат. Вы получите уведомление когда экспорт будет завершен.`,
    ca: `
      Export started. You will receive a notification
      when the export is complete.`,
  },
  interactions: {
    'en-us': 'Interactions',
    'ru-ru': 'Взаимодействия',
    ca: 'Interactions',
  },
  generateMasterKey: {
    'en-us': 'Generate Master Key',
    'ru-ru': 'Сгенерировать мастер-ключ',
    ca: 'Generate Master Key',
  },
  generateMasterKeyDialogTitle: {
    'en-us': 'Master Key',
    'ru-ru': 'Мастер ключ',
    ca: 'Master Key',
  },
  generateMasterKeyDialogHeader: {
    'en-us': 'Generate Master Key',
    'ru-ru': 'Сгенерировать мастер-ключ',
    ca: 'Generate Master Key',
  },
  userPassword: {
    'en-us': 'User Password:',
    'ru-ru': 'Пользовательский пароль:',
    ca: 'User Password:',
  },
  masterKeyDialogTitle: {
    'en-us': 'Master Key',
    'ru-ru': 'Мастер ключ',
    ca: 'Master Key',
  },
  masterKeyDialogHeader: {
    'en-us': 'Master key generated',
    'ru-ru': 'Мастер-ключ создан',
    ca: 'Master key generated',
  },
  masterKeyFieldLabel: {
    'en-us': 'Master Key:',
    'ru-ru': 'Мастер ключ:',
    ca: 'Master Key:',
  },
  incorrectPassword: {
    'en-us': 'Password was incorrect.',
    'ru-ru': 'Пароль неверный.',
    ca: 'Password was incorrect.',
  },
  ascending: {
    'en-us': 'Ascending',
    'ru-ru': 'По возрастанию',
    ca: 'Ascending',
  },
  descending: {
    'en-us': 'Descending',
    'ru-ru': 'По убыванию',
    ca: 'Descending',
  },
  queries: {
    'en-us': 'Queries',
    'ru-ru': 'Запросы',
    ca: 'Queries',
  },
  queriesDialogTitle: {
    'en-us': (count: number) => `Queries (${count})`,
    'ru-ru': (count: number) => `Запросы (${count})`,
    ca: (count: number) => `Queries (${count})`,
  },
  newQueryDialogTitle: {
    'en-us': 'New Query Type',
    'ru-ru': 'Новый запрос',
    ca: 'New Query Type',
  },
  exportQueryForDwca: {
    'en-us': 'Export query for DwCA definition.',
    'ru-ru': 'Экспорт запрос для DwCA.',
    ca: 'Export query for DwCA definition.',
  },
  exportQueryForDwcaDialogTitle: {
    'en-us': 'Query XML for DwCA definition',
    'ru-ru': 'XML Запроса для определения DwCA',
    ca: 'Query XML for DwCA definition',
  },
  exportQueryForDwcaDialogHeader: {
    'en-us': 'Query XML for DwCA definition',
    'ru-ru': 'XML Запроса для определения DwCA',
    ca: 'Query XML for DwCA definition',
  },
  exportQueryAsReport: {
    'en-us': 'Define report based on query.',
    'ru-ru': 'Определите отчет на основе запроса.',
    ca: 'Define report based on query.',
  },
  exportQueryAsLabel: {
    'en-us': 'Define label based on query.',
    'ru-ru': 'Определите метку на основе запроса.',
    ca: 'Define label based on query.',
  },
  newResourceTitle: {
    'en-us': (resourceName: string) => `New ${resourceName}`,
    'ru-ru': (resourceName: string) => `Новый ${resourceName}`,
    ca: (resourceName: string) => `New ${resourceName}`,
  },
  labelName: {
    'en-us': 'Label Name',
    'ru-ru': 'Название ярлыка',
    ca: 'Label Name',
  },
  reportName: {
    'en-us': 'Report Name',
    'ru-ru': 'Название отчета',
    ca: 'Report Name',
  },
  createLabelDialogTitle: {
    'en-us': 'Labels',
    'ru-ru': 'Этикетки',
    ca: 'Labels',
  },
  createLabelDialogHeader: {
    'en-us': 'Create new label',
    'ru-ru': 'Создать новую этикетку',
    ca: 'Create new label',
  },
  createReportDialogTitle: {
    'en-us': 'Reports',
    'ru-ru': 'Отчеты',
    ca: 'Reports',
  },
  createReportDialogHeader: {
    'en-us': 'Create new report',
    'ru-ru': 'Создать новый отчет',
    ca: 'Create new report',
  },
  recordSets: {
    'en-us': 'Record Sets',
    'ru-ru': 'Наборы объектов',
    ca: 'Record Sets',
  },
  resources: {
    'en-us': 'Resources',
    'ru-ru': 'Ресурсы',
    ca: 'Resources',
  },
  appResources: {
    'en-us': 'App Resources',
    'ru-ru': 'Ресурсы приложения',
    ca: 'App Resources',
  },
  viewSets: {
    'en-us': 'View Sets',
    'ru-ru': 'Ресурсы для просмотров',
    ca: 'View Sets',
  },
  resourcesDialogTitle: {
    'en-us': 'Resources',
    'ru-ru': 'Ресурсы',
    ca: 'Resources',
  },
  resourcesDialogHeader: {
    'en-us': 'Choose the resource type you wish to edit:',
    'ru-ru': 'Выберите тип ресурса, который хотите отредактировать:',
    ca: 'Choose the resource type you wish to edit:',
  },
  repairTree: {
    'en-us': 'Repair Tree',
    'ru-ru': 'Ремонтировать дерево',
    ca: 'Repair Tree',
  },
  trees: {
    'en-us': 'Trees',
    'ru-ru': 'Деревья',
    ca: 'Trees',
  },
  treesDialogTitle: {
    'en-us': 'Trees',
    'ru-ru': 'Деревья',
    ca: 'Trees',
  },
  recordSet: {
    'en-us': 'Record Set',
    'ru-ru': 'Набор объектов',
    ca: 'Record Set',
  },
  recordCount: {
    'en-us': 'Record Count',
    'ru-ru': 'Количество объектов',
    ca: 'Record Count',
  },
  size: {
    'en-us': 'Size',
    'ru-ru': 'Размер',
    ca: 'Size',
  },
  manageUsers: {
    'en-us': 'Manage Users',
    'ru-ru': 'Управление пользователями',
    ca: 'Manage Users',
  },
  manageUsersDialogTitle: {
    'en-us': 'Manage Users',
    'ru-ru': 'Управление пользователями',
    ca: 'Manage Users',
  },
  workbench: {
    'en-us': 'WorkBench',
    'ru-ru': 'WorkBench',
    ca: 'WorkBench',
  },
  chooseDwcaDialogTitle: {
    'en-us': 'Choose DwCA',
    'ru-ru': 'Выберите DwCA',
    ca: 'Choose DwCA',
  },
  dwcaDefinition: {
    'en-us': 'DwCA definition:',
    'ru-ru': 'Определение DwCA:',
    ca: 'DwCA definition:',
  },
  metadataResource: {
    'en-us': 'Metadata resource:',
    'ru-ru': 'Ресурс метаданных:',
    ca: 'Metadata resource:',
  },
  // Error Boundary
  errorBoundaryDialogTitle: {
    'en-us': 'Unexpected Error',
    'ru-ru': 'Неожиданная ошибка',
    ca: 'Unexpected Error',
  },
  errorBoundaryDialogHeader: {
    'en-us': 'An unexpected error has occurred',
    'ru-ru': 'Произошла неожиданная ошибка',
    ca: 'An unexpected error has occurred',
  },
  errorBoundaryDialogMessage: {
    'en-us': 'Please reload the page and try again.',
    'ru-ru': 'Пожалуйста, обновите страницу и попробуйте еще раз.',
    ca: 'Please reload the page and try again.',
  },
  errorBoundaryDialogSecondMessage: {
    'en-us': (email: JSX.Element) => (
      <>
        If this issue persists, please contact your IT support or if this is a
        Specify Cloud database, contact {email}
      </>
    ),
    'ru-ru': (email: JSX.Element) => (
      <>
        Если проблема не исчезнет, обратитесь в вашу IT службу поддержки или
        свяжитесь с нами: {email}
      </>
    ),
    ca: (email: JSX.Element) => (
      <>
        If this issue persists, please contact your IT support or if this is a
        Specify Cloud database, contact {email}
      </>
    ),
  },
  errorMessage: {
    'en-us': 'Error Message',
    'ru-ru': 'Описание ошибки',
    ca: "Missatge d'error",
  },
  backEndErrorDialogTitle: {
    'en-us': 'Server Error',
    'ru-ru': 'Ошибка на сервере',
    ca: 'Server Error',
  },
  backEndErrorDialogHeader: {
    'en-us': header(
      'An error occurred communicating with the Specify 7 server.'
    ),
    'ru-ru': header('Произошла ошибка связи с сервером Specify 7.'),
    ca: header('An error occurred communicating with the Specify 7 server.'),
  },
  backEndErrorDialogMessage: {
    'en-us': `
      Please reload the page and try again.<br>
      If the issue persists, please contact your IT support, or if this is a
      Specify Cloud database, contact
      <a href="mailto:support@specifysoftware.org">
        support@specifysoftware.org
      </a>
    `,
    'ru-ru': `
      Пожалуйста, обновите страницу и попробуйте еще раз.<br>
      Если проблема не исчезнет, обратитесь в вашу IT службу поддержки или
      свяжитесь с нами:
      <a href="mailto:support@specifysoftware.org">
        support@specifysoftware.org
      </a>
    `,
    ca: `
      Please reload the page and try again.<br>
      If the issue persists, please contact your IT support, or if this is a
      Specify Cloud database, contact
      <a href="mailto:support@specifysoftware.org">
        support@specifysoftware.org
      </a>
    `,
  },
  // Search
  expressSearch: {
    'en-us': 'Express Search',
    'ru-ru': 'Экспресс поиск',
    ca: 'Express Search',
  },
  primarySearch: {
    'en-us': 'Primary Search',
    'ru-ru': 'Первичный поиск',
    ca: 'Primary Search',
  },
  secondarySearch: {
    'en-us': 'Secondary Search',
    'ru-ru': 'Вторичный поиск',
    ca: 'Secondary Search',
  },
  running: {
    'en-us': 'Running...',
    'ru-ru': 'Выполнение...',
    ca: 'Running...',
  },
  noMatches: {
    'en-us': 'No Matches',
    'ru-ru': 'Нет совпадений',
    ca: 'No Matches',
  },
  searchQuery: {
    'en-us': 'Search Query',
    'ru-ru': 'Поиск',
    ca: 'Search Query',
  },
  unknown: {
    'en-us': 'Unknown',
    'ru-ru': 'Неизвестный',
    ca: 'Unknown',
  },
  // Unload Protection
  leavePageDialogTitle: {
    'en-us': 'Unsaved changes detected',
    'ru-ru': 'Обнаружены несохраненные изменения',
    ca: 'Unsaved changes detected',
  },
  leavePageDialogHeader: {
    'en-us': header('Are you sure you want to leave this page?'),
    'ru-ru': header('Вы уверены, что хотите покинуть эту страницу?'),
    ca: header('Are you sure you want to leave this page?'),
  },
  leave: {
    'en-us': 'Leave',
    'ru-ru': 'Покинуть',
    ca: 'Leave',
  },
  // Notifications
  notificationsDialogTitle: {
    'en-us': 'Notifications',
    'ru-ru': 'Уведомления',
    ca: 'Notifications',
  },
  feedItemUpdated: {
    'en-us': 'Export feed item updated.',
    'ru-ru': 'Элемент фида экспорта обновлен.',
    ca: 'Export feed item updated.',
  },
  updateFeedFailed: {
    'en-us': 'Export feed update failed.',
    'ru-ru': 'Не удалось обновить экспортный канал.',
    ca: 'Export feed update failed.',
  },
  exception: {
    'en-us': 'Exception',
    'ru-ru': 'Трассировка стека',
    ca: 'Exception',
  },
  download: {
    'en-us': 'Download',
    'ru-ru': 'Скачать',
    ca: 'Download',
  },
  dwcaExportCompleted: {
    'en-us': 'DwCA export completed.',
    'ru-ru': 'Экспорт в DwCA завершен.',
    ca: 'DwCA export completed.',
  },
  dwcaExportFailed: {
    'en-us': 'DwCA export failed.',
    'ru-ru': 'Не удалось экспортировать DwCA.',
    ca: 'DwCA export failed.',
  },
  queryExportToCsvCompleted: {
    'en-us': 'Query export to CSV completed.',
    'ru-ru': 'Экспорт запроса в CSV завершен.',
    ca: 'Query export to CSV completed.',
  },
  queryExportToKmlCompleted: {
    'en-us': 'Query export to KML completed.',
    'ru-ru': 'Экспорт запроса в KML завершен.',
    ca: 'Query export to KML completed.',
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
    ca: (userName: JSX.Element, dataSetName: JSX.Element) => (
      <>
        {userName} transferred the ownership of the {dataSetName} dataset to
        you.
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
    ca: `
      You do not have access to any collection containing this resource
      through the currently logged in account`,
  },
  resourceInaccessible: {
    'en-us': `
      The requested resource cannot be accessed while logged into the
      current collection.`,
    'ru-ru': `
      Запрошенный ресурс недоступен в текущей коллекция.`,
    ca: `
      The requested resource cannot be accessed while logged into the
      current collection.`,
  },
  selectCollection: {
    'en-us': 'Select one of the following collections:',
    'ru-ru': 'Выберите одну из следующих коллекций:',
    ca: 'Select one of the following collections:',
  },
  collection: {
    'en-us': 'Collection',
    'ru-ru': 'Коллекция',
    ca: 'Collection',
  },
  loginToProceed: {
    'en-us': (collectionName: string) => `
       You can login to the collection, ${collectionName}, to proceed:`,
    'ru-ru': (collectionName: string) => `
       Вы можете войти в коллекцию, ${collectionName}, чтобы продолжить:`,
    ca: (collectionName: string) => `
       You can login to the collection, ${collectionName}, to proceed:`,
  },
  // SpecifyApp
  versionMismatchDialogTitle: {
    'en-us': 'Version Mismatch',
    'ru-ru': 'Несоответствие версий',
    ca: 'Version Mismatch',
  },
  versionMismatchDialogHeader: {
    'en-us': 'Specify version does not match database version',
    'ru-ru': 'Specify версия не соответствует версии базы данных',
    ca: 'Specify version does not match database version',
  },
  versionMismatchDialogMessage: {
    'en-us': (specifySixVersion: string, databaseVersion: string) => `
      The Specify version ${specifySixVersion} does not match the database
      version ${databaseVersion}.`,
    'ru-ru': (specifySixVersion: string, databaseVersion: string) => `
      Specify версия ${specifySixVersion} не соответствует версии базы
      данных ${databaseVersion}.`,
    ca: (specifySixVersion: string, databaseVersion: string) => `
      The Specify version ${specifySixVersion} does not match the database
      version ${databaseVersion}.`,
  },
  versionMismatchSecondDialogMessage: {
    'en-us':
      'Some features of Specify 7 may therefore fail to operate correctly.',
    'ru-ru': 'Поэтому некоторые функции Specify 7 могут неработать.',
    ca: 'Some features of Specify 7 may therefore fail to operate correctly.',
  },
  resourceDeletedDialogTitle: {
    'en-us': 'Deleted',
    'ru-ru': 'Удалено',
    ca: 'Deleted',
  },
  resourceDeletedDialogHeader: {
    'en-us': header('Item deleted'),
    'ru-ru': header('Удалено'),
    ca: header('Item deleted'),
  },
  resourceDeletedDialogMessage: {
    'en-us': 'Item was deleted successfully.',
    'ru-ru': 'Успешно удален.',
    ca: 'Item was deleted successfully.',
  },
  appTitle: {
    'en-us': (baseTitle: string) => `${baseTitle} | Specify 7`,
    'ru-ru': (baseTitle: string) => `${baseTitle} | Specify 7`,
    ca: (baseTitle: string) => `${baseTitle} | Specify 7`,
  },
  // StartApp
  sessionTimeOutDialogTitle: {
    'en-us': 'Access denied',
    'ru-ru': 'Доступе Отказано',
    ca: 'Access denied',
  },
  sessionTimeOutDialogHeader: {
    'en-us': header('Insufficient Privileges'),
    'ru-ru': header('Insufficient Privileges'),
    ca: header('Insufficient Privileges'),
  },
  sessionTimeOutDialogMessage: {
    'en-us': `
      You lack sufficient privileges for that action, or your current
      session has been logged out.`,
    'ru-ru': `
      У вас недостаточно прав для этого действия, или текещий сеанс был
      отключен..`,
    ca: `
      You lack sufficient privileges for that action, or your current
      session has been logged out.`,
  },
  // UserTools
  logOut: {
    'en-us': 'Log out',
    'ru-ru': 'Выйти',
    ca: 'Log out',
  },
  userToolsDialogTitle: {
    'en-us': 'User Tools',
    'ru-ru': 'Инструменты',
    ca: 'User Tools',
  },
  language: {
    'en-us': 'Language:',
    'ru-ru': 'Язык:',
    ca: 'Language:',
  },
  changeLanguage: {
    'en-us': 'Change Language',
    'ru-ru': 'Изменить Язык',
    ca: 'Change Language',
  },
  schemaConfig: {
    'en-us': 'Schema Config',
    'ru-ru': 'Конфигурация схемы',
    ca: "Configuració d'esquema",
  },
  unsavedSchemaUnloadProtect: {
    'en-us': 'Schema changes have not been saved',
    'ru-ru': 'Изменения схемы не сохранены',
    ca: "Els canvis d'esquema no s'han desat",
  },

  // Schema Config
  changeBaseTable: {
    'en-us': 'Change Base Table',
    'ru-ru': 'Изменить базовую таблицу',
    ca: 'Change Base Table',
  },
  fields: {
    'en-us': 'Fields',
    'ru-ru': 'Поля',
    ca: 'Camps',
  },
  field: {
    'en-us': 'Field',
    'ru-ru': 'Поле',
    ca: 'Camp',
  },
  relationships: {
    'en-us': 'Relationships',
    'ru-ru': 'Отношения',
    ca: 'Relacions',
  },
  caption: {
    'en-us': 'Caption',
    'ru-ru': 'Подпись',
    ca: 'Subtítol',
  },
  description: {
    'en-us': 'Descripion',
    'ru-ru': 'Описание',
    ca: 'Descripció',
  },
  hideTable: {
    'en-us': 'Hide Table',
    'ru-ru': 'Скрыть таблицу',
    ca: 'Oculta la taula',
  },
  hideField: {
    'en-us': 'Hide Field',
    'ru-ru': 'Скрыть поле',
    ca: 'Oculta el camp',
  },
  tableFormat: {
    'en-us': 'Table Format',
    'ru-ru': 'Формат таблицы',
    ca: 'Format de taula',
  },
  tableAggregation: {
    'en-us': 'Table Aggregation',
    'ru-ru': 'Агрегация таблиц',
    ca: 'Agregació de taules',
  },
  type: {
    'en-us': 'Type',
    'ru-ru': 'Тип',
    ca: 'Tipus',
  },
  oneToOne: {
    'en-us': 'One-to-one',
    'ru-ru': 'Один к одному',
    ca: 'Un a un',
  },
  oneToMany: {
    'en-us': 'One-to-many',
    'ru-ru': 'Один ко многим',
    ca: 'Un a molts',
  },
  manyToOne: {
    'en-us': 'Many-to-one',
    'ru-ru': 'Многие к одному',
    ca: 'Molts a un',
  },
  manyToMany: {
    'en-us': 'many-to-many',
    'ru-ru': 'Многие-ко-многим',
    ca: 'Molts a molts',
  },
  length: {
    'en-us': 'Length',
    'ru-ru': 'Длина',
    ca: 'Llargada',
  },
  readOnly: {
    'en-us': 'Read-only',
    'ru-ru': 'Только чтение',
    ca: 'Llegeix només',
  },
  required: {
    'en-us': 'Required',
    'ru-ru': 'Необходимый',
    ca: 'Obligatori',
  },
  fieldFormat: {
    'en-us': 'Field Format',
    'ru-ru': 'Формат поля',
    ca: 'Format de camp',
  },
  none: {
    'en-us': 'None',
    'ru-ru': 'Нет',
    ca: 'Cap',
  },
  noneAvailable: {
    'en-us': 'None available',
    'ru-ru': 'Нет доступных вариантов',
    ca: 'Cap disponible',
  },
  formatted: {
    'en-us': 'Formatted',
    'ru-ru': 'Форматирован',
    ca: 'Formatat',
  },
  webLink: {
    'en-us': 'Web Link',
    'ru-ru': 'Интернет-ссылка',
    ca: 'Enllaç web',
  },
  pickList: {
    'en-us': 'Pick List',
    'ru-ru': 'Список выбора',
    ca: 'Llista de selecció',
  },
  system: {
    'en-us': 'System',
    'ru-ru': 'Системное',
    ca: 'Sistema',
  },
  userDefined: {
    'en-us': 'User Defined',
    'ru-ru': 'Создано пользователем',
    ca: "Creat per l'usuari",
  },
  default: {
    'en-us': 'Default',
    'ru-ru': 'Умолчание',
    ca: 'Per defecte',
  },
  addLanguage: {
    'en-us': 'Add Language',
    'ru-ru': 'Добавить язык',
    ca: "Afegeix l'idioma",
  },
  addLanguageDialogTitle: {
    'en-us': 'Add Language',
    'ru-ru': 'Добавить язык',
    ca: "Afegeix l'idioma",
  },
  addLanguageDialogHeader: {
    'en-us': 'Add new language',
    'ru-ru': 'Добавить новый язык',
    ca: 'Afegeix un nou idioma',
  },
  country: {
    'en-us': 'Country',
    'ru-ru': 'Страна',
    ca: 'País',
  },
});

export default commonText;
