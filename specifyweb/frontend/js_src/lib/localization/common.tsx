/**
 * Localization strings that are shared across components or that are used
 * in the Header or UserTools menu
 *
 * @module
 */

import React from 'react';

import { createDictionary } from './utils';

// Refer to "Guidelines for Programmers" in ./README.md before editing this file

const commonText = createDictionary({
  specifySeven: {
    'en-us': 'Specify 7',
    'ru-ru': 'Specify 7',
    ca: 'Specify 7',
    'es-es': 'Specify 7',
  },
  pageNotFound: {
    'en-us': 'Page Not Found',
    'ru-ru': 'Страница не найдена',
    ca: 'Page Not Found',
    'es-es': 'Page Not Found',
  },
  collectionAccessDeniedDialogTitle: {
    'en-us': 'Access denied',
    'ru-ru': 'Доступ отказано',
    ca: 'Access denied',
    'es-es': 'Access denied',
  },
  collectionAccessDeniedDialogHeader: {
    'en-us': 'You do not have access to this collection',
    'ru-ru': 'У вас нет доступа к этой коллекции',
    ca: 'You do not have access to this collection',
    'es-es': 'You do not have access to this collection',
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
    'es-es': (collectionName: string) =>
      `The currently logged in account does not have access to the
       ${collectionName} collection.`,
  },
  noAgentDialogTitle: {
    'en-us': 'No Agent assigned',
    'ru-ru': 'Агент не назначен',
    ca: "No s'ha assignat cap agent",
    'es-es': 'No Agent assigned',
  },
  noAgentDialogHeader: {
    'en-us': 'Current user does not have an agent assigned',
    'ru-ru': 'Текущему пользователю не назначен агент',
    ca: "L'usuari actual no té cap agent assignat",
    'es-es': 'Current user does not have an agent assigned',
  },
  noAgentDialogMessage: {
    'en-us': 'Please log in as admin and assign an agent to this user',
    'ru-ru':
      'Пожалуйста, войдите как администратор и назначьте агента этому пользователю',
    ca: 'Inicieu sessió com a administrador i assigneu un agent a aquest usuari',
    'es-es': 'Please log in as admin and assign an agent to this user',
  },
  no: {
    'en-us': 'No',
    'ru-ru': 'Нет',
    ca: 'No',
    'es-es': 'No',
  },
  cancel: {
    'en-us': 'Cancel',
    'ru-ru': 'Отмена',
    ca: 'Cancel',
    'es-es': 'Cancel',
  },
  back: {
    'en-us': 'Back',
    'ru-ru': 'Назад',
    ca: 'Esquena',
    'es-es': 'Back',
  },
  create: {
    'en-us': 'Create',
    'ru-ru': 'Создать',
    ca: 'Create',
    'es-es': 'Create',
  },
  close: {
    'en-us': 'Close',
    'ru-ru': 'Закрыть',
    ca: 'Close',
    'es-es': 'Close',
  },
  apply: {
    'en-us': 'Apply',
    'ru-ru': 'Применить',
    ca: 'Apply',
    'es-es': 'Apply',
  },
  applyAll: {
    'en-us': 'Apply All',
    'ru-ru': 'Применить все',
    ca: 'Apply All',
    'es-es': 'Apply All',
  },
  clearAll: {
    'en-us': 'Clear all',
    'ru-ru': 'Очистить все',
    ca: 'Clear all',
    'es-es': 'Clear all',
  },
  save: {
    'en-us': 'Save',
    'ru-ru': 'Сохранить',
    ca: 'Save',
    'es-es': 'Save',
  },
  add: {
    'en-us': 'Add',
    'ru-ru': 'Добавить',
    ca: 'Add',
    'es-es': 'Add',
  },
  open: {
    'en-us': 'Open',
    'ru-ru': 'Открыть',
    ca: 'Open',
    'es-es': 'Open',
  },
  delete: {
    'en-us': 'Delete',
    'ru-ru': 'Удалить',
    ca: 'Delete',
    'es-es': 'Delete',
  },
  next: {
    'en-us': 'Next',
    'ru-ru': 'Следующий',
    ca: 'Next',
    'es-es': 'Next',
  },
  previous: {
    'en-us': 'Previous',
    'ru-ru': 'Предыдущий',
    ca: 'Previous',
    'es-es': 'Previous',
  },
  tools: {
    'en-us': 'Tools',
    'ru-ru': 'Инструменты',
    ca: 'Tools',
    'es-es': 'Tools',
  },
  loading: {
    'en-us': 'Loading...',
    'ru-ru': 'Загрузка...',
    ca: 'Loading...',
    'es-es': 'Loading...',
  },
  tableInline: {
    'en-us': 'Table:',
    'ru-ru': 'Таблица',
    ca: 'Taula',
    'es-es': 'Table:',
  },
  tableName: {
    'en-us': 'Table Name',
    'ru-ru': 'Имя таблицы',
    ca: 'Table Name',
    'es-es': 'Table Name',
  },
  name: {
    'en-us': 'Name',
    'ru-ru': 'Имя',
    ca: 'Name',
    'es-es': 'Name',
  },
  created: {
    'en-us': 'Created',
    'ru-ru': 'Созданный',
    ca: 'Created',
    'es-es': 'Created',
  },
  uploaded: {
    'en-us': 'Uploaded',
    'ru-ru': 'Загружено',
    ca: 'Uploaded',
    'es-es': 'Uploaded',
  },
  createdBy: {
    'en-us': 'Created by:',
    'ru-ru': 'Создан:',
    ca: 'Created by:',
    'es-es': 'Created by:',
  },
  modifiedBy: {
    'en-us': 'Modified by:',
    'ru-ru': 'Модифицирован:',
    ca: 'Modified by:',
    'es-es': 'Modified by:',
  },
  stop: {
    'en-us': 'Stop',
    'ru-ru': 'Стоп',
    ca: 'Stop',
    'es-es': 'Stop',
  },
  remove: {
    'en-us': 'Remove',
    'ru-ru': 'Удалить',
    ca: 'Remove',
    'es-es': 'Remove',
  },
  search: {
    'en-us': 'Search',
    'ru-ru': 'Искать',
    ca: 'Search',
    'es-es': 'Search',
  },
  noResults: {
    'en-us': 'No Results',
    'ru-ru': 'Нет результатов',
    ca: 'No Results',
    'es-es': 'No Results',
  },
  notApplicable: {
    'en-us': 'N/A',
    'ru-ru': 'Н/Д',
    ca: 'N/A',
    'es-es': 'N/A',
  },
  new: {
    'en-us': 'New',
    'ru-ru': 'Новый',
    ca: 'New',
    'es-es': 'New',
  },
  reports: {
    'en-us': 'Reports',
    'ru-ru': 'Отчеты',
    ca: 'Reports',
    'es-es': 'Reports',
  },
  labels: {
    'en-us': 'Labels',
    'ru-ru': 'Этикетки',
    ca: 'Labels',
    'es-es': 'Labels',
  },
  edit: {
    'en-us': 'Edit',
    'ru-ru': 'Редактировать',
    ca: 'Edit',
    'es-es': 'Edit',
  },
  ignore: {
    'en-us': 'Ignore',
    'ru-ru': 'Игнорировать',
    ca: 'Ignore',
    'es-es': 'Ignore',
  },
  logIn: {
    'en-us': 'Log In',
    'ru-ru': 'Авторизоваться',
    ca: 'Log In',
    'es-es': 'Log In',
  },
  start: {
    'en-us': 'Start',
    'ru-ru': 'Начало',
    ca: 'Start',
    'es-es': 'Start',
  },
  end: {
    'en-us': 'End',
    'ru-ru': 'Конец',
    ca: 'End',
    'es-es': 'End',
  },
  update: {
    'en-us': 'Update',
    'ru-ru': 'Обновить',
    ca: 'Update',
    'es-es': 'Update',
  },
  generate: {
    'en-us': 'Generate',
    'ru-ru': 'Генерировать',
    ca: 'Generate',
    'es-es': 'Generate',
  },
  loadingInline: {
    'en-us': '(loading...)',
    'ru-ru': '(загрузка...)',
    ca: '(loading...)',
    'es-es': '(loading...)',
  },
  listTruncated: {
    'en-us': '(list truncated)',
    'ru-ru': '(список усечен)',
    ca: '(list truncated)',
    'es-es': '(list truncated)',
  },
  metadataInline: {
    'en-us': 'Metadata:',
    'ru-ru': 'Метаданные:',
    ca: 'Metadata:',
    'es-es': 'Metadata:',
  },
  metadata: {
    'en-us': 'Metadata',
    'ru-ru': 'Метаданные',
    ca: 'Metadata',
    'es-es': 'Metadata',
  },
  query: {
    'en-us': 'Query',
    'ru-ru': 'Запрос',
    ca: 'Consulta',
    'es-es': 'Query',
  },
  unmapped: {
    'en-us': 'Unmapped',
    'ru-ru': 'Не сопоставлений',
    ca: 'Unmapped',
    'es-es': 'Unmapped',
  },
  mapped: {
    'en-us': 'Mapped',
    'ru-ru': 'Сопоставлений',
    ca: 'Mapped',
    'es-es': 'Mapped',
  },
  expand: {
    'en-us': 'Expand',
    'ru-ru': 'Расширить',
    ca: 'Expand',
    'es-es': 'Expand',
  },
  geoMap: {
    'en-us': 'GeoMap',
    'ru-ru': 'Карта',
    ca: 'GeoMap',
    'es-es': 'GeoMap',
  },
  fullDate: {
    'en-us': 'Full Date',
    'ru-ru': 'Полная дата',
    ca: 'Full Date',
    'es-es': 'Full Date',
  },
  view: {
    'en-us': 'View',
    'ru-ru': 'Смотреть',
    ca: 'View',
    'es-es': 'View',
  },
  addChild: {
    'en-us': 'Add Child',
    'ru-ru': 'Добавить Ребенка',
    ca: 'Add Child',
    'es-es': 'Add Child',
  },
  move: {
    'en-us': 'Move',
    'ru-ru': 'Переместить',
    ca: 'Move',
    'es-es': 'Move',
  },
  opensInNewTab: {
    'en-us': '(opens in a new tab)',
    'ru-ru': '(открывается в новой вкладке)',
    ca: '(opens in a new tab)',
    'es-es': '(opens in a new tab)',
  },

  // Toolbar
  skipToContent: {
    'en-us': 'Skip to Content',
    'ru-ru': 'Перейти к содержанию',
    ca: 'Saltar al contingut',
    'es-es': 'Skip to Content',
  },
  goToHomepage: {
    'en-us': 'Go to homepage',
    'ru-ru': 'Вернуться на домашнюю страницу',
    ca: "Vés a la pàgina d'inici",
    'es-es': 'Go to homepage',
  },
  currentUser: {
    'en-us': 'Current User',
    'ru-ru': 'Текущий пользователь',
    ca: 'Usuari actual',
    'es-es': 'Current User',
  },
  currentCollection: {
    'en-us': 'Current Collection',
    'ru-ru': 'Текущая коллекция',
    ca: 'Col·lecció actual',
    'es-es': 'Current Collection',
  },
  actions: {
    'en-us': 'Actions:',
    'ru-ru': 'Действия:',
    ca: 'Accions:',
    'es-es': 'Actions:',
  },

  // Login screen
  username: {
    'en-us': 'Username',
    'ru-ru': 'Имя пользователя',
    ca: "Nom d'usuari",
    'es-es': 'Username',
  },
  password: {
    'en-us': 'Password',
    'ru-ru': 'Пароль',
    ca: 'Contrasenya',
    'es-es': 'Password',
  },
  login: {
    'en-us': 'Login',
    'ru-ru': 'Вход',
    ca: 'Iniciar Sessió',
    'es-es': 'Login',
  },

  // Choose Collection
  chooseCollection: {
    'en-us': 'Choose Collection',
    'ru-ru': 'Выбрать коллекцию',
    ca: 'Trieu Col·lecció',
    'es-es': 'Choose Collection',
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
    'es-es': (loginLink: (label: string) => JSX.Element) => (
      <>
        The logged in user has not been given access to any collections in this
        database. You must {loginLink('login')} as another user.
      </>
    ),
  },

  // Change Password
  changePassword: {
    'en-us': 'Change Password',
    'ru-ru': 'Изменить пароль',
    ca: 'Canvia la contrasenya',
    'es-es': 'Change Password',
  },
  oldPassword: {
    'en-us': 'Old password',
    'ru-ru': 'Предыдущий пароль',
    ca: 'Contrasenya anterior',
    'es-es': 'Old password',
  },
  newPassword: {
    'en-us': 'New password',
    'ru-ru': 'iНовый пароль',
    ca: 'Nova contrasenya',
    'es-es': 'New password',
  },
  repeatPassword: {
    'en-us': 'Repeat new password',
    'ru-ru': 'Повторите новый пароль',
    ca: 'Repetiu la contrasenya nova',
    'es-es': 'Repeat new password',
  },

  // Menu Bar & User Tools
  notifications: {
    'en-us': (count: number | string) => `Notifications: ${count}`,
    'ru-ru': (count: number | string) => `Уведомлений: ${count}`,
    ca: (count: number | string) => `Notifications: ${count}`,
    'es-es': (count: number | string) => `Notifications: ${count}`,
  },
  attachments: {
    'en-us': 'Attachments',
    'ru-ru': 'Вложения',
    ca: 'Attachments',
    'es-es': 'Attachments',
  },
  dataEntry: {
    'en-us': 'Data Entry',
    'ru-ru': 'Ввод данных',
    ca: 'Data Entry',
    'es-es': 'Data Entry',
  },
  makeDwca: {
    'en-us': 'Make DwCA',
    'ru-ru': 'Создать DwCA',
    ca: 'Make DwCA',
    'es-es': 'Make DwCA',
  },
  definitionResourceNotFound: {
    'en-us': (resourceName: string) =>
      `Definition resource "${resourceName}" was not found.`,
    'ru-ru': (resourceName: string) =>
      `Ресурс определения "${resourceName}" не найден.`,
    ca: (resourceName: string) =>
      `Definition resource "${resourceName}" was not found.`,
    'es-es': (resourceName: string) =>
      `Definition resource "${resourceName}" was not found.`,
  },
  metadataResourceNotFound: {
    'en-us': (resourceName: string) =>
      `Metadata resource "${resourceName}" was not found.`,
    'ru-ru': (resourceName: string) =>
      `Ресурс метаданных "${resourceName}" не найден.`,
    ca: (resourceName: string) =>
      `Metadata resource "${resourceName}" was not found.`,
    'es-es': (resourceName: string) =>
      `Metadata resource "${resourceName}" was not found.`,
  },
  updateExportFeed: {
    'en-us': 'Update Feed Now',
    'ru-ru': 'Обновить фид',
    ca: 'Update Feed Now',
    'es-es': 'Update Feed Now',
  },
  updateExportFeedDialogTitle: {
    'en-us': 'Export Feed',
    'ru-ru': 'Экспорт фида',
    ca: 'Export Feed',
    'es-es': 'Export Feed',
  },
  updateExportFeedDialogHeader: {
    'en-us': 'Update all export feed items now?',
    'ru-ru': 'Обновить все элементы фида экспорта сейчас?',
    ca: 'Update all export feed items now?',
    'es-es': 'Update all export feed items now?',
  },
  updateExportFeedDialogMessage: {
    'en-us': 'Update all export feed items now?',
    'ru-ru': 'Обновить все элементы фида экспорта сейчас?',
    ca: 'Update all export feed items now?',
    'es-es': 'Update all export feed items now?',
  },
  feedExportStartedDialogTitle: {
    'en-us': 'Export Feed',
    'ru-ru': 'Экспорт фида',
    ca: 'Export Feed',
    'es-es': 'Export Feed',
  },
  feedExportStartedDialogHeader: {
    'en-us': 'Export feed update started',
    'ru-ru': 'Начато обновление экспортного фида',
    ca: 'Export feed update started',
    'es-es': 'Export feed update started',
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
    'es-es': `
      Update started. You will receive a notification for each feed item
      updated.`,
  },
  dwcaExportStartedDialogTitle: {
    'en-us': 'DwCA',
    'ru-ru': 'DwCA',
    ca: 'DwCA',
    'es-es': 'DwCA',
  },
  dwcaExportStartedDialogHeader: {
    'en-us': 'DwCA export started',
    'ru-ru': 'DwCA экспорт начат',
    ca: 'DwCA export started',
    'es-es': 'DwCA export started',
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
    'es-es': `
      Export started. You will receive a notification
      when the export is complete.`,
  },
  interactions: {
    'en-us': 'Interactions',
    'ru-ru': 'Взаимодействия',
    ca: 'Interactions',
    'es-es': 'Interactions',
  },
  generateMasterKey: {
    'en-us': 'Generate Master Key',
    'ru-ru': 'Сгенерировать мастер-ключ',
    ca: 'Generate Master Key',
    'es-es': 'Generate Master Key',
  },
  generateMasterKeyDialogTitle: {
    'en-us': 'Master Key',
    'ru-ru': 'Мастер ключ',
    ca: 'Master Key',
    'es-es': 'Master Key',
  },
  generateMasterKeyDialogHeader: {
    'en-us': 'Generate Master Key',
    'ru-ru': 'Сгенерировать мастер-ключ',
    ca: 'Generate Master Key',
    'es-es': 'Generate Master Key',
  },
  userPassword: {
    'en-us': 'User Password:',
    'ru-ru': 'Пользовательский пароль:',
    ca: 'User Password:',
    'es-es': 'User Password:',
  },
  masterKeyDialogTitle: {
    'en-us': 'Master Key',
    'ru-ru': 'Мастер ключ',
    ca: 'Master Key',
    'es-es': 'Master Key',
  },
  masterKeyDialogHeader: {
    'en-us': 'Master key generated',
    'ru-ru': 'Мастер-ключ создан',
    ca: 'Master key generated',
    'es-es': 'Master key generated',
  },
  masterKeyFieldLabel: {
    'en-us': 'Master Key:',
    'ru-ru': 'Мастер ключ:',
    ca: 'Master Key:',
    'es-es': 'Master Key:',
  },
  incorrectPassword: {
    'en-us': 'Password was incorrect.',
    'ru-ru': 'Пароль неверный.',
    ca: 'Password was incorrect.',
    'es-es': 'Password was incorrect.',
  },
  ascending: {
    'en-us': 'Ascending',
    'ru-ru': 'По возрастанию',
    ca: 'Ascending',
    'es-es': 'Ascending',
  },
  descending: {
    'en-us': 'Descending',
    'ru-ru': 'По убыванию',
    ca: 'Descending',
    'es-es': 'Descending',
  },
  queries: {
    'en-us': 'Queries',
    'ru-ru': 'Запросы',
    ca: 'Queries',
    'es-es': 'Queries',
  },
  queriesDialogTitle: {
    'en-us': (count: number) => `Queries (${count})`,
    'ru-ru': (count: number) => `Запросы (${count})`,
    ca: (count: number) => `Queries (${count})`,
    'es-es': (count: number) => `Queries (${count})`,
  },
  newQueryDialogTitle: {
    'en-us': 'New Query Type',
    'ru-ru': 'Новый запрос',
    ca: 'New Query Type',
    'es-es': 'New Query Type',
  },
  exportQueryForDwca: {
    'en-us': 'Export query for DwCA definition.',
    'ru-ru': 'Экспорт запрос для DwCA.',
    ca: 'Export query for DwCA definition.',
    'es-es': 'Export query for DwCA definition.',
  },
  exportQueryForDwcaDialogTitle: {
    'en-us': 'Query XML for DwCA definition',
    'ru-ru': 'XML Запроса для определения DwCA',
    ca: 'Query XML for DwCA definition',
    'es-es': 'Query XML for DwCA definition',
  },
  exportQueryForDwcaDialogHeader: {
    'en-us': 'Query XML for DwCA definition',
    'ru-ru': 'XML Запроса для определения DwCA',
    ca: 'Query XML for DwCA definition',
    'es-es': 'Query XML for DwCA definition',
  },
  exportQueryAsReport: {
    'en-us': 'Define report based on query.',
    'ru-ru': 'Определите отчет на основе запроса.',
    ca: 'Define report based on query.',
    'es-es': 'Define report based on query.',
  },
  exportQueryAsLabel: {
    'en-us': 'Define label based on query.',
    'ru-ru': 'Определите метку на основе запроса.',
    ca: 'Define label based on query.',
    'es-es': 'Define label based on query.',
  },
  newResourceTitle: {
    'en-us': (resourceName: string) => `New ${resourceName}`,
    'ru-ru': (resourceName: string) => `Новый ${resourceName}`,
    ca: (resourceName: string) => `New ${resourceName}`,
    'es-es': (resourceName: string) => `New ${resourceName}`,
  },
  labelName: {
    'en-us': 'Label Name',
    'ru-ru': 'Название ярлыка',
    ca: 'Label Name',
    'es-es': 'Label Name',
  },
  reportName: {
    'en-us': 'Report Name',
    'ru-ru': 'Название отчета',
    ca: 'Report Name',
    'es-es': 'Report Name',
  },
  createLabelDialogTitle: {
    'en-us': 'Labels',
    'ru-ru': 'Этикетки',
    ca: 'Labels',
    'es-es': 'Labels',
  },
  createLabelDialogHeader: {
    'en-us': 'Create new label',
    'ru-ru': 'Создать новую этикетку',
    ca: 'Create new label',
    'es-es': 'Create new label',
  },
  createReportDialogTitle: {
    'en-us': 'Reports',
    'ru-ru': 'Отчеты',
    ca: 'Reports',
    'es-es': 'Reports',
  },
  createReportDialogHeader: {
    'en-us': 'Create new report',
    'ru-ru': 'Создать новый отчет',
    ca: 'Create new report',
    'es-es': 'Create new report',
  },
  recordSets: {
    'en-us': 'Record Sets',
    'ru-ru': 'Наборы объектов',
    ca: 'Record Sets',
    'es-es': 'Record Sets',
  },
  resources: {
    'en-us': 'Resources',
    'ru-ru': 'Ресурсы',
    ca: 'Resources',
    'es-es': 'Resources',
  },
  appResources: {
    'en-us': 'App Resources',
    'ru-ru': 'Ресурсы приложения',
    ca: 'App Resources',
    'es-es': 'App Resources',
  },
  viewSets: {
    'en-us': 'View Sets',
    'ru-ru': 'Ресурсы для просмотров',
    ca: 'View Sets',
    'es-es': 'View Sets',
  },
  resourcesDialogTitle: {
    'en-us': 'Resources',
    'ru-ru': 'Ресурсы',
    ca: 'Resources',
    'es-es': 'Resources',
  },
  resourcesDialogHeader: {
    'en-us': 'Choose the resource type you wish to edit:',
    'ru-ru': 'Выберите тип ресурса, который хотите отредактировать:',
    ca: 'Choose the resource type you wish to edit:',
    'es-es': 'Choose the resource type you wish to edit:',
  },
  repairTree: {
    'en-us': 'Repair Tree',
    'ru-ru': 'Ремонтировать дерево',
    ca: 'Repair Tree',
    'es-es': 'Repair Tree',
  },
  trees: {
    'en-us': 'Trees',
    'ru-ru': 'Деревья',
    ca: 'Trees',
    'es-es': 'Trees',
  },
  treesDialogTitle: {
    'en-us': 'Trees',
    'ru-ru': 'Деревья',
    ca: 'Trees',
    'es-es': 'Trees',
  },
  recordSet: {
    'en-us': 'Record Set',
    'ru-ru': 'Набор объектов',
    ca: 'Record Set',
    'es-es': 'Record Set',
  },
  recordCount: {
    'en-us': 'Record Count',
    'ru-ru': 'Количество объектов',
    ca: 'Record Count',
    'es-es': 'Record Count',
  },
  size: {
    'en-us': 'Size',
    'ru-ru': 'Размер',
    ca: 'Size',
    'es-es': 'Size',
  },
  manageUsers: {
    'en-us': 'Manage Users',
    'ru-ru': 'Управление пользователями',
    ca: 'Manage Users',
    'es-es': 'Manage Users',
  },
  manageUsersDialogTitle: {
    'en-us': 'Manage Users',
    'ru-ru': 'Управление пользователями',
    ca: 'Manage Users',
    'es-es': 'Manage Users',
  },
  workbench: {
    'en-us': 'WorkBench',
    'ru-ru': 'WorkBench',
    ca: 'WorkBench',
    'es-es': 'WorkBench',
  },
  chooseDwcaDialogTitle: {
    'en-us': 'Choose DwCA',
    'ru-ru': 'Выберите DwCA',
    ca: 'Choose DwCA',
    'es-es': 'Choose DwCA',
  },
  dwcaDefinition: {
    'en-us': 'DwCA definition:',
    'ru-ru': 'Определение DwCA:',
    ca: 'DwCA definition:',
    'es-es': 'DwCA definition:',
  },
  metadataResource: {
    'en-us': 'Metadata resource:',
    'ru-ru': 'Ресурс метаданных:',
    ca: 'Metadata resource:',
    'es-es': 'Metadata resource:',
  },
  // Error Boundary
  errorBoundaryDialogTitle: {
    'en-us': 'Unexpected Error',
    'ru-ru': 'Неожиданная ошибка',
    ca: 'Unexpected Error',
    'es-es': 'Unexpected Error',
  },
  errorBoundaryDialogHeader: {
    'en-us': 'An unexpected error has occurred',
    'ru-ru': 'Произошла неожиданная ошибка',
    ca: 'An unexpected error has occurred',
    'es-es': 'An unexpected error has occurred',
  },
  errorBoundaryDialogMessage: {
    'en-us': 'Please reload the page and try again.',
    'ru-ru': 'Пожалуйста, обновите страницу и попробуйте еще раз.',
    ca: 'Please reload the page and try again.',
    'es-es': 'Please reload the page and try again.',
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
    'es-es': (email: JSX.Element) => (
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
    'es-es': 'Error Message',
  },
  backEndErrorDialogTitle: {
    'en-us': 'Server Error',
    'ru-ru': 'Ошибка на сервере',
    ca: 'Server Error',
    'es-es': 'Server Error',
  },
  backEndErrorDialogHeader: {
    'en-us': 'An error occurred communicating with the Specify 7 server.',
    'ru-ru': 'Произошла ошибка связи с сервером Specify 7.',
    ca: 'An error occurred communicating with the Specify 7 server.',
    'es-es': 'An error occurred communicating with the Specify 7 server.',
  },
  // Search
  expressSearch: {
    'en-us': 'Express Search',
    'ru-ru': 'Экспресс поиск',
    ca: 'Express Search',
    'es-es': 'Express Search',
  },
  primarySearch: {
    'en-us': 'Primary Search',
    'ru-ru': 'Первичный поиск',
    ca: 'Primary Search',
    'es-es': 'Primary Search',
  },
  secondarySearch: {
    'en-us': 'Secondary Search',
    'ru-ru': 'Вторичный поиск',
    ca: 'Secondary Search',
    'es-es': 'Secondary Search',
  },
  running: {
    'en-us': 'Running...',
    'ru-ru': 'Выполнение...',
    ca: 'Running...',
    'es-es': 'Running...',
  },
  noMatches: {
    'en-us': 'No Matches',
    'ru-ru': 'Нет совпадений',
    ca: 'No Matches',
    'es-es': 'No Matches',
  },
  searchQuery: {
    'en-us': 'Search Query',
    'ru-ru': 'Поиск',
    ca: 'Search Query',
    'es-es': 'Search Query',
  },
  unknown: {
    'en-us': 'Unknown',
    'ru-ru': 'Неизвестный',
    ca: 'Unknown',
    'es-es': 'Unknown',
  },
  // Unload Protection
  leavePageDialogTitle: {
    'en-us': 'Unsaved changes detected',
    'ru-ru': 'Обнаружены несохраненные изменения',
    ca: 'Unsaved changes detected',
    'es-es': 'Unsaved changes detected',
  },
  leavePageDialogHeader: {
    'en-us': 'Are you sure you want to leave this page?',
    'ru-ru': 'Вы уверены, что хотите покинуть эту страницу?',
    ca: 'Are you sure you want to leave this page?',
    'es-es': 'Are you sure you want to leave this page?',
  },
  // FIXME: localize
  leavePageDialogMessage: {
    'en-us': 'Unsaved changes would be lost if your leave this page',
    'ru-ru': 'Unsaved changes would be lost if your leave this page',
    ca: 'Unsaved changes would be lost if your leave this page',
    'es-es': 'Unsaved changes would be lost if your leave this page',
  },
  leave: {
    'en-us': 'Leave',
    'ru-ru': 'Покинуть',
    ca: 'Leave',
    'es-es': 'Leave',
  },
  // Notifications
  notificationsDialogTitle: {
    'en-us': 'Notifications',
    'ru-ru': 'Уведомления',
    ca: 'Notifications',
    'es-es': 'Notifications',
  },
  feedItemUpdated: {
    'en-us': 'Export feed item updated.',
    'ru-ru': 'Элемент фида экспорта обновлен.',
    ca: 'Export feed item updated.',
    'es-es': 'Export feed item updated.',
  },
  updateFeedFailed: {
    'en-us': 'Export feed update failed.',
    'ru-ru': 'Не удалось обновить экспортный канал.',
    ca: 'Export feed update failed.',
    'es-es': 'Export feed update failed.',
  },
  exception: {
    'en-us': 'Exception',
    'ru-ru': 'Трассировка стека',
    ca: 'Exception',
    'es-es': 'Exception',
  },
  download: {
    'en-us': 'Download',
    'ru-ru': 'Скачать',
    ca: 'Download',
    'es-es': 'Download',
  },
  dwcaExportCompleted: {
    'en-us': 'DwCA export completed.',
    'ru-ru': 'Экспорт в DwCA завершен.',
    ca: 'DwCA export completed.',
    'es-es': 'DwCA export completed.',
  },
  dwcaExportFailed: {
    'en-us': 'DwCA export failed.',
    'ru-ru': 'Не удалось экспортировать DwCA.',
    ca: 'DwCA export failed.',
    'es-es': 'DwCA export failed.',
  },
  queryExportToCsvCompleted: {
    'en-us': 'Query export to CSV completed.',
    'ru-ru': 'Экспорт запроса в CSV завершен.',
    ca: 'Query export to CSV completed.',
    'es-es': 'Query export to CSV completed.',
  },
  queryExportToKmlCompleted: {
    'en-us': 'Query export to KML completed.',
    'ru-ru': 'Экспорт запроса в KML завершен.',
    ca: 'Query export to KML completed.',
    'es-es': 'Query export to KML completed.',
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
    'es-es': (userName: JSX.Element, dataSetName: JSX.Element) => (
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
    'es-es': `
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
    'es-es': `
      The requested resource cannot be accessed while logged into the
      current collection.`,
  },
  selectCollection: {
    'en-us': 'Select one of the following collections:',
    'ru-ru': 'Выберите одну из следующих коллекций:',
    ca: 'Select one of the following collections:',
    'es-es': 'Select one of the following collections:',
  },
  collection: {
    'en-us': 'Collection',
    'ru-ru': 'Коллекция',
    ca: 'Collection',
    'es-es': 'Collection',
  },
  loginToProceed: {
    'en-us': (collectionName: string) => `
       You can login to the collection, ${collectionName}, to proceed:`,
    'ru-ru': (collectionName: string) => `
       Вы можете войти в коллекцию, ${collectionName}, чтобы продолжить:`,
    ca: (collectionName: string) => `
       You can login to the collection, ${collectionName}, to proceed:`,
    'es-es': (collectionName: string) => `
       You can login to the collection, ${collectionName}, to proceed:`,
  },
  // SpecifyApp
  versionMismatchDialogTitle: {
    'en-us': 'Version Mismatch',
    'ru-ru': 'Несоответствие версий',
    ca: 'Version Mismatch',
    'es-es': 'Version Mismatch',
  },
  versionMismatchDialogHeader: {
    'en-us': 'Specify version does not match database version',
    'ru-ru': 'Specify версия не соответствует версии базы данных',
    ca: 'Specify version does not match database version',
    'es-es': 'Specify version does not match database version',
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
    'es-es': (specifySixVersion: string, databaseVersion: string) => `
      The Specify version ${specifySixVersion} does not match the database
      version ${databaseVersion}.`,
  },
  versionMismatchSecondDialogMessage: {
    'en-us':
      'Some features of Specify 7 may therefore fail to operate correctly.',
    'ru-ru': 'Поэтому некоторые функции Specify 7 могут неработать.',
    ca: 'Some features of Specify 7 may therefore fail to operate correctly.',
    'es-es':
      'Some features of Specify 7 may therefore fail to operate correctly.',
  },
  resourceDeletedDialogTitle: {
    'en-us': 'Deleted',
    'ru-ru': 'Удалено',
    ca: 'Deleted',
    'es-es': 'Deleted',
  },
  resourceDeletedDialogHeader: {
    'en-us': 'Item deleted',
    'ru-ru': 'Удалено',
    ca: 'Item deleted',
    'es-es': 'Item deleted',
  },
  resourceDeletedDialogMessage: {
    'en-us': 'Item was deleted successfully.',
    'ru-ru': 'Успешно удален.',
    ca: 'Item was deleted successfully.',
    'es-es': 'Item was deleted successfully.',
  },
  appTitle: {
    'en-us': (baseTitle: string) => `${baseTitle} | Specify 7`,
    'ru-ru': (baseTitle: string) => `${baseTitle} | Specify 7`,
    ca: (baseTitle: string) => `${baseTitle} | Specify 7`,
    'es-es': (baseTitle: string) => `${baseTitle} | Specify 7`,
  },
  // StartApp
  sessionTimeOutDialogTitle: {
    'en-us': 'Access denied',
    'ru-ru': 'Доступе Отказано',
    ca: 'Access denied',
    'es-es': 'Access denied',
  },
  sessionTimeOutDialogHeader: {
    'en-us': 'Insufficient Privileges',
    'ru-ru': 'Insufficient Privileges',
    ca: 'Insufficient Privileges',
    'es-es': 'Insufficient Privileges',
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
    'es-es': `
      You lack sufficient privileges for that action, or your current
      session has been logged out.`,
  },
  // UserTools
  logOut: {
    'en-us': 'Log out',
    'ru-ru': 'Выйти',
    ca: 'Log out',
    'es-es': 'Log out',
  },
  userToolsDialogTitle: {
    'en-us': 'User Tools',
    'ru-ru': 'Инструменты',
    ca: 'User Tools',
    'es-es': 'User Tools',
  },
  language: {
    'en-us': 'Language:',
    'ru-ru': 'Язык:',
    ca: 'Language:',
    'es-es': 'Language:',
  },
  helpLocalizeSpecify: {
    'en-us': 'Help Localize Specify 7',
    'ru-ru': 'Помогти локализовать Specify 7',
    ca: 'Help Localize Specify 7',
    'es-es': 'Help Localize Specify 7',
  },
  helpLocalizeSpecifyDialogMessage: {
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
    ca: (emailLink: JSX.Element) => (
      <>
        We would be very grateful for your support localizing Specify 7 User
        Interface. If you are interested, please send an email to {emailLink}
      </>
    ),
    'es-es': (emailLink: JSX.Element) => (
      <>
        We would be very grateful for your support localizing Specify 7 User
        Interface. If you are interested, please send an email to {emailLink}
      </>
    ),
  },
  changeLanguage: {
    'en-us': 'Change Language',
    'ru-ru': 'Изменить Язык',
    ca: 'Change Language',
    'es-es': 'Change Language',
  },
  schemaConfig: {
    'en-us': 'Schema Config',
    'ru-ru': 'Конфигурация схемы',
    ca: "Configuració d'esquema",
    'es-es': 'Schema Config',
  },
  unsavedSchemaUnloadProtect: {
    'en-us': 'Schema changes have not been saved',
    'ru-ru': 'Изменения схемы не сохранены',
    ca: "Els canvis d'esquema no s'han desat",
    'es-es': 'Schema changes have not been saved',
  },

  // Schema Config
  changeBaseTable: {
    'en-us': 'Change Base Table',
    'ru-ru': 'Изменить базовую таблицу',
    ca: 'Change Base Table',
    'es-es': 'Change Base Table',
  },
  fields: {
    'en-us': 'Fields',
    'ru-ru': 'Поля',
    ca: 'Camps',
    'es-es': 'Fields',
  },
  field: {
    'en-us': 'Field',
    'ru-ru': 'Поле',
    ca: 'Camp',
    'es-es': 'Field',
  },
  relationships: {
    'en-us': 'Relationships',
    'ru-ru': 'Отношения',
    ca: 'Relacions',
    'es-es': 'Relationships',
  },
  caption: {
    'en-us': 'Caption',
    'ru-ru': 'Подпись',
    ca: 'Subtítol',
    'es-es': 'Caption',
  },
  description: {
    'en-us': 'Descripion',
    'ru-ru': 'Описание',
    ca: 'Descripció',
    'es-es': 'Descripion',
  },
  hideTable: {
    'en-us': 'Hide Table',
    'ru-ru': 'Скрыть таблицу',
    ca: 'Oculta la taula',
    'es-es': 'Hide Table',
  },
  hideField: {
    'en-us': 'Hide Field',
    'ru-ru': 'Скрыть поле',
    ca: 'Oculta el camp',
    'es-es': 'Hide Field',
  },
  tableFormat: {
    'en-us': 'Table Format',
    'ru-ru': 'Формат таблицы',
    ca: 'Format de taula',
    'es-es': 'Table Format',
  },
  tableAggregation: {
    'en-us': 'Table Aggregation',
    'ru-ru': 'Агрегация таблиц',
    ca: 'Agregació de taules',
    'es-es': 'Table Aggregation',
  },
  type: {
    'en-us': 'Type',
    'ru-ru': 'Тип',
    ca: 'Tipus',
    'es-es': 'Type',
  },
  oneToOne: {
    'en-us': 'One-to-one',
    'ru-ru': 'Один к одному',
    ca: 'Un a un',
    'es-es': 'One-to-one',
  },
  oneToMany: {
    'en-us': 'One-to-many',
    'ru-ru': 'Один ко многим',
    ca: 'Un a molts',
    'es-es': 'One-to-many',
  },
  manyToOne: {
    'en-us': 'Many-to-one',
    'ru-ru': 'Многие к одному',
    ca: 'Molts a un',
    'es-es': 'Many-to-one',
  },
  manyToMany: {
    'en-us': 'many-to-many',
    'ru-ru': 'Многие-ко-многим',
    ca: 'Molts a molts',
    'es-es': 'many-to-many',
  },
  length: {
    'en-us': 'Length',
    'ru-ru': 'Длина',
    ca: 'Llargada',
    'es-es': 'Length',
  },
  readOnly: {
    'en-us': 'Read-only',
    'ru-ru': 'Только чтение',
    ca: 'Llegeix només',
    'es-es': 'Read-only',
  },
  required: {
    'en-us': 'Required',
    'ru-ru': 'Необходимый',
    ca: 'Obligatori',
    'es-es': 'Required',
  },
  fieldFormat: {
    'en-us': 'Field Format',
    'ru-ru': 'Формат поля',
    ca: 'Format de camp',
    'es-es': 'Field Format',
  },
  none: {
    'en-us': 'None',
    'ru-ru': 'Нет',
    ca: 'Cap',
    'es-es': 'None',
  },
  noneAvailable: {
    'en-us': 'None available',
    'ru-ru': 'Нет доступных вариантов',
    ca: 'Cap disponible',
    'es-es': 'None available',
  },
  formatted: {
    'en-us': 'Formatted',
    'ru-ru': 'Форматирован',
    ca: 'Formatat',
    'es-es': 'Formatted',
  },
  webLink: {
    'en-us': 'Web Link',
    'ru-ru': 'Интернет-ссылка',
    ca: 'Enllaç web',
    'es-es': 'Web Link',
  },
  pickList: {
    'en-us': 'Pick List',
    'ru-ru': 'Список выбора',
    ca: 'Llista de selecció',
    'es-es': 'Pick List',
  },
  system: {
    'en-us': 'System',
    'ru-ru': 'Системное',
    ca: 'Sistema',
    'es-es': 'System',
  },
  userDefined: {
    'en-us': 'User Defined',
    'ru-ru': 'Создано пользователем',
    ca: "Creat per l'usuari",
    'es-es': 'User Defined',
  },
  default: {
    'en-us': 'Default',
    'ru-ru': 'Умолчание',
    ca: 'Per defecte',
    'es-es': 'Default',
  },
  addLanguage: {
    'en-us': 'Add Language',
    'ru-ru': 'Добавить язык',
    ca: "Afegeix l'idioma",
    'es-es': 'Add Language',
  },
  addLanguageDialogTitle: {
    'en-us': 'Add Language',
    'ru-ru': 'Добавить язык',
    ca: "Afegeix l'idioma",
    'es-es': 'Add Language',
  },
  addLanguageDialogHeader: {
    'en-us': 'Add new language',
    'ru-ru': 'Добавить новый язык',
    ca: 'Afegeix un nou idioma',
    'es-es': 'Add new language',
  },
  country: {
    'en-us': 'Country',
    'ru-ru': 'Страна',
    ca: 'País',
    'es-es': 'Country',
  },
  transactions: {
    'en-us': 'Transactions',
    'ru-ru': 'Транзакции',
    ca: 'Transactions',
    'es-es': 'Transactions',
  },
  viewRecord: {
    'en-us': 'View Record',
    'ru-ru': 'Открыть запись',
    ca: 'View Record',
    'es-es': 'View Record',
  },
  viewRecords: {
    'en-us': 'View Records',
    'ru-ru': 'Открыть записи',
    ca: 'View Records',
    'es-es': 'View Records',
  },
  selectRecord: {
    'en-us': 'Select Record',
    'ru-ru': 'Выбрать Элемент',
    ca: 'Select Record',
    'es-es': 'Select Record',
  },
  preferences: {
    'en-us': 'Preferences',
    'ru-ru': 'Настройки',
    ca: 'Preferences',
    'es-es': 'Preferences',
  },
  nullInline: {
    'en-us': '(null)',
    'ru-ru': '(нулевой)',
    ca: '(null)',
    'es-es': '(null)',
  },
  filePickerMessage: {
    'en-us': 'Choose a file or drag it here',
    'ru-ru': 'Выберите файл или перетащите его сюда',
    ca: 'Choose a file or drag it here',
    'es-es': 'Choose a file or drag it here',
  },
  selectedFileName: {
    'en-us': (fileName: string) => `Selected file: ${fileName}`,
    'ru-ru': (fileName: string) => `Выбранный файл: ${fileName}`,
    ca: (fileName: string) => `Selected file: ${fileName}`,
    'es-es': (fileName: string) => `Selected file: ${fileName}`,
  },
  all: {
    'en-us': 'All',
    'ru-ru': 'Все',
    ca: 'All',
    'es-es': 'All',
  },
  unused: {
    'en-us': 'Unused',
    'ru-ru': 'Неиспользованные',
    ca: 'Unused',
    'es-es': 'Unused',
  },
  tables: {
    'en-us': 'Tables',
    'ru-ru': 'Таблицы',
    ca: 'Tables',
    'es-es': 'Tables',
  },
  label: {
    'en-us': 'Label',
    'ru-ru': 'Локализованный',
    ca: 'Label',
    'es-es': 'Label',
  },
  hidden: {
    'en-us': 'Hidden',
    'ru-ru': 'Скрытый',
    ca: 'Hidden',
    'es-es': 'Hidden',
  },
  databaseColumn: {
    'en-us': 'Database Column',
    'ru-ru': 'Столбец базы данных',
    ca: 'Database Column',
    'es-es': 'Database Column',
  },
  relatedModel: {
    'en-us': 'Related Model',
    'ru-ru': 'Таблица',
    ca: 'Related Model',
    'es-es': 'Related Model',
  },
  otherSideName: {
    'en-us': 'Other side name',
    'ru-ru': 'Имя другой стороны',
    ca: 'Other side name',
    'es-es': 'Other side name',
  },
  dependent: {
    'en-us': 'Dependent',
    'ru-ru': 'Зависимый',
    ca: 'Dependent',
    'es-es': 'Dependent',
  },
  viewAsJson: {
    'en-us': 'View as JSON',
    'ru-ru': 'Посмотреть как JSON',
    ca: 'View as JSON',
    'es-es': 'View as JSON',
  },
  tableId: {
    'en-us': 'Table ID',
    'ru-ru': 'Идентификатор',
    ca: 'Table ID',
    'es-es': 'Table ID',
  },
  fieldCount: {
    'en-us': 'Field count',
    'ru-ru': 'Количество полей',
    ca: 'Field count',
    'es-es': 'Field count',
  },
  relationshipCount: {
    'en-us': 'Relationship count',
    'ru-ru': 'Количество отношений',
    ca: 'Relationship count',
    'es-es': 'Relationship count',
  },
  datamodel: {
    'en-us': 'Data Model',
    'ru-ru': 'Схема базы данных',
    ca: 'Data Model',
    'es-es': 'Data Model',
  },
  // FIXME: localize
  tableApi: {
    'en-us': 'Tables API documentation',
    'ru-ru': 'Tables API documentation',
    ca: 'Tables API documentation',
    'es-es': 'Tables API documentation',
  },
  operationsApi: {
    'en-us': 'Operations API documentation',
    'ru-ru': 'Operations API documentation',
    ca: 'Operations API documentation',
    'es-es': 'Operations API documentation',
  },
});

export default commonText;
